'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { CouponCard } from '@/components/coupons/CouponCard'
import { CouponForm } from '@/components/coupons/CouponForm'
import { Ticket, Plus, Search, Filter, TrendingUp } from 'lucide-react'

interface Coupon {
  id: string
  name: string
  discountType: string
  discountValue: number
  minAmount: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  status: string
  canUse: boolean
  remainingUsage: number | null
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | undefined>()
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCoupons()
  }, [])

  useEffect(() => {
    filterCoupons()
  }, [coupons, filterStatus, searchQuery])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/coupons')
      if (response.ok) {
        const data = await response.json()
        setCoupons(data)
      } else {
        console.error('쿠폰 조회 실패')
      }
    } catch (error) {
      console.error('쿠폰 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCoupons = () => {
    let filtered = [...coupons]

    // 상태 필터
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus)
    }

    // 검색
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query)
      )
    }

    setFilteredCoupons(filtered)
  }

  const handleCreate = async (data: any) => {
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchCoupons()
        setShowForm(false)
        alert('쿠폰이 생성되었습니다.')
      } else {
        const error = await response.json()
        throw new Error(error.error || '쿠폰 생성 실패')
      }
    } catch (error: any) {
      throw error
    }
  }

  const handleEdit = (id: string) => {
    const coupon = coupons.find(c => c.id === id)
    if (coupon) {
      setEditingCoupon(coupon)
      setShowForm(true)
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingCoupon) return

    try {
      const response = await fetch(`/api/coupons/${editingCoupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchCoupons()
        setShowForm(false)
        setEditingCoupon(undefined)
        alert('쿠폰이 수정되었습니다.')
      } else {
        const error = await response.json()
        throw new Error(error.error || '쿠폰 수정 실패')
      }
    } catch (error: any) {
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 쿠폰을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCoupons()
        alert('쿠폰이 삭제되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '쿠폰 삭제 실패')
      }
    } catch (error) {
      console.error('쿠폰 삭제 오류:', error)
      alert('쿠폰 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        await fetchCoupons()
        alert(`쿠폰이 ${isActive ? '활성화' : '비활성화'}되었습니다.`)
      } else {
        const error = await response.json()
        alert(error.error || '쿠폰 상태 변경 실패')
      }
    } catch (error) {
      console.error('쿠폰 상태 변경 오류:', error)
      alert('쿠폰 상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingCoupon(undefined)
  }

  const getStats = () => {
    return {
      total: coupons.length,
      active: coupons.filter(c => c.status === 'active').length,
      expired: coupons.filter(c => c.status === 'expired').length,
      totalUsage: coupons.reduce((sum, c) => sum + c.usedCount, 0)
    }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">쿠폰을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Ticket className="h-8 w-8 text-slate-900" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">쿠폰 관리</h1>
            <p className="text-gray-600 mt-1">할인 쿠폰을 생성하고 관리합니다</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} variant="primary">
          <Plus className="h-5 w-5 mr-2" />
          쿠폰 생성
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 쿠폰</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Ticket className="h-6 w-6 text-slate-900" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">활성 쿠폰</p>
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Ticket className="h-6 w-6 text-slate-900" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">만료됨</p>
              <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Ticket className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 사용 횟수</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalUsage}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-slate-900" />
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">상태:</span>
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-40"
          >
            <option value="all">전체</option>
            <option value="active">활성</option>
            <option value="expired">만료</option>
            <option value="limit_reached">한도 도달</option>
            <option value="inactive">비활성</option>
          </Select>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="쿠폰명 검색..."
              className="pl-10"
            />
          </div>
        </div>
        <div className="text-sm text-gray-500">
          총 {filteredCoupons.length}개의 쿠폰
        </div>
      </div>

      {/* 쿠폰 목록 */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">🎟️</div>
          <p className="text-gray-500">
            {searchQuery || filterStatus !== 'all'
              ? '조건에 맞는 쿠폰이 없습니다.'
              : '생성된 쿠폰이 없습니다. 새 쿠폰을 만들어보세요!'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* 쿠폰 폼 모달 */}
      {showForm && (
        <CouponForm
          coupon={editingCoupon}
          onSubmit={editingCoupon ? handleUpdate : handleCreate}
          onCancel={handleFormClose}
        />
      )}
    </div>
  )
}
