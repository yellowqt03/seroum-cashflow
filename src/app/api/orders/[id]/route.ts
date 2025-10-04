import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        orderItems: {
          include: {
            service: true
          }
        },
        orderAddOns: {
          include: {
            addOn: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('주문 조회 오류:', error)
    return NextResponse.json(
      { error: '주문 정보를 불러오는데 실패했습니다.' },
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

    // 현재 주문 상태 확인
    const currentOrder = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태 변경 유효성 검사
    const validTransitions: { [key: string]: string[] } = {
      'PENDING': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // 완료된 주문은 변경 불가
      'CANCELLED': [] // 취소된 주문은 변경 불가
    }

    if (data.status && !validTransitions[currentOrder.status]?.includes(data.status)) {
      return NextResponse.json(
        { error: `${currentOrder.status}에서 ${data.status}로 상태 변경이 불가능합니다.` },
        { status: 400 }
      )
    }

    // 주문 업데이트
    const updateData: any = {}

    if (data.status) {
      updateData.status = data.status

      // 완료 시간 기록
      if (data.status === 'COMPLETED') {
        updateData.completedAt = new Date()
      }
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        orderItems: {
          include: {
            service: true
          }
        },
        orderAddOns: {
          include: {
            addOn: true
          }
        }
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('주문 수정 오류:', error)
    return NextResponse.json(
      { error: '주문 정보 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 주문 상태 확인 (완료된 주문은 삭제 불가)
    const order = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (order.status === 'COMPLETED') {
      return NextResponse.json(
        { error: '완료된 주문은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 주문 삭제 (관련 데이터 모두 삭제)
    await prisma.$transaction(async (tx) => {
      // 주문 항목 삭제
      await tx.orderItem.deleteMany({
        where: { orderId: params.id }
      })

      // 주문 추가구성 삭제
      await tx.orderAddOn.deleteMany({
        where: { orderId: params.id }
      })

      // 주문 삭제
      await tx.order.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ message: '주문이 삭제되었습니다.' })
  } catch (error) {
    console.error('주문 삭제 오류:', error)
    return NextResponse.json(
      { error: '주문 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}