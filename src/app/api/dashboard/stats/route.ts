import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 대시보드 통계 API
 * GET /api/dashboard/stats
 */
export async function GET() {
  try {
    // 오늘 날짜 범위
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 오늘 완료된 주문 조회
    const todayOrders = await prisma.order.findMany({
      where: {
        completedAt: {
          gte: today,
          lt: tomorrow
        },
        status: 'COMPLETED'
      },
      select: {
        finalAmount: true
      }
    })

    // 오늘 매출 계산
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.finalAmount, 0)

    // 오늘 주문 수
    const todayOrderCount = todayOrders.length

    // 전체 고객 수
    const totalCustomers = await prisma.customer.count()

    return NextResponse.json({
      todayRevenue,
      todayOrderCount,
      totalCustomers
    })
  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error)
    return NextResponse.json(
      { error: '통계를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
