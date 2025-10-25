import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

/**
 * 초기 관리자 계정 생성 API
 * 보안을 위해 한 번만 실행 가능 (이미 사용자가 있으면 차단)
 */
export async function POST(request: Request) {
  try {
    // 이미 사용자가 있는지 확인
    const userCount = await prisma.user.count()

    if (userCount > 0) {
      return NextResponse.json(
        { error: '이미 사용자가 존재합니다. 보안상 초기화를 진행할 수 없습니다.' },
        { status: 403 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash('admin1234', 10)

    // 관리자 계정 생성
    const admin = await prisma.user.create({
      data: {
        email: 'admin@seroum.com',
        password: hashedPassword,
        name: '세로움 관리자',
        role: 'ADMIN',
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: '관리자 계정이 생성되었습니다.',
      user: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      credentials: {
        email: 'admin@seroum.com',
        password: 'admin1234',
        warning: '⚠️ 보안을 위해 첫 로그인 후 비밀번호를 변경하세요.'
      }
    })
  } catch (error) {
    console.error('초기화 오류:', error)
    return NextResponse.json(
      { error: '초기화 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
