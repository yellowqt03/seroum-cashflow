'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { StaffAllocationManager } from '@/components/coupons/StaffAllocationManager'
import { ArrowLeft, Ticket, Users, History } from 'lucide-react'

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
}

export default function CouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponId, setCouponId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'allocations' | 'usages'>('allocations')

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setCouponId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (couponId) {
      fetchCoupon()
    }
  }, [couponId])

  const fetchCoupon = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/coupons/${couponId}`)
      if (response.ok) {
        const data = await response.json()
        setCoupon(data)
      } else {
        alert('쿠폰을 찾을 수 없습니다.')
        router.push('/coupons')
      }
    } catch (error) {
      console.error('쿠폰 조회 오류:', error)
      alert('쿠폰 조회 중 오류가 발생했습니다.')
      router.push('/coupons')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">쿠폰 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!coupon) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/coupons')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          쿠폰 목록으로
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-purple-100 rounded-lg flex items-center justify-center">
              <Ticket className="h-8 w-8 text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{coupon.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  coupon.status === 'active' ? 'bg-green-100 text-green-700' :
                  coupon.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {coupon.status === 'active' ? '활성' :
                   coupon.status === 'expired' ? '만료' :
                   coupon.status === 'limit_reached' ? '한도도달' : '비활성'}
                </span>
                <span className="text-sm text-gray-600">
                  {coupon.discountType === 'PERCENT'
                    ? `${coupon.discountValue * 100}% 할인`
                    : `${coupon.discountValue.toLocaleString()}원 할인`
                  }
                </span>
                <span className="text-sm text-gray-600">
                  사용: {coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}회
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 쿠폰 정보 카드 */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">쿠폰 정보</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">할인 방식</p>
            <p className="font-medium text-gray-900">
              {coupon.discountType === 'PERCENT' ? '비율 할인' : '금액 할인'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">할인 값</p>
            <p className="font-medium text-gray-900">
              {coupon.discountType === 'PERCENT'
                ? `${coupon.discountValue * 100}%`
                : `${coupon.discountValue.toLocaleString()}원`
              }
            </p>
          </div>
          {coupon.minAmount && (
            <div>
              <p className="text-sm text-gray-600 mb-1">최소 주문 금액</p>
              <p className="font-medium text-gray-900">{coupon.minAmount.toLocaleString()}원</p>
            </div>
          )}
          {coupon.maxDiscount && (
            <div>
              <p className="text-sm text-gray-600 mb-1">최대 할인 금액</p>
              <p className="font-medium text-gray-900">{coupon.maxDiscount.toLocaleString()}원</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 mb-1">유효 시작일</p>
            <p className="font-medium text-gray-900">
              {new Date(coupon.validFrom).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">유효 종료일</p>
            <p className="font-medium text-gray-900">
              {new Date(coupon.validUntil).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('allocations')}
            className={`px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'allocations'
                ? 'border-purple-600 text-slate-900'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>직원별 할당 관리</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('usages')}
            className={`px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'usages'
                ? 'border-purple-600 text-slate-900'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <span>사용 이력</span>
            </div>
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'allocations' && couponId && (
        <StaffAllocationManager couponId={couponId} />
      )}

      {activeTab === 'usages' && (
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500 text-center py-12">
            사용 이력 기능은 준비 중입니다.
          </p>
        </div>
      )}
    </div>
  )
}
