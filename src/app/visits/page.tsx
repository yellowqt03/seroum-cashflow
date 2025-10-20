'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/providers/ToastProvider'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  Users,
  Calendar,
  TrendingUp,
  ShoppingCart,
  User,
  Phone,
  Clock,
  DollarSign
} from 'lucide-react'

interface Visit {
  id: string
  customerId: string
  visitDate: string
  notes: string | null
  customer: {
    id: string
    name: string
    phone: string | null
    discountType: string
    isVip: boolean
  }
  order: {
    id: string
    status: string
    finalAmount: number
    orderItems: Array<{
      service: {
        id: string
        name: string
        category: string
      }
    }>
  } | null
}

interface VisitStats {
  totalVisits: number
  uniqueCustomers: number
  withOrders: number
  withoutOrders: number
  totalRevenue: number
}

export default function VisitsPage() {
  const { showToast } = useToast()
  const [visits, setVisits] = useState<Visit[]>([])
  const [stats, setStats] = useState<VisitStats>({
    totalVisits: 0,
    uniqueCustomers: 0,
    withOrders: 0,
    withoutOrders: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    // 초기 날짜 설정
    const today = new Date()
    setStartDate(today.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    fetchVisits()
  }, [period, startDate, endDate])

  const fetchVisits = async () => {
    try {
      setLoading(true)
      let url = '/api/visits'

      if (period === 'custom' && startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`
      } else if (period !== 'custom') {
        url += `?period=${period}`
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setVisits(data.visits)
        setStats(data.stats)
      } else {
        showToast('방문 기록을 불러올 수 없습니다.', 'error')
      }
    } catch (error) {
      console.error('방문 기록 조회 오류:', error)
      showToast('방문 기록을 불러오는 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return '오늘'
      case 'week': return '이번 주'
      case 'month': return '이번 달'
      case 'custom': return '사용자 지정'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <BackButton label="대시보드" fallbackHref="/dashboard" />
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  방문 고객 관리
                </h1>
                <p className="text-sm text-gray-600">실시간 방문 현황 및 통계</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 영역 */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <Button
              size="sm"
              variant={period === 'today' ? 'primary' : 'outline'}
              onClick={() => setPeriod('today')}
            >
              오늘
            </Button>
            <Button
              size="sm"
              variant={period === 'week' ? 'primary' : 'outline'}
              onClick={() => setPeriod('week')}
            >
              이번 주
            </Button>
            <Button
              size="sm"
              variant={period === 'month' ? 'primary' : 'outline'}
              onClick={() => setPeriod('month')}
            >
              이번 달
            </Button>
            <Button
              size="sm"
              variant={period === 'custom' ? 'primary' : 'outline'}
              onClick={() => setPeriod('custom')}
            >
              사용자 지정
            </Button>

            {period === 'custom' && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto"
                />
                <Button onClick={fetchVisits} size="sm">
                  조회
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">총 방문</p>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}건</p>
            <p className="text-xs text-gray-500 mt-1">{getPeriodLabel()} 방문</p>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">고객 수</p>
              <User className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.uniqueCustomers}명</p>
            <p className="text-xs text-gray-500 mt-1">유니크 고객</p>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">주문 수</p>
              <ShoppingCart className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.withOrders}건</p>
            <p className="text-xs text-gray-500 mt-1">
              주문 없음: {stats.withoutOrders}건
            </p>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">총 매출</p>
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(stats.totalRevenue / 10000).toFixed(0)}만원
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalRevenue.toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 방문 목록 */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              방문 내역 ({visits.length}건)
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">방문 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y">
              {visits.map((visit) => (
                <div key={visit.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {visit.customer.name}
                        </h3>
                        {visit.customer.isVip && (
                          <Badge variant="warning">VIP</Badge>
                        )}
                        {visit.order ? (
                          <Badge variant="success">주문 있음</Badge>
                        ) : (
                          <Badge variant="secondary">주문 없음</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {visit.customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{visit.customer.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(visit.visitDate).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {visit.order && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-blue-900">주문 정보</p>
                            <p className="text-sm font-bold text-blue-900">
                              {visit.order.finalAmount.toLocaleString()}원
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {visit.order.orderItems.map((item, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-white px-2 py-1 rounded text-blue-800"
                              >
                                {item.service.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {visit.notes && (
                        <div className="mt-2 text-sm text-gray-600 italic">
                          메모: {visit.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
