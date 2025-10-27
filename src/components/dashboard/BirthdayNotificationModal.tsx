'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Gift, X, Cake, Calendar, Phone } from 'lucide-react'

interface BirthdayCustomer {
  id: string
  name: string
  phone: string | null
  birthDate: string | null
}

interface CouponCreated {
  customerId: string
  customerName: string
  couponId: string
  couponName: string
}

interface BirthdayNotificationModalProps {
  onClose: () => void
}

export function BirthdayNotificationModal({ onClose }: BirthdayNotificationModalProps) {
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<BirthdayCustomer[]>([])
  const [couponsCreated, setCouponsCreated] = useState<CouponCreated[]>([])
  const [error, setError] = useState<string | null>(null)
  const [creatingCoupons, setCreatingCoupons] = useState(false)

  useEffect(() => {
    checkBirthdayCustomers()
  }, [])

  const checkBirthdayCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/coupons/birthday')

      if (!response.ok) {
        throw new Error('생일 고객 조회 실패')
      }

      const data = await response.json()
      setCustomers(data.customers || [])
      setCouponsCreated(data.couponsCreated || [])
    } catch (err) {
      console.error('생일 고객 조회 오류:', err)
      setError('생일 고객 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const createCouponForCustomer = async (customerId: string) => {
    try {
      setCreatingCoupons(true)
      const response = await fetch('/api/coupons/birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '쿠폰 발급 실패')
      }

      const data = await response.json()

      // 쿠폰 생성 성공 시 목록 갱신
      setCouponsCreated(prev => [...prev, {
        customerId: data.customer.id,
        customerName: data.customer.name,
        couponId: data.coupon.id,
        couponName: data.coupon.name
      }])

      alert(`${data.customer.name}님에게 생일 쿠폰이 발급되었습니다!`)
    } catch (err) {
      console.error('쿠폰 발급 오류:', err)
      alert(err instanceof Error ? err.message : '쿠폰 발급에 실패했습니다.')
    } finally {
      setCreatingCoupons(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">생일 고객 확인 중...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-600">오류</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onClose} className="w-full">
            확인
          </Button>
        </div>
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cake className="h-6 w-6 text-pink-500" />
              <h3 className="text-lg font-semibold text-gray-900">생일 고객 알림</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">오늘 생일인 고객이 없습니다.</p>
          </div>
          <Button onClick={onClose} className="w-full mt-4">
            확인
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Gift className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">생일 축하합니다! 🎉</h2>
                <p className="text-pink-100 text-sm mt-1">
                  오늘 생일인 고객 {customers.length}명
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-pink-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 고객 목록 */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-4">
            {customers.map((customer) => {
              const hasCoupon = couponsCreated.some(c => c.customerId === customer.id)

              return (
                <div
                  key={customer.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Cake className="h-5 w-5 text-pink-500" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {customer.name}
                        </h3>
                        {hasCoupon && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Gift className="h-3 w-3 mr-1" />
                            쿠폰 발급됨
                          </span>
                        )}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.birthDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(customer.birthDate).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {hasCoupon ? (
                        <div className="text-green-600 text-sm font-medium">
                          ✓ 발급 완료
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => createCouponForCustomer(customer.id)}
                          disabled={creatingCoupons}
                          className="bg-pink-500 hover:bg-pink-600"
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          쿠폰 발급
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 쿠폰 정보 */}
        <div className="bg-gray-50 p-4 border-t">
          <div className="text-sm text-gray-600">
            <p className="font-semibold mb-2">생일 쿠폰 혜택:</p>
            <ul className="space-y-1 ml-4">
              <li>• 20% 할인 (최대 50,000원)</li>
              <li>• 최소 주문금액: 50,000원</li>
              <li>• 유효기간: 30일</li>
              <li>• 1회 사용 가능</li>
            </ul>
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
