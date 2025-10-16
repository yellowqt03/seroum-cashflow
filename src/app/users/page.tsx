'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/providers/ToastProvider'
import { Plus, Edit2, Trash2, Shield, UserCheck, UserX } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'STAFF'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const { showToast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF',
    isActive: true
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users)
      } else {
        setError(data.error || '직원 목록을 불러오는데 실패했습니다.')
      }
    } catch {
      setError('직원 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (editingUser) {
        // 수정
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || '직원 수정에 실패했습니다.')
          return
        }
      } else {
        // 생성
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || '직원 생성에 실패했습니다.')
          return
        }
      }

      // 성공 시 폼 닫고 목록 새로고침
      setShowForm(false)
      setEditingUser(null)
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'STAFF',
        isActive: true
      })
      fetchUsers()
    } catch {
      setError('처리 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '', // 비밀번호는 비워둠
      name: user.name,
      role: user.role,
      isActive: user.isActive
    })
    setShowForm(true)
    setError('')
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`정말로 ${user.name}(${user.email})를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || '직원 삭제에 실패했습니다.', 'error')
        return
      }

      fetchUsers()
    } catch {
      showToast('삭제 중 오류가 발생했습니다.', 'warning')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingUser(null)
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'STAFF',
      isActive: true
    })
    setError('')
  }

  if (loading) {
    return <div className="p-8">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <BackButton label="뒤로" fallbackHref="/dashboard" />
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                직원 관리
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">직원 관리</h1>
            <p className="text-sm text-gray-600 mt-1">직원 계정 생성, 수정, 삭제</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              새 직원 추가
            </Button>
          )}
        </div>

        {/* 직원 생성/수정 폼 */}
        {showForm && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingUser ? '직원 정보 수정' : '새 직원 추가'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="홍길동"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 {editingUser ? '(변경 시에만 입력)' : '*'}
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="최소 6자"
                    required={!editingUser}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    역할 *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'STAFF' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  >
                    <option value="STAFF">직원</option>
                    <option value="ADMIN">관리자</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-slate-900 rounded focus:ring-slate-900"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  활성화 (비활성화 시 로그인 불가)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  {editingUser ? '수정하기' : '생성하기'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  취소
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 직원 목록 */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    역할
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      등록된 직원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {user.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-slate-900">
                            <Shield className="h-3 w-3" />
                            관리자
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3" />
                            직원
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3" />
                            활성
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <UserX className="h-3 w-3" />
                            비활성
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-slate-900 hover:text-slate-900"
                            title="수정"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="text-red-600 hover:text-red-800"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-900">
            <strong>참고:</strong> 관리자는 모든 기능에 접근할 수 있으며, 직원은 서비스 조회, 고객 관리, 주문 접수만 가능합니다.
          </p>
        </div>
        </div>
      </main>
    </div>
  )
}
