import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 쿠폰 할당 수정
 * PUT /api/coupons/[id]/allocations/[allocationId]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; allocationId: string }> }
) {
  try {
    const { allocationId } = await params
    const data = await request.json()

    // 할당 존재 여부 확인
    const existingAllocation = await prisma.staffCouponAllocation.findUnique({
      where: { id: allocationId }
    })

    if (!existingAllocation) {
      return NextResponse.json(
        { error: '할당 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 수정 가능한 필드만 업데이트
    const updateData: any = {}

    if (data.allocatedAmount !== undefined) {
      updateData.allocatedAmount = parseInt(data.allocatedAmount)
    }

    if (data.usedAmount !== undefined) {
      updateData.usedAmount = parseInt(data.usedAmount)
    }

    if (data.autoRefresh !== undefined) {
      updateData.autoRefresh = data.autoRefresh
    }

    if (data.refreshPeriod !== undefined) {
      updateData.refreshPeriod = data.refreshPeriod
    }

    if (data.note !== undefined) {
      updateData.note = data.note
    }

    // 할당량 수정
    const allocation = await prisma.staffCouponAllocation.update({
      where: { id: allocationId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(allocation)
  } catch (error) {
    console.error('쿠폰 할당 수정 오류:', error)
    return NextResponse.json(
      { error: '쿠폰 할당 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 쿠폰 할당 삭제
 * DELETE /api/coupons/[id]/allocations/[allocationId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; allocationId: string }> }
) {
  try {
    const { allocationId } = await params

    // 할당 존재 여부 확인
    const existingAllocation = await prisma.staffCouponAllocation.findUnique({
      where: { id: allocationId }
    })

    if (!existingAllocation) {
      return NextResponse.json(
        { error: '할당 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 할당 삭제
    await prisma.staffCouponAllocation.delete({
      where: { id: allocationId }
    })

    return NextResponse.json({
      success: true,
      message: '할당이 삭제되었습니다.'
    })
  } catch (error) {
    console.error('쿠폰 할당 삭제 오류:', error)
    return NextResponse.json(
      { error: '쿠폰 할당 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 할당 초기화 (사용량 리셋)
 * POST /api/coupons/[id]/allocations/[allocationId]/reset
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; allocationId: string }> }
) {
  try {
    const { allocationId } = await params

    // 할당 존재 여부 확인
    const existingAllocation = await prisma.staffCouponAllocation.findUnique({
      where: { id: allocationId }
    })

    if (!existingAllocation) {
      return NextResponse.json(
        { error: '할당 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용량 초기화
    const allocation = await prisma.staffCouponAllocation.update({
      where: { id: allocationId },
      data: {
        usedAmount: 0,
        lastRefreshedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(allocation)
  } catch (error) {
    console.error('할당 초기화 오류:', error)
    return NextResponse.json(
      { error: '할당 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
