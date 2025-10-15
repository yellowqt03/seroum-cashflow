import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(services)
  } catch {
    console.error('서비스 조회 오류:', error)
    return NextResponse.json(
      { error: '서비스 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const service = await prisma.service.create({
      data: {
        name: data.name,
        category: data.category,
        price: parseInt(data.price),
        duration: parseInt(data.duration),
        description: data.description || null,
        package4Price: data.package4Price ? parseInt(data.package4Price) : null,
        package8Price: data.package8Price ? parseInt(data.package8Price) : null,
        package10Price: data.package10Price ? parseInt(data.package10Price) : null,
        allowWhiteJade: data.allowWhiteJade ?? true,
        allowWhiteJadeDouble: data.allowWhiteJadeDouble ?? true,
        allowThymus: data.allowThymus ?? true,
        allowPowerShot: data.allowPowerShot ?? true,
        isActive: data.isActive ?? true
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch {
    console.error('서비스 생성 오류:', error)
    return NextResponse.json(
      { error: '서비스 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}