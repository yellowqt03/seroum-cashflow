'use client'

import { LogOut } from 'lucide-react'
import { Button } from './Button'
import { useState } from 'react'
import { useToast } from '@/components/providers/ToastProvider'

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        // 로그아웃 성공 토스트 표시
        showToast('로그아웃되었습니다', 'success')

        // 1초 후 로그인 페이지로 이동 (토스트를 볼 시간을 줌)
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      } else {
        showToast('로그아웃 중 오류가 발생했습니다', 'error')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('로그아웃 오류:', error)
      showToast('로그아웃 중 오류가 발생했습니다', 'error')
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="group"
      onClick={handleLogout}
      disabled={isLoading}
    >
      <LogOut className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
      {isLoading ? '로그아웃 중...' : '로그아웃'}
    </Button>
  )
}
