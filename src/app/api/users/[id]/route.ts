import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// 특정 직원 수정 (관리자 전용)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { email, password, name, role, isActive } = body

    // 직원 존재 여부 확인
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: '직원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이메일 중복 체크 (자기 자신 제외)
    if (email && email !== existingUser.email) {
      const duplicateEmail = await prisma.user.findUnique({
        where: { email }
      })

      if (duplicateEmail) {
        return NextResponse.json(
          { error: '이미 존재하는 이메일입니다.' },
          { status: 400 }
        )
      }
    }

    // 비밀번호 변경 시 해시화
    const updateData: {
      email: string
      name: string
      role: string
      isActive: boolean
      password?: string
    } = {
      email: email || existingUser.email,
      name: name || existingUser.name,
      role: role || existingUser.role,
      isActive: isActive !== undefined ? isActive : existingUser.isActive
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    // 직원 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ user: updatedUser })
  } catch {
    console.error('직원 수정 오류:', error)
    return NextResponse.json(
      { error: '직원 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 특정 직원 삭제 (관리자 전용)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { id } = await params

    // 자기 자신은 삭제할 수 없음
    if (id === user.id) {
      return NextResponse.json(
        { error: '자기 자신은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 직원 존재 여부 확인
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: '직원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 직원 삭제
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: '직원이 삭제되었습니다.' })
  } catch {
    console.error('직원 삭제 오류:', error)
    return NextResponse.json(
      { error: '직원 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
