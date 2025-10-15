import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const discountType = searchParams.get('discountType')
    const source = searchParams.get('source')

    const where: Prisma.CustomerWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (discountType && discountType !== 'all') {
      where.discountType = discountType
    }

    if (source && source !== 'all') {
      where.source = source
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(customers)
  } catch {
    console.error('고객 조회 오류:', error)
    return NextResponse.json(
      { error: '고객 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // 전화번호 중복 체크 (전화번호가 있는 경우)
    if (data.phone) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { phone: data.phone }
      })

      if (existingCustomer) {
        return NextResponse.json(
          { error: '이미 등록된 전화번호입니다.' },
          { status: 400 }
        )
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        discountType: data.discountType,
        source: data.source,
        isVip: data.isVip || false
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch {
    console.error('고객 생성 오류:', error)
    return NextResponse.json(
      { error: '고객 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
}