import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'

export async function POST() {
  try {
    await clearSession()

    return NextResponse.json({ message: '로그아웃되었습니다.' })
  } catch (error) {
    console.error('로그아웃 오류:', error)
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
