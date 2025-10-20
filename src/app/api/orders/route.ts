import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { calculateDiscount } from '@/lib/discount'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Prisma.OrderWhereInput = {}

    if (customerId) {
      where.customerId = customerId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        appliedCoupon: true,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json(orders)
  } catch {
    console.error('주문 조회 오류:', error)
    return NextResponse.json(
      { error: '주문 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // 고객 정보 조회
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: '고객을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 쿠폰 유효성 검증
    let coupon = null
    if (data.couponId) {
      coupon = await prisma.coupon.findUnique({
        where: { id: data.couponId }
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
    }

    // 서비스 정보 조회
    const serviceIds = data.items.map((item: any) => item.serviceId)
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        isActive: true
      }
    })

    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { error: '일부 서비스를 찾을 수 없습니다.' },
        { status: 400 }
      )
    }

    // 할인 계산 및 검증
    let totalSubtotal = 0
    let totalDiscount = 0
    const calculatedItems = []

    for (const item of data.items) {
      const service = services.find(s => s.id === item.serviceId)
      if (!service) continue

      const discountResult = calculateDiscount({
        service,
        customer,
        packageType: item.packageType,
        quantity: item.quantity
      })

      // 생일자 할인 한도 체크
      if (customer.discountType === 'BIRTHDAY' &&
          discountResult.customerDiscount > 0 &&
          ['프리미엄회복', '프리미엄면역'].includes(service.name)) {

        const currentYear = new Date().getFullYear()
        if (customer.birthdayDiscountYear === currentYear &&
            customer.birthdayUsedCount >= 8) {
          return NextResponse.json(
            { error: `${service.name}: 생일자 할인 연간 한도(8회)를 초과했습니다.` },
            { status: 400 }
          )
        }
      }

      totalSubtotal += discountResult.originalPrice
      totalDiscount += discountResult.totalDiscount

      calculatedItems.push({
        serviceId: service.id,
        quantity: item.quantity,
        packageType: item.packageType,
        unitPrice: Math.floor(discountResult.finalPrice / item.quantity),
        totalPrice: discountResult.finalPrice
      })
    }

    const subtotalAfterDiscount = totalSubtotal - totalDiscount

    // 쿠폰 할인 계산
    let couponDiscount = 0
    if (coupon) {
      if (coupon.discountType === 'PERCENT') {
        couponDiscount = Math.floor(subtotalAfterDiscount * coupon.discountValue)
        if (coupon.maxDiscount) {
          couponDiscount = Math.min(couponDiscount, coupon.maxDiscount)
        }
      } else {
        couponDiscount = coupon.discountValue
      }

      // 최소 주문 금액 확인
      if (coupon.minAmount && subtotalAfterDiscount < coupon.minAmount) {
        return NextResponse.json(
          { error: `최소 주문금액 ${coupon.minAmount.toLocaleString()}원 이상이어야 합니다.` },
          { status: 400 }
        )
      }
    }

    const finalAmount = subtotalAfterDiscount - couponDiscount

    // 트랜잭션으로 주문 생성
    const result = await prisma.$transaction(async (tx) => {
      // 주문 생성
      const order = await tx.order.create({
        data: {
          customerId: data.customerId,
          status: 'PENDING',
          paymentMethod: data.paymentMethod,
          subtotal: totalSubtotal,
          discountAmount: totalDiscount,
          couponDiscount: couponDiscount,
          finalAmount: finalAmount,
          appliedDiscountType: customer.discountType !== 'REGULAR' ? customer.discountType : null,
          discountRate: totalSubtotal > 0 ? totalDiscount / totalSubtotal : 0,
          appliedCouponId: coupon?.id || null,
          notes: data.notes
        }
      })

      // 주문 항목 생성 및 패키지 사용 처리
      for (const item of calculatedItems) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            ...item
          }
        })

        // 패키지 사용 처리: 고객의 활성 패키지가 있는지 확인
        const activePackage = await tx.packagePurchase.findFirst({
          where: {
            customerId: customer.id,
            serviceId: item.serviceId,
            status: 'ACTIVE',
            remainingCount: {
              gt: 0
            }
          },
          orderBy: {
            purchasedAt: 'asc' // 오래된 패키지부터 사용
          }
        })

        if (activePackage && item.quantity > 0) {
          // 사용할 횟수 계산 (패키지 남은 횟수와 주문 수량 중 작은 값)
          const usedCount = Math.min(activePackage.remainingCount, item.quantity)

          // 패키지 사용 이력 생성
          await tx.packageUsage.create({
            data: {
              packagePurchaseId: activePackage.id,
              orderId: order.id,
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

      // 생일자 할인 사용 횟수 업데이트
      if (customer.discountType === 'BIRTHDAY') {
        const birthdayServices = calculatedItems.filter(item => {
          const service = services.find(s => s.id === item.serviceId)
          return service && ['프리미엄회복', '프리미엄면역'].includes(service.name)
        })

        if (birthdayServices.length > 0) {
          const currentYear = new Date().getFullYear()
          const totalBirthdayItems = birthdayServices.reduce((sum, item) => sum + item.quantity, 0)

          await tx.customer.update({
            where: { id: customer.id },
            data: {
              birthdayDiscountYear: currentYear,
              birthdayUsedCount: (customer.birthdayDiscountYear === currentYear ? customer.birthdayUsedCount : 0) + totalBirthdayItems
            }
          })
        }
      }

      // 쿠폰 사용 처리
      if (coupon) {
        // 쿠폰 사용 이력 생성
        await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            customerId: customer.id,
            orderId: order.id
          }
        })

        // 쿠폰 사용 횟수 증가
        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            usedCount: {
              increment: 1
            }
          }
        })
      }

      return order
    })

    // 생성된 주문 정보 조회 (관계 포함)
    const createdOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        appliedCoupon: true,
        orderItems: {
          include: {
            service: true
          }
        }
      }
    })

    return NextResponse.json(createdOrder, { status: 201 })
  } catch {
    console.error('주문 생성 오류:', error)
    return NextResponse.json(
      { error: '주문 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}