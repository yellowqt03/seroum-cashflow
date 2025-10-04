import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await clearSession()

    // 로그인 페이지로 리다이렉트
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('로그아웃 오류:', error)
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
