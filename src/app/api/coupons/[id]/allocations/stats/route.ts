import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 쿠폰 할당 통계 조회
 * GET /api/coupons/[id]/allocations/stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: couponId } = await params

    // 쿠폰 존재 여부 확인
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId }
    })

    if (!coupon) {
      return NextResponse.json(
        { error: '쿠폰을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 모든 할당 조회
    const allocations = await prisma.staffCouponAllocation.findMany({
      where: { couponId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // 통계 계산
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
    const totalUsed = allocations.reduce((sum, a) => sum + a.usedAmount, 0)
    const totalRemaining = totalAllocated - totalUsed
    const avgUsageRate = totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0

    // 직원별 사용률 순위
    const staffRanking = allocations
      .map(allocation => ({
        userId: allocation.userId,
        userName: allocation.user.name,
        userEmail: allocation.user.email,
        allocated: allocation.allocatedAmount,
        used: allocation.usedAmount,
        remaining: allocation.allocatedAmount - allocation.usedAmount,
        usageRate: allocation.allocatedAmount > 0
          ? (allocation.usedAmount / allocation.allocatedAmount) * 100
          : 0
      }))
      .sort((a, b) => b.usageRate - a.usageRate)

    // 사용량 기준 TOP 3
    const topUsers = allocations
      .map(allocation => ({
        userName: allocation.user.name,
        used: allocation.usedAmount,
        allocated: allocation.allocatedAmount
      }))
      .sort((a, b) => b.used - a.used)
      .slice(0, 3)

    return NextResponse.json({
      coupon: {
        id: coupon.id,
        name: coupon.name
      },
      summary: {
        totalStaff: allocations.length,
        totalAllocated,
        totalUsed,
        totalRemaining,
        avgUsageRate: Math.round(avgUsageRate * 10) / 10
      },
      staffRanking,
      topUsers
    })
  } catch (error) {
    console.error('쿠폰 할당 통계 조회 오류:', error)
    return NextResponse.json(
      { error: '통계를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
