import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 패키지 횟수 수동 조정 API
 *
 * POST /api/packages/[id]/adjust
 * Body: { action: 'use' | 'restore', count: number, note?: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, count, note } = body

    if (!action || !count || count <= 0) {
      return NextResponse.json(
        { error: '작업 유형과 횟수를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (action !== 'use' && action !== 'restore') {
      return NextResponse.json(
        { error: '작업 유형은 use 또는 restore만 가능합니다.' },
        { status: 400 }
      )
    }

    // 패키지 조회
    const packagePurchase = await prisma.packagePurchase.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true } },
        service: { select: { name: true } }
      }
    })

    if (!packagePurchase) {
      return NextResponse.json(
        { error: '패키지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태 검증
    if (packagePurchase.status === 'CANCELLED') {
      return NextResponse.json(
        { error: '취소된 패키지는 수정할 수 없습니다.' },
        { status: 400 }
      )
    }

    if (packagePurchase.status === 'EXPIRED') {
      return NextResponse.json(
        { error: '만료된 패키지는 수정할 수 없습니다.' },
        { status: 400 }
      )
    }

    let newRemainingCount = packagePurchase.remainingCount

    if (action === 'use') {
      // 사용 처리
      if (packagePurchase.remainingCount < count) {
        return NextResponse.json(
          { error: `남은 횟수(${packagePurchase.remainingCount}회)보다 많이 사용할 수 없습니다.` },
          { status: 400 }
        )
      }
      newRemainingCount = packagePurchase.remainingCount - count
    } else {
      // 복구 처리
      if (packagePurchase.remainingCount + count > packagePurchase.totalCount) {
        return NextResponse.json(
          { error: `총 횟수(${packagePurchase.totalCount}회)를 초과할 수 없습니다.` },
          { status: 400 }
        )
      }
      newRemainingCount = packagePurchase.remainingCount + count
    }

    // 트랜잭션으로 업데이트
    const result = await prisma.$transaction(async (tx) => {
      // 패키지 횟수 업데이트
      const updatedPackage = await tx.packagePurchase.update({
        where: { id },
        data: {
          remainingCount: newRemainingCount,
          status: newRemainingCount === 0 ? 'COMPLETED' : 'ACTIVE',
          notes: note
            ? `${packagePurchase.notes ? packagePurchase.notes + '\n' : ''}${new Date().toLocaleString('ko-KR')}: ${action === 'use' ? '사용' : '복구'} ${count}회 - ${note}`
            : packagePurchase.notes
        },
        include: {
          customer: { select: { name: true } },
          service: { select: { name: true } }
        }
      })

      return updatedPackage
    })

    return NextResponse.json({
      success: true,
      message: `패키지 횟수가 ${action === 'use' ? '사용' : '복구'}되었습니다.`,
      package: result
    })
  } catch (error) {
    console.error('패키지 조정 오류:', error)
    return NextResponse.json(
      { error: '패키지 조정에 실패했습니다.' },
      { status: 500 }
    )
  }
}
