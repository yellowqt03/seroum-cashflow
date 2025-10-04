'use client'

import { LogOut } from 'lucide-react'
import { Button } from './Button'
import { useState } from 'react'

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        // 로그아웃 성공 시 로그인 페이지로 이동
        window.location.href = '/login'
      } else {
        alert('로그아웃 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('로그아웃 오류:', error)
      alert('로그아웃 중 오류가 발생했습니다.')
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
