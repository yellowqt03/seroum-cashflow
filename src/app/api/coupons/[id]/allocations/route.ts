import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 특정 쿠폰의 직원별 할당 목록 조회
 * GET /api/coupons/[id]/allocations
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

    // 직원별 할당 목록 조회
    const allocations = await prisma.staffCouponAllocation.findMany({
      where: { couponId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 각 할당의 잔여량 계산
    const allocationsWithRemaining = allocations.map(allocation => ({
      ...allocation,
      remainingAmount: allocation.allocatedAmount - allocation.usedAmount,
      usageRate: allocation.allocatedAmount > 0
        ? (allocation.usedAmount / allocation.allocatedAmount) * 100
        : 0
    }))

    return NextResponse.json({
      coupon,
      allocations: allocationsWithRemaining
    })
  } catch {
    console.error('쿠폰 할당 조회 오류:', error)
    return NextResponse.json(
      { error: '쿠폰 할당을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 직원에게 쿠폰 할당
 * POST /api/coupons/[id]/allocations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: couponId } = await params
    const data = await request.json()

    const { userId, allocatedAmount, autoRefresh, refreshPeriod, note } = data

    // 유효성 검사
    if (!userId || !allocatedAmount || allocatedAmount <= 0) {
      return NextResponse.json(
        { error: '직원과 할당량을 입력해주세요.' },
        { status: 400 }
      )
    }

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

    // 직원 존재 여부 확인
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: '직원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 기존 할당 확인
    const existingAllocation = await prisma.staffCouponAllocation.findUnique({
      where: {
        userId_couponId: {
          userId,
          couponId
        }
      }
    })

    if (existingAllocation) {
      return NextResponse.json(
        { error: '이미 해당 직원에게 이 쿠폰이 할당되어 있습니다.' },
        { status: 400 }
      )
    }

    // 할당 생성
    const allocation = await prisma.staffCouponAllocation.create({
      data: {
        userId,
        couponId,
        allocatedAmount: parseInt(allocatedAmount),
        autoRefresh: autoRefresh || false,
        refreshPeriod: refreshPeriod || 'MANUAL',
        note: note || null
      },
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

    return NextResponse.json(allocation, { status: 201 })
  } catch (error: any) {
    console.error('쿠폰 할당 생성 오류:', error)
    return NextResponse.json(
      { error: '쿠폰 할당 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
