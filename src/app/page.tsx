import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function Home() {
  const user = await getSession()

  // 로그인된 사용자는 대시보드로 이동
  if (user) {
    if (user.role === 'ADMIN') {
      redirect('/admin/dashboard')
    } else {
      redirect('/staff/dashboard')
    }
  }

  // 로그인하지 않은 사용자는 로그인 페이지로 이동
  redirect('/login')
}
