import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 매출 리포트 API
 * 일/주/월/년 단위 매출 분석
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // day, week, month, year
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: '시작일과 종료일을 입력해주세요.' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // 종료일 끝까지 포함

    // 주문 데이터 조회 (완료된 주문만)
    const orders = await prisma.order.findMany({
      where: {
        orderDate: {
          gte: start,
          lte: end
        },
        status: 'COMPLETED'
      },
      include: {
        customer: {
          select: {
            discountType: true
          }
        },
        orderItems: {
          include: {
            service: {
              select: {
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        orderDate: 'asc'
      }
    })

    // 기간별 그룹화
    const salesByPeriod = groupOrdersByPeriod(orders, period, start, end)

    // 전체 통계 계산
    const totalStats = calculateTotalStats(orders)

    // 카테고리별 매출
    const salesByCategory = calculateSalesByCategory(orders)

    // 할인 유형별 통계
    const discountStats = calculateDiscountStats(orders)

    return NextResponse.json({
      period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      salesByPeriod,
      totalStats,
      salesByCategory,
      discountStats
    })
  } catch (error) {
    console.error('매출 리포트 조회 오류:', error)
    return NextResponse.json(
      { error: '매출 리포트를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 기간별로 주문 그룹화
 */
function groupOrdersByPeriod(orders: any[], period: string, start: Date, end: Date) {
  const periodMap = new Map<string, any>()

  // 기간에 따라 키 생성
  const getKey = (date: Date) => {
    const d = new Date(date)
    switch (period) {
      case 'day':
        return d.toISOString().split('T')[0] // YYYY-MM-DD
      case 'week':
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay()) // 주의 시작 (일요일)
        return weekStart.toISOString().split('T')[0]
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
      case 'year':
        return String(d.getFullYear()) // YYYY
      default:
        return d.toISOString().split('T')[0]
    }
  }

  // 모든 기간 초기화 (데이터 없는 기간도 표시)
  const current = new Date(start)
  while (current <= end) {
    const key = getKey(current)
    if (!periodMap.has(key)) {
      periodMap.set(key, {
        period: key,
        totalSales: 0,
        totalDiscount: 0,
        netSales: 0,
        orderCount: 0,
        customerCount: 0,
        avgOrderAmount: 0
      })
    }

    // 다음 기간으로 이동
    switch (period) {
      case 'day':
        current.setDate(current.getDate() + 1)
        break
      case 'week':
        current.setDate(current.getDate() + 7)
        break
      case 'month':
        current.setMonth(current.getMonth() + 1)
        break
      case 'year':
        current.setFullYear(current.getFullYear() + 1)
        break
    }
  }

  // 주문 데이터 집계
  const customerSet = new Set<string>()

  orders.forEach(order => {
    const key = getKey(order.orderDate)
    const data = periodMap.get(key)

    if (data) {
      data.totalSales += order.subtotal
      data.totalDiscount += order.discountAmount
      data.netSales += order.finalAmount
      data.orderCount += 1
      customerSet.add(order.customerId)
    }
  })

  // 평균 주문 금액 계산 및 고객 수
  periodMap.forEach((data) => {
    data.customerCount = customerSet.size
    data.avgOrderAmount = data.orderCount > 0 ? Math.round(data.netSales / data.orderCount) : 0
  })

  return Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period))
}

/**
 * 전체 통계 계산
 */
function calculateTotalStats(orders: any[]) {
  const totalSales = orders.reduce((sum, order) => sum + order.subtotal, 0)
  const totalDiscount = orders.reduce((sum, order) => sum + order.discountAmount, 0)
  const netSales = orders.reduce((sum, order) => sum + order.finalAmount, 0)
  const orderCount = orders.length
  const customerSet = new Set(orders.map(o => o.customerId))
  const customerCount = customerSet.size
  const avgOrderAmount = orderCount > 0 ? Math.round(netSales / orderCount) : 0
  const discountRate = totalSales > 0 ? (totalDiscount / totalSales) : 0

  return {
    totalSales,
    totalDiscount,
    netSales,
    orderCount,
    customerCount,
    avgOrderAmount,
    discountRate
  }
}

/**
 * 카테고리별 매출 계산
 */
function calculateSalesByCategory(orders: any[]) {
  const categoryMap = new Map<string, any>()

  orders.forEach(order => {
    order.orderItems.forEach((item: any) => {
      const category = item.service.category
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          totalSales: 0,
          orderCount: 0,
          itemCount: 0
        })
      }

      const data = categoryMap.get(category)
      data.totalSales += item.totalPrice
      data.orderCount += 1
      data.itemCount += item.quantity
    })
  })

  return Array.from(categoryMap.values())
    .sort((a, b) => b.totalSales - a.totalSales)
}

/**
 * 할인 유형별 통계 계산
 */
function calculateDiscountStats(orders: any[]) {
  const stats = {
    vip: { count: 0, totalDiscount: 0, avgDiscount: 0 },
    birthday: { count: 0, totalDiscount: 0, avgDiscount: 0 },
    employee: { count: 0, totalDiscount: 0, avgDiscount: 0 },
    package: { count: 0, totalDiscount: 0, avgDiscount: 0 },
    regular: { count: 0, totalDiscount: 0, avgDiscount: 0 }
  }

  orders.forEach(order => {
    const discountType = order.appliedDiscountType || 'REGULAR'

    switch (discountType) {
      case 'VIP':
        stats.vip.count += 1
        stats.vip.totalDiscount += order.discountAmount
        break
      case 'BIRTHDAY':
        stats.birthday.count += 1
        stats.birthday.totalDiscount += order.discountAmount
        break
      case 'EMPLOYEE':
        stats.employee.count += 1
        stats.employee.totalDiscount += order.discountAmount
        break
      default:
        // 패키지 할인인 경우
        if (order.discountAmount > 0) {
          stats.package.count += 1
          stats.package.totalDiscount += order.discountAmount
        } else {
          stats.regular.count += 1
        }
    }
  })

  // 평균 할인 금액 계산
  Object.values(stats).forEach(stat => {
    stat.avgDiscount = stat.count > 0 ? Math.round(stat.totalDiscount / stat.count) : 0
  })

  return stats
}
