import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// 전체 직원 목록 조회 (관리자 전용)
export async function GET() {
  try {
    const user = await getSession()

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('직원 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '직원 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 새 직원 생성 (관리자 전용)
export async function POST(request: Request) {
  try {
    const user = await getSession()

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, name, role } = body

    // 유효성 검사
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    if (!['ADMIN', 'STAFF'].includes(role)) {
      return NextResponse.json(
        { error: '잘못된 역할입니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10)

    // 직원 생성
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('직원 생성 오류:', error)
    return NextResponse.json(
      { error: '직원 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
