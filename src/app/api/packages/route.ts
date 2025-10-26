import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 패키지 구매 API
 * POST: 새로운 패키지 구매
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, serviceId, packageType, paymentMethod, notes, couponId } = body

    if (!customerId || !serviceId || !packageType) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 서비스 정보 조회
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: '서비스를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 패키지 가격 및 횟수 결정
    let packagePrice = 0
    let totalCount = 0

    switch (packageType) {
      case 'package4':
        packagePrice = service.package4Price || 0
        totalCount = 4
        break
      case 'package8':
        packagePrice = service.package8Price || 0
        totalCount = 8
        break
      case 'package10':
        packagePrice = service.package10Price || 0
        totalCount = 10
        break
      default:
        return NextResponse.json(
          { error: '유효하지 않은 패키지 타입입니다.' },
          { status: 400 }
        )
    }

    if (packagePrice === 0) {
      return NextResponse.json(
        { error: '해당 서비스의 패키지 가격이 설정되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 쿠폰 검증 및 할인 계산
    let coupon = null
    let couponDiscount = 0

    if (couponId) {
      coupon = await prisma.coupon.findUnique({
        where: { id: couponId }
      })

      if (!coupon) {
        return NextResponse.json(
          { error: '쿠폰을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // 쿠폰 활성 상태 확인
      if (!coupon.isActive) {
        return NextResponse.json(
          { error: '사용할 수 없는 쿠폰입니다.' },
          { status: 400 }
        )
      }

      // 쿠폰 유효 기간 확인
      const now = new Date()
      if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
        return NextResponse.json(
          { error: '쿠폰 사용 기간이 아닙니다.' },
          { status: 400 }
        )
      }

      // 쿠폰 사용 한도 확인
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json(
          { error: '쿠폰 사용 한도를 초과했습니다.' },
          { status: 400 }
        )
      }

      // 쿠폰 할인 계산
      if (coupon.discountType === 'PERCENT') {
        couponDiscount = Math.floor(packagePrice * coupon.discountValue)
        if (coupon.maxDiscount) {
          couponDiscount = Math.min(couponDiscount, coupon.maxDiscount)
        }
      } else {
        couponDiscount = coupon.discountValue
      }

      // 최소 주문 금액 확인
      if (coupon.minAmount && packagePrice < coupon.minAmount) {
        return NextResponse.json(
          { error: `최소 주문금액 ${coupon.minAmount.toLocaleString()}원 이상이어야 합니다.` },
          { status: 400 }
        )
      }
    }

    const finalAmount = Math.max(0, packagePrice - couponDiscount)

    // 트랜잭션으로 주문 및 패키지 구매 생성
    const result = await prisma.$transaction(async (tx) => {
      // 1. 주문 생성
      const order = await tx.order.create({
        data: {
          customerId,
          status: 'COMPLETED',
          paymentMethod: paymentMethod || 'CARD',
          subtotal: packagePrice,
          discountAmount: 0,
          couponDiscount: couponDiscount,
          finalAmount: finalAmount,
          appliedCouponId: couponId || null,
          notes: notes || `${service.name} ${packageType} 구매`,
          completedAt: new Date(),
          orderItems: {
            create: {
              serviceId,
              quantity: 1,
              packageType,
              unitPrice: packagePrice,
              totalPrice: packagePrice
            }
          }
        },
        include: {
          customer: true,
          orderItems: {
            include: {
              service: true
            }
          }
        }
      })

      // 2. 패키지 구매 이력 생성
      const packagePurchase = await tx.packagePurchase.create({
        data: {
          customerId,
          serviceId,
          packageType,
          totalCount,
          remainingCount: totalCount,
          purchasePrice: packagePrice,
          orderId: order.id,
          status: 'ACTIVE',
          notes: notes || undefined
        },
        include: {
          customer: true,
          service: true
        }
      })

      // 3. 쿠폰 사용 이력 생성 (쿠폰을 사용한 경우)
      if (couponId && coupon) {
        await tx.couponUsage.create({
          data: {
            couponId: couponId,
            customerId: customerId,
            orderId: order.id
          }
        })

        // 쿠폰 사용 횟수 증가
        await tx.coupon.update({
          where: { id: couponId },
          data: {
            usedCount: {
              increment: 1
            }
          }
        })
      }

      return { order, packagePurchase }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('패키지 구매 오류:', error)
    return NextResponse.json(
      { error: '패키지 구매 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 고객의 패키지 목록 조회
 * GET: /api/packages?customerId=xxx
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status') // ACTIVE, COMPLETED, EXPIRED, CANCELLED

    if (!customerId) {
      return NextResponse.json(
        { error: '고객 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId,
        ...(status && { status })
      },
      include: {
        service: true,
        packageUsages: {
          include: {
            order: {
              select: {
                id: true,
                orderDate: true,
                status: true
              }
            }
          },
          orderBy: {
            usedAt: 'desc'
          }
        }
      },
      orderBy: {
        purchasedAt: 'desc'
      }
    })

    return NextResponse.json({ packages })
  } catch (error) {
    console.error('패키지 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '패키지 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
