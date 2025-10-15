import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        couponUsages: {
          include: {
            // customer 정보는 customerId만 있으므로 별도 조회 필요
          },
          orderBy: {
            usedAt: 'desc'
          }
        },
        _count: {
          select: {
            couponUsages: true
          }
        }
      }
    })

    if (!coupon) {
      return NextResponse.json(
        { error: '쿠폰을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태 정보 추가
    const now = new Date()
    const isExpired = coupon.validUntil < now
    const isUsageLimitReached = coupon.usageLimit ? coupon.usedCount >= coupon.usageLimit : false
    const canUse = coupon.isActive && !isExpired && !isUsageLimitReached

    return NextResponse.json({
      ...coupon,
      status: !coupon.isActive ? 'inactive'
            : isExpired ? 'expired'
            : isUsageLimitReached ? 'limit_reached'
            : 'active',
      canUse,
      remainingUsage: coupon.usageLimit ? Math.max(0, coupon.usageLimit - coupon.usedCount) : null
    })
  } catch {
    console.error('쿠폰 조회 오류:', error)
    return NextResponse.json(
      { error: '쿠폰 정보를 불러오는 중 오류가 발생했습니다.' },
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

    const {
      name,
      discountType,
      discountValue,
      minAmount,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      isActive
    } = data

    // 유효성 검증
    if (discountType && !['PERCENT', 'AMOUNT'].includes(discountType)) {
      return NextResponse.json(
        { error: '유효하지 않은 할인 타입입니다.' },
        { status: 400 }
      )
    }

    if (discountType === 'PERCENT' && discountValue !== undefined) {
      if (discountValue <= 0 || discountValue > 1) {
        return NextResponse.json(
          { error: '퍼센트 할인은 0과 1 사이의 값이어야 합니다.' },
          { status: 400 }
        )
      }
    }

    if (discountType === 'AMOUNT' && discountValue !== undefined) {
      if (discountValue <= 0) {
        return NextResponse.json(
          { error: '금액 할인은 0보다 커야 합니다.' },
          { status: 400 }
        )
      }
    }

    // 유효 기간 검증
    if (validFrom && validUntil) {
      const validFromDate = new Date(validFrom)
      const validUntilDate = new Date(validUntil)

      if (validFromDate >= validUntilDate) {
        return NextResponse.json(
          { error: '종료일은 시작일보다 이후여야 합니다.' },
          { status: 400 }
        )
      }
    }

    const updateData: Prisma.CouponUpdateInput = {}
    if (name !== undefined) updateData.name = name
    if (discountType !== undefined) updateData.discountType = discountType
    if (discountValue !== undefined) updateData.discountValue = discountValue
    if (minAmount !== undefined) updateData.minAmount = minAmount || null
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount || null
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit || null
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom)
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil)
    if (isActive !== undefined) updateData.isActive = isActive

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            couponUsages: true
          }
        }
      }
    })

    return NextResponse.json(coupon)
  } catch {
    console.error('쿠폰 수정 오류:', error)
    return NextResponse.json(
      { error: '쿠폰 수정 중 오류가 발생했습니다.' },
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

    // 쿠폰 사용 이력이 있는지 확인
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            couponUsages: true
          }
        }
      }
    })

    if (!coupon) {
      return NextResponse.json(
        { error: '쿠폰을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (coupon._count.couponUsages > 0) {
      return NextResponse.json(
        { error: '사용 이력이 있는 쿠폰은 삭제할 수 없습니다. 비활성화를 권장합니다.' },
        { status: 400 }
      )
    }

    await prisma.coupon.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch {
    console.error('쿠폰 삭제 오류:', error)
    return NextResponse.json(
      { error: '쿠폰 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
