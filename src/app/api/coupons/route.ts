import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active', 'expired', 'all'
    const search = searchParams.get('search')

    let where: any = {}

    // 상태 필터
    if (status === 'active') {
      where.isActive = true
      where.validUntil = { gte: new Date() }
    } else if (status === 'expired') {
      where.validUntil = { lt: new Date() }
    } else if (status !== 'all') {
      where.isActive = true
    }

    // 검색
    if (search) {
      where.name = { contains: search }
    }

    const coupons = await prisma.coupon.findMany({
      where,
      include: {
        couponUsages: {
          select: {
            id: true,
            customerId: true,
            usedAt: true
          }
        },
        _count: {
          select: {
            couponUsages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 쿠폰 상태 정보 추가
    const couponsWithStatus = coupons.map(coupon => {
      const now = new Date()
      const isExpired = coupon.validUntil < now
      const isUsageLimitReached = coupon.usageLimit ? coupon.usedCount >= coupon.usageLimit : false
      const canUse = coupon.isActive && !isExpired && !isUsageLimitReached

      return {
        ...coupon,
        status: !coupon.isActive ? 'inactive'
              : isExpired ? 'expired'
              : isUsageLimitReached ? 'limit_reached'
              : 'active',
        canUse,
        remainingUsage: coupon.usageLimit ? Math.max(0, coupon.usageLimit - coupon.usedCount) : null
      }
    })

    return NextResponse.json(couponsWithStatus)
  } catch (error) {
    console.error('쿠폰 조회 오류:', error)
    return NextResponse.json(
      { error: '쿠폰 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
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
      isActive = true
    } = data

    // 필수 필드 검증
    if (!name || !discountType || discountValue === undefined || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 할인 타입 검증
    if (!['PERCENT', 'AMOUNT'].includes(discountType)) {
      return NextResponse.json(
        { error: '유효하지 않은 할인 타입입니다.' },
        { status: 400 }
      )
    }

    // 할인값 검증
    if (discountType === 'PERCENT' && (discountValue <= 0 || discountValue > 1)) {
      return NextResponse.json(
        { error: '퍼센트 할인은 0과 1 사이의 값이어야 합니다. (예: 0.1 = 10%)' },
        { status: 400 }
      )
    }

    if (discountType === 'AMOUNT' && discountValue <= 0) {
      return NextResponse.json(
        { error: '금액 할인은 0보다 커야 합니다.' },
        { status: 400 }
      )
    }

    // 유효 기간 검증
    const validFromDate = new Date(validFrom)
    const validUntilDate = new Date(validUntil)

    if (validFromDate >= validUntilDate) {
      return NextResponse.json(
        { error: '종료일은 시작일보다 이후여야 합니다.' },
        { status: 400 }
      )
    }

    const coupon = await prisma.coupon.create({
      data: {
        name,
        discountType,
        discountValue,
        minAmount: minAmount || null,
        maxDiscount: maxDiscount || null,
        usageLimit: usageLimit || null,
        usedCount: 0,
        validFrom: validFromDate,
        validUntil: validUntilDate,
        isActive
      },
      include: {
        _count: {
          select: {
            couponUsages: true
          }
        }
      }
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    console.error('쿠폰 생성 오류:', error)
    return NextResponse.json(
      { error: '쿠폰 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
