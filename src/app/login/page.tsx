'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다.')
        return
      }

      // 로그인 성공 - 역할에 따라 리다이렉트
      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else {
        router.push('/staff/dashboard')
      }
      router.refresh()
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">
            세로움 캐시플로우
          </h1>
          <p className="text-sm text-slate-600">통합관리시스템</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              required
              autoFocus
            />

            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              required
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6 space-y-3">
          <p className="text-xs font-medium text-slate-500 text-center mb-3">
            데모 계정
          </p>

          <div className="bg-white rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-900">관리자</span>
              <span className="text-xs text-slate-500">전체 권한</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-mono">admin@seroum.com</p>
              <p className="font-mono">admin1234</p>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-900">직원</span>
              <span className="text-xs text-slate-500">제한된 권한</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-mono">staff@seroum.com</p>
              <p className="font-mono">staff1234</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-8">
          © 2025 세로움 수액센터
        </p>
      </div>
    </div>
  )
}
