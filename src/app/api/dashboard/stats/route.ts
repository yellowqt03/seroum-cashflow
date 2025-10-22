import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 대시보드 통계 API
 * 오늘의 매출, 주문, 고객 현황 등 실시간 통계 제공
 */
export async function GET() {
  try {
    // 오늘 날짜 범위 설정
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 지난 달 같은 기간 (전월 대비 변화율 계산용)
    const lastMonthToday = new Date(today)
    lastMonthToday.setMonth(lastMonthToday.getMonth() - 1)
    const lastMonthTomorrow = new Date(lastMonthToday)
    lastMonthTomorrow.setDate(lastMonthTomorrow.getDate() + 1)

    // 병렬로 데이터 조회
    const [
      todayOrders,
      lastMonthOrders,
      totalCustomers,
      lastMonthTotalCustomers,
      topServices,
      customerBreakdown,
      recentOrders
    ] = await Promise.all([
      // 오늘 완료된 주문
      prisma.order.findMany({
        where: {
          orderDate: {
            gte: today,
            lt: tomorrow
          },
          status: 'COMPLETED'
        },
        select: {
          finalAmount: true,
          subtotal: true,
          discountAmount: true
        }
      }),

      // 지난달 같은 날 완료된 주문
      prisma.order.findMany({
        where: {
          orderDate: {
            gte: lastMonthToday,
            lt: lastMonthTomorrow
          },
          status: 'COMPLETED'
        },
        select: {
          finalAmount: true
        }
      }),

      // 전체 고객 수
      prisma.customer.count(),

      // 지난달 전체 고객 수
      prisma.customer.count({
        where: {
          createdAt: {
            lt: lastMonthToday
          }
        }
      }),

      // 인기 서비스 TOP 5 (최근 30일)
      prisma.orderItem.groupBy({
        by: ['serviceId'],
        where: {
          order: {
            orderDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            },
            status: 'COMPLETED'
          }
        },
        _sum: {
          totalPrice: true,
          quantity: true
        },
        _count: true,
        orderBy: {
          _sum: {
            totalPrice: 'desc'
          }
        },
        take: 5
      }),

      // 고객 유형별 분류
      prisma.customer.groupBy({
        by: ['discountType'],
        _count: true
      }),

      // 최근 주문 4건
      prisma.order.findMany({
        where: {
          status: 'COMPLETED'
        },
        orderBy: {
          orderDate: 'desc'
        },
        take: 4,
        include: {
          customer: {
            select: {
              name: true,
              discountType: true
            }
          },
          orderItems: {
            include: {
              service: {
                select: {
                  name: true
                }
              }
            },
            take: 1
          }
        }
      })
    ])

    // 오늘 매출 및 주문 통계
    const totalSales = todayOrders.reduce((sum, order) => sum + order.finalAmount, 0)
    const totalOrders = todayOrders.length

    // 지난달 매출 (변화율 계산)
    const lastMonthSales = lastMonthOrders.reduce((sum, order) => sum + order.finalAmount, 0)
    const salesChange = lastMonthSales > 0
      ? ((totalSales - lastMonthSales) / lastMonthSales) * 100
      : 0

    const ordersChange = lastMonthOrders.length > 0
      ? ((totalOrders - lastMonthOrders.length) / lastMonthOrders.length) * 100
      : 0

    const customersChange = lastMonthTotalCustomers > 0
      ? ((totalCustomers - lastMonthTotalCustomers) / lastMonthTotalCustomers) * 100
      : 0

    // 평균 주문액
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0

    // 인기 서비스 TOP 5 (서비스 이름 포함)
    const topServicesWithNames = await Promise.all(
      topServices.map(async (item) => {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId },
          select: { name: true }
        })
        return {
          name: service?.name || 'Unknown',
          count: item._sum.quantity || 0,
          revenue: item._sum.totalPrice || 0
        }
      })
    )

    // 고객 유형별 분류
    const breakdown = {
      regular: 0,
      vip: 0,
      birthday: 0,
      employee: 0
    }

    customerBreakdown.forEach((item) => {
      switch (item.discountType) {
        case 'REGULAR':
          breakdown.regular = item._count
          break
        case 'VIP':
          breakdown.vip = item._count
          break
        case 'BIRTHDAY':
          breakdown.birthday = item._count
          break
        case 'EMPLOYEE':
          breakdown.employee = item._count
          break
      }
    })

    // 최근 주문 포맷팅
    const formattedRecentOrders = recentOrders.map((order) => ({
      id: order.id,
      customerName: order.customer.name,
      serviceName: order.orderItems[0]?.service.name || '서비스 없음',
      amount: order.finalAmount,
      discountType: order.appliedDiscountType || 'REGULAR',
      createdAt: order.orderDate.toISOString()
    }))

    return NextResponse.json({
      totalSales,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      salesChange: Number(salesChange.toFixed(1)),
      ordersChange: Number(ordersChange.toFixed(1)),
      customersChange: Number(customersChange.toFixed(1)),
      topServices: topServicesWithNames,
      customerBreakdown: breakdown,
      recentOrders: formattedRecentOrders
    })
  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error)
    return NextResponse.json(
      { error: '대시보드 통계를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
