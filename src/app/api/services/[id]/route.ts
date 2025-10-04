import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: params.id }
    })

    if (!service) {
      return NextResponse.json(
        { error: '서비스를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('서비스 조회 오류:', error)
    return NextResponse.json(
      { error: '서비스 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    const service = await prisma.service.update({
      where: { id: params.id },
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

    return NextResponse.json(service)
  } catch (error) {
    console.error('서비스 수정 오류:', error)
    return NextResponse.json(
      { error: '서비스 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 주문에서 사용 중인지 확인
    const orderItems = await prisma.orderItem.count({
      where: { serviceId: params.id }
    })

    if (orderItems > 0) {
      return NextResponse.json(
        { error: '이미 주문에서 사용 중인 서비스는 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    await prisma.service.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: '서비스가 삭제되었습니다.' })
  } catch (error) {
    console.error('서비스 삭제 오류:', error)
    return NextResponse.json(
      { error: '서비스 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
