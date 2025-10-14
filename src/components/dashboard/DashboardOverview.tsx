'use client'

import { useState, useEffect } from 'react'
import { StatsCard } from './StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, formatPrice } from '@/lib/utils'
import { SERVICE_CATEGORIES, DISCOUNT_TYPES } from '@/lib/types'
import {
  DollarSign,
  Users,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Crown,
  Gift,
  Briefcase,
  RefreshCw
} from 'lucide-react'

interface DashboardStats {
  totalSales: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  salesChange: number
  ordersChange: number
  customersChange: number
  topServices: Array<{
    name: string
    count: number
    revenue: number
  }>
  customerBreakdown: {
    regular: number
    vip: number
    birthday: number
    employee: number
  }
  recentOrders: Array<{
    id: string
    customerName: string
    serviceName: string
    amount: number
    discountType?: string
    createdAt: string
  }>
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      // 현재는 더미 데이터로 시작 (실제로는 API에서 가져올 예정)
      const mockStats: DashboardStats = {
        totalSales: 12450000,
        totalOrders: 186,
        totalCustomers: 89,
        averageOrderValue: 66935,
        salesChange: 12.5,
        ordersChange: 8.3,
        customersChange: 5.7,
        topServices: [
          { name: '프리미엄회복', count: 23, revenue: 2760000 },
          { name: '파워비타민', count: 18, revenue: 1260000 },
          { name: '백옥', count: 31, revenue: 930000 },
          { name: '혈관청소', count: 12, revenue: 960000 },
          { name: '킬레이션', count: 8, revenue: 960000 }
        ],
        customerBreakdown: {
          regular: 45,
          vip: 12,
          birthday: 23,
          employee: 9
        },
        recentOrders: [
          { id: '1', customerName: '김○○', serviceName: '프리미엄회복', amount: 120000, discountType: 'BIRTHDAY', createdAt: new Date().toISOString() },
          { id: '2', customerName: '이○○', serviceName: '파워비타민', amount: 70000, createdAt: new Date().toISOString() },
          { id: '3', customerName: '박○○', serviceName: 'VIP백옥', amount: 0, discountType: 'VIP', createdAt: new Date().toISOString() },
          { id: '4', customerName: '최○○', serviceName: '혈관청소', amount: 40000, discountType: 'EMPLOYEE', createdAt: new Date().toISOString() }
        ]
      }

      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStats(mockStats)
    } catch (err) {
      setError('대시보드 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
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
        <Button onClick={fetchDashboardStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          다시 시도
        </Button>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="오늘의 매출"
          value={stats.totalSales}
          type="currency"
          change={stats.salesChange}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        <StatsCard
          title="총 주문"
          value={stats.totalOrders}
          type="number"
          change={stats.ordersChange}
          icon={<ShoppingBag className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="총 고객"
          value={stats.totalCustomers}
          type="number"
          change={stats.customersChange}
          icon={<Users className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="평균 주문액"
          value={stats.averageOrderValue}
          type="currency"
          icon={<TrendingUp className="h-6 w-6" />}
          color="yellow"
        />
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 인기 서비스 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              인기 서비스 TOP 5
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topServices.map((service, index) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 text-slate-900 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-500">{service.count}회 시술</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatPrice(service.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 고객 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              고객 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>일반 고객</span>
                </div>
                <Badge variant="secondary">{stats.customerBreakdown.regular}명</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span>VIP 고객</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">{stats.customerBreakdown.vip}명</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Gift className="h-4 w-4 text-pink-500" />
                  <span>생일자 할인</span>
                </div>
                <Badge className="bg-pink-100 text-pink-800">{stats.customerBreakdown.birthday}명</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  <span>직원 할인</span>
                </div>
                <Badge className="bg-blue-100 text-slate-900">{stats.customerBreakdown.employee}명</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 주문 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            최근 주문
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.serviceName}</div>
                  </div>
                  {order.discountType && order.discountType !== 'REGULAR' && (
                    <Badge variant="secondary" className="text-xs">
                      {DISCOUNT_TYPES[order.discountType as keyof typeof DISCOUNT_TYPES]}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatPrice(order.amount)}</div>
                  <div className="text-sm text-gray-500">{formatDate(new Date(order.createdAt), 'time')}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}