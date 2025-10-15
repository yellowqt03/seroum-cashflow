import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 서비스별 판매 순위 및 통계 API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: '시작일과 종료일을 입력해주세요.' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // 주문 항목 데이터 조회
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          orderDate: {
            gte: start,
            lte: end
          },
          status: 'COMPLETED'
        }
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true
          }
        },
        order: {
          select: {
            orderDate: true,
            customerId: true
          }
        }
      }
    })

    // 서비스별 집계
    const serviceMap = new Map<string, any>()

    orderItems.forEach(item => {
      const serviceId = item.service.id
      if (!serviceMap.has(serviceId)) {
        serviceMap.set(serviceId, {
          serviceId: item.service.id,
          serviceName: item.service.name,
          category: item.service.category,
          basePrice: item.service.price,
          totalSales: 0,
          totalQuantity: 0,
          orderCount: 0,
          uniqueCustomers: new Set<string>(),
          packageBreakdown: {
            single: 0,
            package4: 0,
            package8: 0,
            package10: 0
          }
        })
      }

      const data = serviceMap.get(serviceId)
      data.totalSales += item.totalPrice
      data.totalQuantity += item.quantity
      data.orderCount += 1
      data.uniqueCustomers.add(item.order.customerId)

      // 패키지 타입별 집계
      const pkgType = item.packageType || 'single'
      if (data.packageBreakdown[pkgType] !== undefined) {
        data.packageBreakdown[pkgType] += item.quantity
      }
    })

    // Set을 숫자로 변환 및 평균 계산
    const serviceStats = Array.from(serviceMap.values()).map(data => ({
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      category: data.category,
      basePrice: data.basePrice,
      totalSales: data.totalSales,
      totalQuantity: data.totalQuantity,
      orderCount: data.orderCount,
      uniqueCustomers: data.uniqueCustomers.size,
      avgSalesPerOrder: data.orderCount > 0 ? Math.round(data.totalSales / data.orderCount) : 0,
      avgQuantityPerOrder: data.orderCount > 0 ? (data.totalQuantity / data.orderCount).toFixed(1) : '0',
      packageBreakdown: data.packageBreakdown
    }))

    // 매출 순으로 정렬
    const topServices = serviceStats
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)

    // 판매량 순으로 정렬
    const topByQuantity = serviceStats
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10)

    // 전체 통계
    const totalStats = {
      totalServices: serviceMap.size,
      totalSales: serviceStats.reduce((sum, s) => sum + s.totalSales, 0),
      totalQuantity: serviceStats.reduce((sum, s) => sum + s.totalQuantity, 0),
      totalOrders: serviceStats.reduce((sum, s) => sum + s.orderCount, 0)
    }

    return NextResponse.json({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      topServices,
      topByQuantity,
      totalStats,
      allServices: serviceStats
    })
  } catch {
    console.error('서비스 리포트 조회 오류:', error)
    return NextResponse.json(
      { error: '서비스 리포트를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
