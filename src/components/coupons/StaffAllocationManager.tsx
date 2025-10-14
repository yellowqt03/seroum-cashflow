'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { AllocationCard } from './AllocationCard'
import { AllocationForm } from './AllocationForm'
import { AllocationStats } from './AllocationStats'
import { Users, Plus, RefreshCw, BarChart3 } from 'lucide-react'

interface Coupon {
  id: string
  name: string
}

interface Allocation {
  id: string
  allocatedAmount: number
  usedAmount: number
  remainingAmount: number
  usageRate: number
  autoRefresh: boolean
  refreshPeriod: string | null
  note: string | null
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

interface StaffAllocationManagerProps {
  couponId: string
}

export function StaffAllocationManager({ couponId }: StaffAllocationManagerProps) {
  const [loading, setLoading] = useState(true)
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [stats, setStats] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAllocation, setEditingAllocation] = useState<Allocation | undefined>()
  const [showStats, setShowStats] = useState(true)

  useEffect(() => {
    fetchAllocations()
    fetchStats()
  }, [couponId])

  const fetchAllocations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/coupons/${couponId}/allocations`)
      if (response.ok) {
        const data = await response.json()
        setCoupon(data.coupon)
        setAllocations(data.allocations)
      } else {
        console.error('할당 목록 조회 실패')
      }
    } catch (error) {
      console.error('할당 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/coupons/${couponId}/allocations/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('통계 조회 오류:', error)
    }
  }

  const handleCreate = async (data: any) => {
    try {
      const response = await fetch(`/api/coupons/${couponId}/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchAllocations()
        await fetchStats()
        setShowForm(false)
        alert('쿠폰이 할당되었습니다.')
      } else {
        const error = await response.json()
        throw new Error(error.error || '할당 실패')
      }
    } catch (error: any) {
      alert(error.message || '할당 중 오류가 발생했습니다.')
      throw error
    }
  }

  const handleEdit = (id: string) => {
    const allocation = allocations.find(a => a.id === id)
    if (allocation) {
      setEditingAllocation(allocation)
      setShowForm(true)
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingAllocation) return

    try {
      const response = await fetch(
        `/api/coupons/${couponId}/allocations/${editingAllocation.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )

      if (response.ok) {
        await fetchAllocations()
        await fetchStats()
        setShowForm(false)
        setEditingAllocation(undefined)
        alert('할당이 수정되었습니다.')
      } else {
        const error = await response.json()
        throw new Error(error.error || '수정 실패')
      }
    } catch (error: any) {
      alert(error.message || '수정 중 오류가 발생했습니다.')
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 할당을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(
        `/api/coupons/${couponId}/allocations/${id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        await fetchAllocations()
        await fetchStats()
        alert('할당이 삭제되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '삭제 실패')
      }
    } catch (error) {
      console.error('할당 삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleReset = async (id: string) => {
    if (!confirm('사용량을 초기화하시겠습니까?')) return

    try {
      const response = await fetch(
        `/api/coupons/${couponId}/allocations/${id}`,
        {
          method: 'POST'
        }
      )

      if (response.ok) {
        await fetchAllocations()
        await fetchStats()
        alert('사용량이 초기화되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '초기화 실패')
      }
    } catch (error) {
      console.error('할당 초기화 오류:', error)
      alert('초기화 중 오류가 발생했습니다.')
    }
  }

  const handleQuickAdjust = async (id: string, amount: number) => {
    const allocation = allocations.find(a => a.id === id)
    if (!allocation) return

    try {
      const response = await fetch(
        `/api/coupons/${couponId}/allocations/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            allocatedAmount: allocation.allocatedAmount + amount
          })
        }
      )

      if (response.ok) {
        await fetchAllocations()
        await fetchStats()
      } else {
        const error = await response.json()
        alert(error.error || '조정 실패')
      }
    } catch (error) {
      console.error('할당 조정 오류:', error)
      alert('조정 중 오류가 발생했습니다.')
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingAllocation(undefined)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">할당 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-slate-900" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">직원별 쿠폰 할당</h2>
            {coupon && (
              <p className="text-sm text-gray-600">쿠폰: {coupon.name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showStats ? '통계 숨기기' : '통계 보기'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchAllocations()
              fetchStats()
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            직원 할당
          </Button>
        </div>
      </div>

      {/* 통계 */}
      {showStats && stats && (
        <AllocationStats stats={stats} />
      )}

      {/* 할당 목록 */}
      {allocations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">아직 할당된 직원이 없습니다.</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            첫 할당 추가하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allocations.map(allocation => (
            <AllocationCard
              key={allocation.id}
              allocation={allocation}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReset={handleReset}
              onQuickAdjust={handleQuickAdjust}
            />
          ))}
        </div>
      )}

      {/* 할당 폼 모달 */}
      {showForm && (
        <AllocationForm
          couponId={couponId}
          allocation={editingAllocation}
          onSubmit={editingAllocation ? handleUpdate : handleCreate}
          onCancel={handleFormClose}
        />
      )}
    </div>
  )
}
