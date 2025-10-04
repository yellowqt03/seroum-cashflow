'use client'

import { useState, useEffect } from 'react'
import { CustomerCard } from './CustomerCard'
import { CustomerForm, CustomerFormData } from './CustomerForm'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Customer, DISCOUNT_TYPES, CUSTOMER_SOURCES } from '@/lib/types'
import { Search, Filter, UserPlus, Users, Crown, Gift, Briefcase } from 'lucide-react'

export function CustomersGrid() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDiscountType, setSelectedDiscountType] = useState<string>('all')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      if (!response.ok) {
        throw new Error('고객 정보를 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setCustomers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      setFormLoading(true)

      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('고객 정보 저장에 실패했습니다.')
      }

      await fetchCustomers()
      setShowForm(false)
      setEditingCustomer(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCustomer(null)
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesDiscountType = selectedDiscountType === 'all' || customer.discountType === selectedDiscountType
    const matchesSource = selectedSource === 'all' || customer.source === selectedSource
    return matchesSearch && matchesDiscountType && matchesSource
  })

  // 통계 계산
  const stats = {
    total: customers.length,
    vip: customers.filter(c => c.isVip).length,
    birthday: customers.filter(c => c.discountType === 'BIRTHDAY').length,
    employee: customers.filter(c => c.discountType === 'EMPLOYEE').length
  }

  if (showForm) {
    return (
      <CustomerForm
        customer={editingCustomer || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={formLoading}
      />
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchCustomers}>다시 시도</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 상단 액션 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">고객 관리</h2>
          <Badge variant="secondary">{stats.total}명</Badge>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          새 고객 등록
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">전체 고객</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.vip}</div>
              <div className="text-sm text-gray-600">VIP 고객</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-pink-600" />
            <div>
              <div className="text-2xl font-bold text-pink-600">{stats.birthday}</div>
              <div className="text-sm text-gray-600">생일자 할인</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.employee}</div>
              <div className="text-sm text-gray-600">직원 할인</div>
            </div>
          </div>
        </div>
      </div>

      {/* 필터링 및 검색 */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="고객명 또는 전화번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 할인 유형 필터 */}
          <Select
            value={selectedDiscountType}
            onChange={(e) => setSelectedDiscountType(e.target.value)}
          >
            <option value="all">모든 할인 유형</option>
            {Object.entries(DISCOUNT_TYPES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>

          {/* 유입 경로 필터 */}
          <Select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            <option value="all">모든 유입 경로</option>
            {Object.entries(CUSTOMER_SOURCES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* 고객 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchTerm || selectedDiscountType !== 'all' || selectedSource !== 'all'
              ? '검색 조건에 맞는 고객이 없습니다.'
              : '등록된 고객이 없습니다.'
            }
          </div>
          {(searchTerm || selectedDiscountType !== 'all' || selectedSource !== 'all') ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedDiscountType('all')
                setSelectedSource('all')
              }}
            >
              필터 초기화
            </Button>
          ) : (
            <Button onClick={() => setShowForm(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              첫 고객 등록하기
            </Button>
          )}
        </div>
      )}
    </div>
  )
}