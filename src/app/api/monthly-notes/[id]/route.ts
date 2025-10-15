import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { content } = await request.json()
    const { id } = await params

    if (!content) {
      return NextResponse.json(
        { error: '내용은 필수 입력값입니다.' },
        { status: 400 }
      )
    }

    const note = await prisma.monthlyNote.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(note)
  } catch {
    console.error('월별 특이사항 수정 오류:', error)
    return NextResponse.json(
      { error: '월별 특이사항을 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.monthlyNote.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch {
    console.error('월별 특이사항 삭제 오류:', error)
    return NextResponse.json(
      { error: '월별 특이사항을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}