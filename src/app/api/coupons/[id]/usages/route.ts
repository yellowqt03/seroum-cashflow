import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 쿠폰 존재 여부 확인
    const coupon = await prisma.coupon.findUnique({
      where: { id }
    })

    if (!coupon) {
      return NextResponse.json(
        { error: '쿠폰을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용 이력 조회
    const usages = await prisma.couponUsage.findMany({
      where: { couponId: id },
      orderBy: {
        usedAt: 'desc'
      }
    })

    // 고객 정보 조회 (customerId로)
    const customerIds = [...new Set(usages.map(u => u.customerId))]
    const customers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds }
      },
      select: {
        id: true,
        name: true,
        phone: true
      }
    })

    const customerMap = new Map(customers.map(c => [c.id, c]))

    // 사용 이력에 고객 정보 추가
    const usagesWithCustomer = usages.map(usage => ({
      ...usage,
      customer: customerMap.get(usage.customerId) || null
    }))

    return NextResponse.json({
      coupon,
      usages: usagesWithCustomer,
      totalUsages: usages.length
    })
  } catch {
    console.error('쿠폰 사용 이력 조회 오류:', error)
    return NextResponse.json(
      { error: '쿠폰 사용 이력을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
