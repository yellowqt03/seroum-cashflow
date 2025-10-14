'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { X } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Allocation {
  id: string
  userId: string
  allocatedAmount: number
  autoRefresh: boolean
  refreshPeriod: string | null
  note: string | null
}

interface AllocationFormProps {
  couponId: string
  allocation?: Allocation
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export function AllocationForm({
  couponId,
  allocation,
  onSubmit,
  onCancel
}: AllocationFormProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    userId: allocation?.userId || '',
    allocatedAmount: allocation?.allocatedAmount || 10,
    autoRefresh: allocation?.autoRefresh || false,
    refreshPeriod: allocation?.refreshPeriod || 'MANUAL',
    note: allocation?.note || ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.filter((u: User) => u.role === 'STAFF'))
      }
    } catch (error) {
      console.error('직원 목록 조회 오류:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.userId && !allocation) {
      alert('직원을 선택해주세요.')
      return
    }

    if (formData.allocatedAmount <= 0) {
      alert('할당량은 0보다 커야 합니다.')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('할당 처리 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {allocation ? '할당 수정' : '직원에게 쿠폰 할당'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 직원 선택 */}
          {!allocation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직원 선택 *
              </label>
              <Select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                required
              >
                <option value="">직원을 선택하세요</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* 할당량 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              할당량 (매) *
            </label>
            <Input
              type="number"
              min="1"
              value={formData.allocatedAmount}
              onChange={(e) => setFormData({ ...formData, allocatedAmount: parseInt(e.target.value) || 0 })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              직원에게 할당할 쿠폰 수량을 입력하세요
            </p>
          </div>

          {/* 자동 갱신 */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.autoRefresh}
                onChange={(e) => setFormData({ ...formData, autoRefresh: e.target.checked })}
                className="rounded border-gray-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-gray-700">자동 갱신</span>
            </label>
          </div>

          {/* 갱신 주기 */}
          {formData.autoRefresh && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                갱신 주기
              </label>
              <Select
                value={formData.refreshPeriod}
                onChange={(e) => setFormData({ ...formData, refreshPeriod: e.target.value })}
              >
                <option value="MANUAL">수동</option>
                <option value="WEEKLY">매주</option>
                <option value="MONTHLY">매월</option>
              </Select>
            </div>
          )}

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="할당 관련 메모를 입력하세요"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? '처리 중...' : allocation ? '수정' : '할당'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
