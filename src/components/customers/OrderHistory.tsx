'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/providers/ToastProvider'
import { Badge } from '@/components/ui/Badge'
import {
  ShoppingCart,
  Calendar,
  DollarSign,
  Package,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  packageType: string | null
  unitPrice: number
  totalPrice: number
  service: {
    id: string
    name: string
    category: string
  }
}

interface Order {
  id: string
  orderDate: string
  status: string
  paymentMethod: string
  subtotal: number
  discountAmount: number
  couponDiscount: number
  finalAmount: number
  appliedDiscountType: string | null
  completedAt: string | null
  orderItems: OrderItem[]
}

interface OrderHistoryProps {
  customerId: string
}

export function OrderHistory({ customerId }: OrderHistoryProps) {
  const { showToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrders()
  }, [customerId])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders?customerId=${customerId}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      } else {
        showToast('주문 내역을 불러올 수 없습니다.', 'error')
      }
    } catch (error) {
      console.error('주문 내역 조회 오류:', error)
      showToast('주문 내역을 불러오는 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleOrderExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">대기 중</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="default">진행 중</Badge>
      case 'COMPLETED':
        return <Badge variant="success">완료</Badge>
      case 'CANCELLED':
        return <Badge variant="danger">취소</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'CARD': return '카드'
      case 'CASH': return '현금'
      case 'TRANSFER': return '계좌이체'
      default: return method
    }
  }

  const getDiscountTypeName = (type: string | null) => {
    if (!type) return null
    switch (type) {
      case 'VIP': return 'VIP 할인'
      case 'BIRTHDAY': return '생일자 할인'
      case 'EMPLOYEE': return '직원 할인'
      default: return type
    }
  }

  const getPackageTypeName = (packageType: string | null) => {
    if (!packageType || packageType === 'single') return null
    switch (packageType) {
      case 'package4': return '4회 패키지'
      case 'package8': return '8회 패키지'
      case 'package10': return '10회 패키지'
      default: return packageType
    }
  }

  // 통계 계산
  const stats = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
    totalSpent: orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.finalAmount, 0),
    totalDiscount: orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.discountAmount + o.couponDiscount, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-gray-600">총 주문</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}건</p>
          <p className="text-xs text-gray-500 mt-1">
            완료: {stats.completedOrders}건
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <p className="text-sm text-gray-600">총 구매액</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(stats.totalSpent / 10000).toFixed(0)}만원
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.totalSpent.toLocaleString()}원
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-5 w-5 text-red-600" />
            <p className="text-sm text-gray-600">총 할인</p>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {(stats.totalDiscount / 10000).toFixed(0)}만원
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.totalDiscount.toLocaleString()}원
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <p className="text-sm text-gray-600">평균 주문액</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.completedOrders > 0
              ? (stats.totalSpent / stats.completedOrders / 10000).toFixed(1)
              : 0}만원
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.completedOrders > 0
              ? Math.round(stats.totalSpent / stats.completedOrders).toLocaleString()
              : 0}원
          </p>
        </div>
      </div>

      {/* 주문 목록 */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">주문 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrders.has(order.id)
            return (
              <div key={order.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                {/* 주문 헤더 */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          주문 #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        {getStatusBadge(order.status)}
                        {order.appliedDiscountType && (
                          <Badge variant="secondary">
                            {getDiscountTypeName(order.appliedDiscountType)}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(order.orderDate).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium text-gray-900">
                            {order.finalAmount.toLocaleString()}원
                          </span>
                          {(order.discountAmount + order.couponDiscount) > 0 && (
                            <span className="text-xs text-red-600">
                              (할인 {(order.discountAmount + order.couponDiscount).toLocaleString()}원)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm text-gray-500">
                        {order.orderItems.length}개 서비스
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 주문 상세 */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="space-y-3">
                      {/* 주문 항목 */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">주문 항목</h4>
                        <div className="space-y-2">
                          {order.orderItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{item.service.name}</p>
                                  {getPackageTypeName(item.packageType) && (
                                    <Badge variant="default" className="text-xs">
                                      <Package className="h-3 w-3 mr-1" />
                                      {getPackageTypeName(item.packageType)}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {item.unitPrice.toLocaleString()}원 × {item.quantity}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  {item.totalPrice.toLocaleString()}원
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 결제 정보 */}
                      <div className="border-t pt-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 mb-1">결제 방법</p>
                            <p className="font-medium text-gray-900">
                              {getPaymentMethodName(order.paymentMethod)}
                            </p>
                          </div>
                          {order.completedAt && (
                            <div>
                              <p className="text-gray-600 mb-1">완료 시간</p>
                              <p className="font-medium text-gray-900">
                                {new Date(order.completedAt).toLocaleString('ko-KR', {
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 금액 상세 */}
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">소계</span>
                          <span className="font-medium">{order.subtotal.toLocaleString()}원</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">할인</span>
                            <span className="text-red-600">-{order.discountAmount.toLocaleString()}원</span>
                          </div>
                        )}
                        {order.couponDiscount > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">쿠폰 할인</span>
                            <span className="text-red-600">-{order.couponDiscount.toLocaleString()}원</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-semibold text-gray-900">최종 결제액</span>
                          <span className="text-lg font-bold text-blue-600">
                            {order.finalAmount.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
