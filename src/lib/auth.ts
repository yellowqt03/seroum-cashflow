import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'STAFF'
}

// 간단한 세션 관리 (쿠키 기반)
export async function setSession(user: User) {
  const cookieStore = await cookies()
  const sessionData = JSON.stringify(user)

  cookieStore.set('session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')

    if (!session) {
      return null
    }

    return JSON.parse(session.value) as User
  } catch {
    return null
  }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'ADMIN'
}

export function isStaff(user: User | null): boolean {
  return user?.role === 'STAFF'
}
