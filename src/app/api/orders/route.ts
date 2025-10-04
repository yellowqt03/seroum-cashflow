import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateDiscount } from '@/lib/discount'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

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
  } catch (error) {
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
    let calculatedItems = []

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

    const finalAmount = totalSubtotal - totalDiscount

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
          finalAmount: finalAmount,
          appliedDiscountType: customer.discountType !== 'REGULAR' ? customer.discountType : null,
          discountRate: totalSubtotal > 0 ? totalDiscount / totalSubtotal : 0,
          notes: data.notes
        }
      })

      // 주문 항목 생성
      for (const item of calculatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            ...item
          }
        })
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

      return order
    })

    // 생성된 주문 정보 조회 (관계 포함)
    const createdOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        orderItems: {
          include: {
            service: true
          }
        }
      }
    })

    return NextResponse.json(createdOrder, { status: 201 })
  } catch (error) {
    console.error('주문 생성 오류:', error)
    return NextResponse.json(
      { error: '주문 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}