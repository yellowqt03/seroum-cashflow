import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: '고객을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('고객 조회 오류:', error)
    return NextResponse.json(
      { error: '고객 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    // 전화번호 중복 체크 (다른 고객과 중복되는지)
    if (data.phone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          phone: data.phone,
          id: { not: params.id }
        }
      })

      if (existingCustomer) {
        return NextResponse.json(
          { error: '이미 등록된 전화번호입니다.' },
          { status: 400 }
        )
      }
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: data.name,
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        discountType: data.discountType,
        source: data.source,
        isVip: data.isVip || false
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('고객 수정 오류:', error)
    return NextResponse.json(
      { error: '고객 정보 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 주문이 있는 고객은 삭제할 수 없음
    const orderCount = await prisma.order.count({
      where: { customerId: params.id }
    })

    if (orderCount > 0) {
      return NextResponse.json(
        { error: '주문 이력이 있는 고객은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    await prisma.customer.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: '고객이 삭제되었습니다.' })
  } catch (error) {
    console.error('고객 삭제 오류:', error)
    return NextResponse.json(
      { error: '고객 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}