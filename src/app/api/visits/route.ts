import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 방문 기록 조회 API
 * GET: /api/visits?startDate=...&endDate=...&customerId=...
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerId = searchParams.get('customerId')
    const period = searchParams.get('period') // 'today', 'week', 'month'

    // 날짜 범위 설정
    let dateFilter: any = {}

    if (period) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      switch (period) {
        case 'today':
          dateFilter = {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
          break
        case 'week':
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay()) // 일요일
          dateFilter = {
            gte: weekStart,
            lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
          break
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          dateFilter = {
            gte: monthStart,
            lt: monthEnd
          }
          break
      }
    } else if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      dateFilter = {
        gte: start,
        lte: end
      }
    }

    const where: any = {}

    if (Object.keys(dateFilter).length > 0) {
      where.visitDate = dateFilter
    }

    if (customerId) {
      where.customerId = customerId
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            discountType: true,
            isVip: true
          }
        },
        order: {
          select: {
            id: true,
            status: true,
            finalAmount: true,
            orderItems: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        visitDate: 'desc'
      }
    })

    // 통계 계산
    const stats = {
      totalVisits: visits.length,
      uniqueCustomers: new Set(visits.map(v => v.customerId)).size,
      withOrders: visits.filter(v => v.orderId).length,
      withoutOrders: visits.filter(v => !v.orderId).length,
      totalRevenue: visits.reduce((sum, v) => sum + (v.order?.finalAmount || 0), 0)
    }

    return NextResponse.json({ visits, stats })
  } catch (error) {
    console.error('방문 기록 조회 오류:', error)
    return NextResponse.json(
      { error: '방문 기록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 방문 기록 수동 생성
 * POST: /api/visits
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, visitDate, notes } = body

    if (!customerId) {
      return NextResponse.json(
        { error: '고객 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 고객 존재 확인
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: '고객을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const visit = await prisma.visit.create({
      data: {
        customerId,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        notes
      },
      include: {
        customer: true
      }
    })

    return NextResponse.json(visit, { status: 201 })
  } catch (error) {
    console.error('방문 기록 생성 오류:', error)
    return NextResponse.json(
      { error: '방문 기록 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
