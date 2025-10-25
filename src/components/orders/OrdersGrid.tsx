'use client'

import { useState, useEffect } from 'react'
import { OrderCard } from './OrderCard'
import { OrderForm } from './OrderForm'
import { OrderDetailModal } from './OrderDetailModal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { ORDER_STATUSES } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { useToast } from '@/components/providers/ToastProvider'
import {
  Plus,
  RefreshCw,
  Filter,
  ShoppingBag,
  Clock,
  CheckCircle,
  DollarSign
} from 'lucide-react'

export function OrdersGrid() {
  const { showToast } = useToast()
  interface Order {
    id: string
    status: string
    finalAmount: number
    [key: string]: unknown
  }

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/orders?${params.toString()}`)
      if (!response.ok) {
        throw new Error('주문 정보를 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setOrders(data)
    } catch {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('상태 업데이트에 실패했습니다.')
      }

      // 목록 새로고침
      await fetchOrders()
      showToast('주문 상태가 업데이트되었습니다', 'success')
    } catch (error) {
      console.error('상태 업데이트 오류:', error)
      showToast('상태 업데이트에 실패했습니다', 'error')
    }
  }

  const handleOrderSubmit = () => {
    setShowOrderForm(false)
    fetchOrders() // 새로운 주문 추가 후 목록 새로고침
  }

  // 통계 계산
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
    totalRevenue: orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.finalAmount, 0)
  }

  if (showOrderForm) {
    return (
      <OrderForm
        onOrderSubmit={handleOrderSubmit}
        onCancel={() => setShowOrderForm(false)}
      />
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchOrders}>다시 시도</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 상단 액션 및 통계 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">주문 관리</h2>
          <Badge variant="secondary">{stats.total}건</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button onClick={() => setShowOrderForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 주문
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-slate-900" />
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-sm text-gray-600">전체 주문</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">대기 중</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-slate-900" />
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">진행 중</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-slate-900" />
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.completed}</div>
              <div className="text-sm text-gray-600">완료</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-slate-900" />
            <div>
              <div className="text-xl font-bold text-slate-900">
                {formatPrice(stats.totalRevenue)}
              </div>
              <div className="text-sm text-gray-600">완료 매출</div>
            </div>
          </div>
        </div>
      </div>

      {/* 필터링 */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center space-x-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          >
            <option value="all">모든 상태</option>
            {Object.entries(ORDER_STATUSES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
          <div className="text-sm text-gray-600">
            {statusFilter === 'all' ? '전체' : ORDER_STATUSES[statusFilter as keyof typeof ORDER_STATUSES]} 주문: {orders.length}건
          </div>
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusUpdate={handleStatusUpdate}
            onViewDetails={(order) => setSelectedOrderId(order.id)}
          />
        ))}
      </div>

      {/* 주문 상세 모달 */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => {
            setSelectedOrderId(null)
            fetchOrders() // 모달 닫을 때 목록 새로고침
          }}
        />
      )}

      {/* 빈 상태 */}
      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {statusFilter === 'all'
              ? '주문이 없습니다.'
              : `${ORDER_STATUSES[statusFilter as keyof typeof ORDER_STATUSES]} 상태의 주문이 없습니다.`
            }
          </div>
          <div className="space-x-4">
            {statusFilter !== 'all' && (
              <Button
                variant="outline"
                onClick={() => setStatusFilter('all')}
              >
                전체 주문 보기
              </Button>
            )}
            <Button onClick={() => setShowOrderForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              첫 주문 등록하기
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}