import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 패키지 상세 조회
 * GET: /api/packages/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const packagePurchase = await prisma.packagePurchase.findUnique({
      where: { id },
      include: {
        customer: true,
        service: true,
        packageUsages: {
          include: {
            order: {
              include: {
                orderItems: {
                  include: {
                    service: true
                  }
                }
              }
            },
            orderItem: {
              include: {
                service: true
              }
            }
          },
          orderBy: {
            usedAt: 'desc'
          }
        }
      }
    })

    if (!packagePurchase) {
      return NextResponse.json(
        { error: '패키지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(packagePurchase)
  } catch (error) {
    console.error('패키지 조회 오류:', error)
    return NextResponse.json(
      { error: '패키지를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 패키지 취소
 * DELETE: /api/packages/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 패키지 조회
    const packagePurchase = await prisma.packagePurchase.findUnique({
      where: { id },
      include: {
        packageUsages: true
      }
    })

    if (!packagePurchase) {
      return NextResponse.json(
        { error: '패키지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 사용된 경우 취소 불가
    if (packagePurchase.packageUsages.length > 0) {
      return NextResponse.json(
        { error: '이미 사용된 패키지는 취소할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 패키지 상태를 CANCELLED로 변경
    const updated = await prisma.packagePurchase.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        remainingCount: 0
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('패키지 취소 오류:', error)
    return NextResponse.json(
      { error: '패키지 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 패키지 정보 수정 (메모, 만료일 등)
 * PATCH: /api/packages/[id]
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { notes, expiresAt, status } = body

    const updated = await prisma.packagePurchase.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(status && { status })
      },
      include: {
        customer: true,
        service: true
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('패키지 수정 오류:', error)
    return NextResponse.json(
      { error: '패키지 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
