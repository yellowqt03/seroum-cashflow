import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 패키지 1회 사용 API
 *
 * POST /api/orders/[id]/use-package
 * Body: { packagePurchaseId: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { packagePurchaseId } = body

    // 주문 조회
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        orderItems: {
          include: { service: true }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 주문이 IN_PROGRESS 상태인지 확인
    if (order.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: '진행 중인 주문만 패키지를 사용할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 패키지 조회 (packagePurchaseId가 있는 경우만)
    let packagePurchase = null
    if (packagePurchaseId) {
      packagePurchase = await prisma.packagePurchase.findUnique({
        where: { id: packagePurchaseId },
        include: {
          service: { select: { name: true } }
        }
      })

      if (!packagePurchase) {
        return NextResponse.json(
          { error: '패키지를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // 남은 횟수 확인
      if (packagePurchase.remainingCount <= 0) {
        return NextResponse.json(
          { error: '패키지 횟수가 모두 소진되었습니다.' },
          { status: 400 }
        )
      }
    }

    // 세션 정보 파싱하여 isPendingPurchase 확인
    let sessionInfo: any = {}
    let isPendingPurchase = false
    try {
      if (order.notes && order.notes.startsWith('{')) {
        sessionInfo = JSON.parse(order.notes)
        isPendingPurchase = sessionInfo.packageSession?.isPendingPurchase || false
      }
    } catch (e) {
      // JSON 아님
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      let actualPackagePurchaseId = packagePurchaseId
      let actualPackagePurchase = packagePurchase

      // isPendingPurchase인 경우: 첫 번째 사용 시 PackagePurchase 생성
      if (isPendingPurchase && !packagePurchaseId) {
        // 패키지 횟수 추출
        let packageCount = 0
        const packageType = order.orderItems[0].packageType
        if (packageType.includes('_')) {
          packageCount = parseInt(packageType.split('_')[1])
        } else {
          packageCount = parseInt(packageType.replace(/\D/g, ''))
        }

        // PackagePurchase 생성 (첫 사용이므로 바로 1회 차감된 상태로 생성)
        const newPackage = await tx.packagePurchase.create({
          data: {
            orderId: id,
            customerId: order.customer.id,
            serviceId: order.orderItems[0].serviceId,
            packageType: packageType,
            totalCount: packageCount,
            remainingCount: packageCount - 1, // 첫 사용이므로 바로 1회 차감
            purchasePrice: order.finalAmount,
            purchasedAt: new Date(),
            status: packageCount - 1 === 0 ? 'COMPLETED' : 'ACTIVE'
          },
          include: {
            service: { select: { name: true } }
          }
        })

        actualPackagePurchaseId = newPackage.id
        actualPackagePurchase = newPackage
      }

      // 1. 패키지 사용 이력 생성
      const packageUsage = await tx.packageUsage.create({
        data: {
          packagePurchaseId: actualPackagePurchaseId,
          orderId: id,
          orderItemId: order.orderItems[0].id,
          usedCount: 1
        }
      })

      // 2. 패키지 남은 횟수 감소 (이미 생성된 패키지인 경우만)
      let newRemainingCount: number
      let updatedPackage: any

      if (isPendingPurchase && !packagePurchaseId) {
        // 방금 생성한 패키지는 이미 1회 차감되어 있음
        newRemainingCount = actualPackagePurchase.remainingCount
        updatedPackage = actualPackagePurchase
      } else {
        // 기존 패키지는 1회 차감 필요
        newRemainingCount = actualPackagePurchase.remainingCount - 1
        updatedPackage = await tx.packagePurchase.update({
          where: { id: actualPackagePurchaseId },
          data: {
            remainingCount: newRemainingCount,
            status: newRemainingCount === 0 ? 'COMPLETED' : 'ACTIVE'
          }
        })
      }

      // 3. 주문의 notes에 세션 정보 저장
      let updatedSessionInfo: any = {}
      try {
        // 기존 notes에서 세션 정보 파싱 (JSON 형식인 경우)
        if (order.notes && order.notes.startsWith('{')) {
          updatedSessionInfo = JSON.parse(order.notes)
        }
      } catch (e) {
        // JSON이 아니면 새로 시작
        updatedSessionInfo = { originalNotes: order.notes }
      }

      updatedSessionInfo.packageSession = {
        packagePurchaseId: actualPackagePurchaseId,
        serviceName: actualPackagePurchase.service.name,
        packageType: actualPackagePurchase.packageType,
        totalCount: actualPackagePurchase.totalCount,
        usedInThisSession: (updatedSessionInfo.packageSession?.usedInThisSession || 0) + 1,
        remainingCount: newRemainingCount,
        isPendingPurchase: false // 이제 패키지가 생성되었으므로 false
      }

      // 4. 주문 notes 업데이트
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          notes: JSON.stringify(updatedSessionInfo)
        },
        include: {
          orderItems: {
            include: { service: true }
          }
        }
      })

      // 5. 모든 횟수를 사용했으면 주문 완료
      if (newRemainingCount === 0) {
        await tx.order.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })
      }

      return {
        packageUsage,
        updatedPackage,
        updatedOrder,
        sessionInfo: updatedSessionInfo.packageSession
      }
    })

    return NextResponse.json({
      success: true,
      message: `패키지 1회 사용 완료 (남은 횟수: ${result.updatedPackage.remainingCount}/${result.updatedPackage.totalCount})`,
      data: result
    })
  } catch (error) {
    console.error('패키지 사용 오류:', error)
    return NextResponse.json(
      { error: '패키지 사용 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
