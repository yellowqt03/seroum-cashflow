'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/providers/ToastProvider'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import {
  TrendingUp,
  Calendar,
  Package,
  Star,
  DollarSign,
  ShoppingCart
} from 'lucide-react'

interface Order {
  id: string
  orderDate: string
  status: string
  finalAmount: number
  discountAmount: number
  couponDiscount: number
  orderItems: Array<{
    service: {
      name: string
      category: string
    }
    quantity: number
    totalPrice: number
  }>
}

interface CustomerStatisticsProps {
  customerId: string
}

export function CustomerStatistics({ customerId }: CustomerStatisticsProps) {
  const { showToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [customerId])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders?customerId=${customerId}&status=COMPLETED`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('주문 통계 조회 오류:', error)
      showToast('통계를 불러오는 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // 서비스별 사용 통계
  const serviceStats = orders.reduce((acc: any, order) => {
    order.orderItems.forEach(item => {
      const serviceName = item.service.name
      if (!acc[serviceName]) {
        acc[serviceName] = {
          name: serviceName,
          category: item.service.category,
          count: 0,
          total: 0
        }
      }
      acc[serviceName].count += item.quantity
      acc[serviceName].total += item.totalPrice
    })
    return acc
  }, {})

  const topServices = Object.values(serviceStats)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5)

  // 카테고리별 통계
  const categoryStats = orders.reduce((acc: any, order) => {
    order.orderItems.forEach(item => {
      const category = item.service.category
      if (!acc[category]) {
        acc[category] = { category, count: 0, total: 0 }
      }
      acc[category].count += item.quantity
      acc[category].total += item.totalPrice
    })
    return acc
  }, {})

  const categoryData = Object.values(categoryStats) as Array<{ category: string; count: number; total: number }>

  // 월별 구매 통계
  const monthlyStats = orders.reduce((acc: any, order) => {
    const month = new Date(order.orderDate).toISOString().slice(0, 7)
    if (!acc[month]) {
      acc[month] = { month, count: 0, amount: 0 }
    }
    acc[month].count += 1
    acc[month].amount += order.finalAmount
    return acc
  }, {})

  const monthlyData = Object.values(monthlyStats)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .slice(-6) // 최근 6개월

  // 전체 통계
  const totalStats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + o.finalAmount, 0),
    totalDiscount: orders.reduce((sum, o) => sum + o.discountAmount + o.couponDiscount, 0),
    avgOrderAmount: orders.length > 0
      ? Math.round(orders.reduce((sum, o) => sum + o.finalAmount, 0) / orders.length)
      : 0,
    totalServices: orders.reduce((sum, o) => sum + o.orderItems.reduce((s, i) => s + i.quantity, 0), 0)
  }

  const COLORS = ['#0f172a', '#475569', '#64748b', '#94a3b8', '#cbd5e1']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">완료된 주문이 없어 통계를 표시할 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-200 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-700" />
            </div>
            <p className="text-sm font-medium text-blue-900">총 주문 수</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">{totalStats.totalOrders}건</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-200 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-700" />
            </div>
            <p className="text-sm font-medium text-green-900">총 구매액</p>
          </div>
          <p className="text-3xl font-bold text-green-900">
            {(totalStats.totalSpent / 10000).toFixed(0)}만원
          </p>
          <p className="text-xs text-green-700 mt-1">
            평균 {(totalStats.avgOrderAmount / 10000).toFixed(1)}만원/주문
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-200 rounded-lg">
              <Star className="h-5 w-5 text-purple-700" />
            </div>
            <p className="text-sm font-medium text-purple-900">이용 서비스</p>
          </div>
          <p className="text-3xl font-bold text-purple-900">{totalStats.totalServices}회</p>
          <p className="text-xs text-purple-700 mt-1">
            할인 {(totalStats.totalDiscount / 10000).toFixed(0)}만원 적용
          </p>
        </div>
      </div>

      {/* 선호 서비스 TOP 5 */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          선호 서비스 TOP 5
        </h3>
        <div className="space-y-3">
          {topServices.map((service: any, index) => (
            <div key={service.name} className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-900 font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm font-semibold text-gray-900">{service.count}회</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(service.count / (topServices[0] as any).count) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {service.total.toLocaleString()}원
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 이용 현황 */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              카테고리별 이용 현황
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.category}: ${entry.count}회`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 월별 구매 추이 */}
        {monthlyData.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              최근 월별 구매 추이
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-')
                    return `${month}월`
                  }}
                />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'amount') return [`${value.toLocaleString()}원`, '구매액']
                    return [value, '주문 수']
                  }}
                  labelFormatter={(label) => {
                    const [year, month] = label.split('-')
                    return `${year}년 ${month}월`
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#0f172a" name="주문 수" />
                <Bar dataKey="amount" fill="#64748b" name="구매액" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 인사이트 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          고객 인사이트
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-60 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">평균 방문 주기</p>
            <p className="text-2xl font-bold text-gray-900">
              {orders.length > 1
                ? Math.round(
                    (new Date(orders[0].orderDate).getTime() -
                      new Date(orders[orders.length - 1].orderDate).getTime()) /
                    (1000 * 60 * 60 * 24) / (orders.length - 1)
                  )
                : 0}일
            </p>
          </div>
          <div className="bg-white bg-opacity-60 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">주력 카테고리</p>
            <p className="text-2xl font-bold text-gray-900">
              {categoryData.length > 0
                ? (categoryData as any[]).sort((a, b) => b.count - a.count)[0].category
                : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
