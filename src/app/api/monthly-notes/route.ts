import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    let where = {}
    if (year) {
      where = { ...where, year: parseInt(year) }
    }
    if (month) {
      where = { ...where, month: parseInt(month) }
    }

    const notes = await prisma.monthlyNote.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('월별 특이사항 조회 오류:', error)
    return NextResponse.json(
      { error: '월별 특이사항을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { year, month, content } = await request.json()

    if (!year || !month || !content) {
      return NextResponse.json(
        { error: '연도, 월, 내용은 필수 입력값입니다.' },
        { status: 400 }
      )
    }

    const note = await prisma.monthlyNote.upsert({
      where: {
        year_month: {
          year: parseInt(year),
          month: parseInt(month)
        }
      },
      update: {
        content,
        updatedAt: new Date()
      },
      create: {
        year: parseInt(year),
        month: parseInt(month),
        content
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('월별 특이사항 저장 오류:', error)
    return NextResponse.json(
      { error: '월별 특이사항을 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}