import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 패키지 구매 API
 * POST: 새로운 패키지 구매
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, serviceId, packageType, paymentMethod, notes } = body

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
          couponDiscount: 0,
          finalAmount: packagePrice,
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
