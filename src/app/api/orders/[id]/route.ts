import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        orderItems: {
          include: {
            service: true
          }
        },
        orderAddOns: {
          include: {
            addOn: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch {
    console.error('주문 조회 오류:', error)
    return NextResponse.json(
      { error: '주문 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // 현재 주문 상태 확인
    const currentOrder = await prisma.order.findUnique({
      where: { id }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태 변경 유효성 검사
    const validTransitions: { [key: string]: string[] } = {
      'PENDING': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // 완료된 주문은 변경 불가
      'CANCELLED': [] // 취소된 주문은 변경 불가
    }

    if (data.status && !validTransitions[currentOrder.status]?.includes(data.status)) {
      return NextResponse.json(
        { error: `${currentOrder.status}에서 ${data.status}로 상태 변경이 불가능합니다.` },
        { status: 400 }
      )
    }

    // 주문 업데이트 및 방문 기록 생성 (트랜잭션)
    const result = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.OrderUpdateInput = {}

      if (data.status) {
        updateData.status = data.status

        // 완료 시간 기록
        if (data.status === 'COMPLETED') {
          updateData.completedAt = new Date()
        }
      }

      if (data.notes !== undefined) {
        updateData.notes = data.notes
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          orderItems: {
            include: {
              service: true
            }
          },
          orderAddOns: {
            include: {
              addOn: true
            }
          }
        }
      })

      // PENDING → IN_PROGRESS: 패키지 주문인 경우 세션 정보 생성
      if (data.status === 'IN_PROGRESS' && currentOrder.status === 'PENDING') {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id },
          include: { service: true }
        })

        // 패키지 주문인지 확인
        for (const orderItem of orderItems) {
          const isPackagePurchase = orderItem.packageType &&
            (orderItem.packageType.toLowerCase().startsWith('package') &&
             orderItem.packageType !== 'single')

          if (isPackagePurchase) {
            // 패키지 횟수 추출
            let packageCount = 0
            if (orderItem.packageType.includes('_')) {
              packageCount = parseInt(orderItem.packageType.split('_')[1])
            } else {
              packageCount = parseInt(orderItem.packageType.replace(/\D/g, ''))
            }

            // 이 주문으로 구매할 패키지의 정보를 세션에 저장
            // (아직 PackagePurchase는 생성되지 않았지만, 세션 정보는 미리 준비)
            let sessionInfo: any = {}
            try {
              if (currentOrder.notes && currentOrder.notes.startsWith('{')) {
                sessionInfo = JSON.parse(currentOrder.notes)
              }
            } catch (e) {
              sessionInfo = { originalNotes: currentOrder.notes }
            }

            sessionInfo.packageSession = {
              packagePurchaseId: null, // 아직 생성 전이므로 null
              serviceName: orderItem.service.name,
              packageType: orderItem.packageType,
              totalCount: packageCount,
              usedInThisSession: 0,
              remainingCount: packageCount, // 아직 사용 전이므로 전체 횟수
              isPendingPurchase: true // 패키지 구매 대기 중 표시
            }

            // 주문 notes 업데이트
            await tx.order.update({
              where: { id },
              data: {
                notes: JSON.stringify(sessionInfo)
              }
            })

            break // 첫 번째 패키지 항목만 처리
          }
        }
      }

      // 주문이 완료 상태가 되면 자동으로 방문 기록 생성 및 패키지 차감
      if (data.status === 'COMPLETED' && currentOrder.status !== 'COMPLETED') {
        // 1. 방문 기록 생성
        const existingVisit = await tx.visit.findUnique({
          where: { orderId: id }
        })

        if (!existingVisit) {
          await tx.visit.create({
            data: {
              customerId: updatedOrder.customerId,
              orderId: id,
              visitDate: updatedOrder.completedAt || new Date()
            }
          })
        }

        // 2. 패키지 구매 및 사용 처리
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id },
          include: { service: true }
        })

        for (const orderItem of orderItems) {
          // 패키지 구매인 경우 (packageType이 package4, package8, package10 또는 PACKAGE_5, PACKAGE_10 등)
          const isPackagePurchase = orderItem.packageType &&
            (orderItem.packageType.toLowerCase().startsWith('package') &&
             orderItem.packageType !== 'single')

          if (isPackagePurchase) {
            // 패키지 횟수 추출
            // "package4" -> 4, "package8" -> 8, "PACKAGE_10" -> 10
            let packageCount = 0
            if (orderItem.packageType.includes('_')) {
              // PACKAGE_10 형식
              packageCount = parseInt(orderItem.packageType.split('_')[1])
            } else {
              // package4, package8 형식
              packageCount = parseInt(orderItem.packageType.replace(/\D/g, ''))
            }

            // 중복 생성 방지 - 이미 패키지 구매 기록이 있는지 확인
            const existingPackage = await tx.packagePurchase.findFirst({
              where: {
                orderId: id,
                customerId: updatedOrder.customerId,
                serviceId: orderItem.serviceId
              }
            })

            if (!existingPackage && packageCount > 0) {
              // 각 수량(quantity)마다 별도의 패키지 생성
              for (let i = 0; i < orderItem.quantity; i++) {
                await tx.packagePurchase.create({
                  data: {
                    orderId: id,
                    customerId: updatedOrder.customerId,
                    serviceId: orderItem.serviceId,
                    packageType: orderItem.packageType,
                    totalCount: packageCount,
                    remainingCount: packageCount,
                    purchasePrice: orderItem.totalPrice / orderItem.quantity, // 패키지당 가격
                    purchasedAt: updatedOrder.completedAt || new Date(),
                    status: 'ACTIVE'
                  }
                })
              }
            }
          } else {
            // 일반 서비스 주문인 경우 - 패키지 횟수 차감
            const activePackage = await tx.packagePurchase.findFirst({
              where: {
                customerId: updatedOrder.customerId,
                serviceId: orderItem.serviceId,
                status: 'ACTIVE',
                remainingCount: { gt: 0 }
              },
              orderBy: {
                purchasedAt: 'asc' // 오래된 패키지부터 사용 (FIFO)
              }
            })

            if (activePackage && orderItem.quantity > 0) {
              // 이미 사용 기록이 있는지 확인 (중복 방지)
              const existingUsage = await tx.packageUsage.findFirst({
                where: {
                  orderId: id,
                  orderItemId: orderItem.id
                }
              })

              if (!existingUsage) {
                // 사용할 횟수 계산
                const usedCount = Math.min(activePackage.remainingCount, orderItem.quantity)

                // 패키지 사용 이력 생성
                await tx.packageUsage.create({
                  data: {
                    packagePurchaseId: activePackage.id,
                    orderId: id,
                    orderItemId: orderItem.id,
                    usedCount: usedCount
                  }
                })

                // 패키지 남은 횟수 차감
                const newRemainingCount = activePackage.remainingCount - usedCount
                await tx.packagePurchase.update({
                  where: { id: activePackage.id },
                  data: {
                    remainingCount: newRemainingCount,
                    status: newRemainingCount === 0 ? 'COMPLETED' : 'ACTIVE'
                  }
                })
              }
            }
          }
        }
      }

      return updatedOrder
    })

    return NextResponse.json(result)
  } catch {
    console.error('주문 수정 오류:', error)
    return NextResponse.json(
      { error: '주문 정보 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // 주문 상태 확인 (완료된 주문은 삭제 불가)
    const order = await prisma.order.findUnique({
      where: { id }
    })

    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (order.status === 'COMPLETED') {
      return NextResponse.json(
        { error: '완료된 주문은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 주문 삭제 (관련 데이터 모두 삭제)
    await prisma.$transaction(async (tx) => {
      // 주문 항목 삭제
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      })

      // 주문 추가구성 삭제
      await tx.orderAddOn.deleteMany({
        where: { orderId: id }
      })

      // 주문 삭제
      await tx.order.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: '주문이 삭제되었습니다.' })
  } catch {
    console.error('주문 삭제 오류:', error)
    return NextResponse.json(
      { error: '주문 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}