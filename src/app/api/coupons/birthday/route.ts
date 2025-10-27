import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 생일 쿠폰 자동 생성 API
 * GET: 오늘 생일인 고객 조회 및 쿠폰 자동 생성
 */
export async function GET() {
  try {
    const today = new Date()
    const currentMonth = today.getMonth() + 1 // 1-12
    const currentDay = today.getDate() // 1-31

    // 오늘 생일인 고객 조회
    const customers = await prisma.customer.findMany({
      where: {
        birthDate: {
          not: null
        }
      }
    })

    // 생일인 고객 필터링
    const birthdayCustomers = customers.filter(customer => {
      if (!customer.birthDate) return false
      const birthDate = new Date(customer.birthDate)
      return birthDate.getMonth() + 1 === currentMonth &&
             birthDate.getDate() === currentDay
    })

    if (birthdayCustomers.length === 0) {
      return NextResponse.json({
        message: '오늘 생일인 고객이 없습니다.',
        customers: [],
        couponsCreated: 0
      })
    }

    // 생일 쿠폰 생성
    const couponsCreated = []
    const now = new Date()
    const validFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const validUntil = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 23, 59, 59) // 30일 유효

    for (const customer of birthdayCustomers) {
      // 이미 올해 생일 쿠폰을 받았는지 확인
      const existingCoupon = await prisma.coupon.findFirst({
        where: {
          name: {
            contains: `${customer.name} 생일 쿠폰`
          },
          createdAt: {
            gte: new Date(now.getFullYear(), 0, 1), // 올해 1월 1일
            lt: new Date(now.getFullYear() + 1, 0, 1) // 내년 1월 1일
          }
        }
      })

      if (existingCoupon) {
        continue // 이미 발급된 경우 스킵
      }

      // 생일 쿠폰 생성
      const coupon = await prisma.coupon.create({
        data: {
          name: `${customer.name} 생일 축하 쿠폰 🎉`,
          description: `${customer.name}님의 생일을 축하합니다! 30일 동안 사용 가능한 특별 할인 쿠폰입니다.`,
          discountType: 'PERCENT',
          discountValue: 0.2, // 20% 할인
          minAmount: 50000, // 최소 5만원 이상
          maxDiscount: 50000, // 최대 5만원 할인
          usageLimit: 1, // 1회 사용
          validFrom,
          validUntil,
          isActive: true,
          usedCount: 0
        }
      })

      couponsCreated.push({
        customerId: customer.id,
        customerName: customer.name,
        couponId: coupon.id,
        couponName: coupon.name
      })
    }

    return NextResponse.json({
      message: `${birthdayCustomers.length}명의 생일 고객에게 쿠폰이 발급되었습니다.`,
      customers: birthdayCustomers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        birthDate: c.birthDate
      })),
      couponsCreated,
      totalCreated: couponsCreated.length
    })
  } catch (error) {
    console.error('생일 쿠폰 생성 오류:', error)
    return NextResponse.json(
      { error: '생일 쿠폰 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 수동으로 특정 고객에게 생일 쿠폰 발급
 * POST: { customerId: string }
 */
export async function POST(request: Request) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: '고객 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: '고객을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (!customer.birthDate) {
      return NextResponse.json(
        { error: '고객의 생일 정보가 없습니다.' },
        { status: 400 }
      )
    }

    // 이미 올해 생일 쿠폰을 받았는지 확인
    const now = new Date()
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        name: {
          contains: `${customer.name} 생일 쿠폰`
        },
        createdAt: {
          gte: new Date(now.getFullYear(), 0, 1),
          lt: new Date(now.getFullYear() + 1, 0, 1)
        }
      }
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: '이미 올해 생일 쿠폰이 발급되었습니다.', coupon: existingCoupon },
        { status: 400 }
      )
    }

    // 생일 쿠폰 생성
    const validFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const validUntil = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 23, 59, 59)

    const coupon = await prisma.coupon.create({
      data: {
        name: `${customer.name} 생일 축하 쿠폰 🎉`,
        description: `${customer.name}님의 생일을 축하합니다! 30일 동안 사용 가능한 특별 할인 쿠폰입니다.`,
        discountType: 'PERCENT',
        discountValue: 0.2,
        minAmount: 50000,
        maxDiscount: 50000,
        usageLimit: 1,
        validFrom,
        validUntil,
        isActive: true,
        usedCount: 0
      }
    })

    return NextResponse.json({
      message: `${customer.name}님에게 생일 쿠폰이 발급되었습니다.`,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone
      },
      coupon
    })
  } catch (error) {
    console.error('생일 쿠폰 발급 오류:', error)
    return NextResponse.json(
      { error: '생일 쿠폰 발급 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
