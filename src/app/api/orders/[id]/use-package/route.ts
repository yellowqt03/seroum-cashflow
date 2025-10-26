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

    if (!packagePurchaseId) {
      return NextResponse.json(
        { error: '패키지 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 주문 조회
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
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

    // 패키지 조회
    const packagePurchase = await prisma.packagePurchase.findUnique({
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

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 1. 패키지 사용 이력 생성
      const packageUsage = await tx.packageUsage.create({
        data: {
          packagePurchaseId: packagePurchaseId,
          orderId: id,
          orderItemId: order.orderItems[0].id, // 첫 번째 주문 항목 연결
          usedCount: 1
        }
      })

      // 2. 패키지 남은 횟수 감소
      const newRemainingCount = packagePurchase.remainingCount - 1
      const updatedPackage = await tx.packagePurchase.update({
        where: { id: packagePurchaseId },
        data: {
          remainingCount: newRemainingCount,
          status: newRemainingCount === 0 ? 'COMPLETED' : 'ACTIVE'
        }
      })

      // 3. 주문의 notes에 세션 정보 저장
      let sessionInfo: any = {}
      try {
        // 기존 notes에서 세션 정보 파싱 (JSON 형식인 경우)
        if (order.notes && order.notes.startsWith('{')) {
          sessionInfo = JSON.parse(order.notes)
        }
      } catch (e) {
        // JSON이 아니면 새로 시작
        sessionInfo = { originalNotes: order.notes }
      }

      sessionInfo.packageSession = {
        packagePurchaseId: packagePurchaseId,
        serviceName: packagePurchase.service.name,
        packageType: packagePurchase.packageType,
        totalCount: packagePurchase.totalCount,
        usedInThisSession: (sessionInfo.packageSession?.usedInThisSession || 0) + 1,
        remainingCount: newRemainingCount
      }

      // 4. 주문 notes 업데이트
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          notes: JSON.stringify(sessionInfo)
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
        sessionInfo: sessionInfo.packageSession
      }
    })

    return NextResponse.json({
      success: true,
      message: `패키지 1회 사용 완료 (남은 횟수: ${result.updatedPackage.remainingCount}/${packagePurchase.totalCount})`,
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
