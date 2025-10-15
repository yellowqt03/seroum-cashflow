'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'

interface Coupon {
  id: string
  name: string
  discountType: string
  discountValue: number
  minAmount: number | null
  maxDiscount: number | null
  validFrom: string
  validUntil: string
  usageLimit: number | null
  usedCount: number
}

interface CouponSelectorProps {
  customerId: string
  subtotal: number
  selectedCouponId: string | null
  onSelectCoupon: (couponId: string | null) => void
}

export default function CouponSelector({
  subtotal,
  selectedCouponId,
  onSelectCoupon
}: CouponSelectorProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAvailableCoupons()
  }, [])

  const fetchAvailableCoupons = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/coupons?active=true')
      const data = await res.json()

      // 사용 가능한 쿠폰만 필터링
      const now = new Date()
      const available = data.filter((coupon: Coupon) => {
        const validFrom = new Date(coupon.validFrom)
        const validUntil = new Date(coupon.validUntil)
        const isDateValid = now >= validFrom && now <= validUntil
        const isUsageValid = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit
        return isDateValid && isUsageValid
      })

      setCoupons(available)
    } catch (error) {
      console.error('쿠폰 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateCouponDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'PERCENT') {
      const discount = Math.floor(subtotal * coupon.discountValue)
      if (coupon.maxDiscount) {
        return Math.min(discount, coupon.maxDiscount)
      }
      return discount
    } else {
      return coupon.discountValue
    }
  }

  const isCouponApplicable = (coupon: Coupon) => {
    if (coupon.minAmount && subtotal < coupon.minAmount) {
      return false
    }
    return true
  }

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'PERCENT') {
      return `${Math.floor(coupon.discountValue * 100)}% 할인`
    } else {
      return `${coupon.discountValue.toLocaleString()}원 할인`
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-700">
          쿠폰 선택
        </label>
        <div className="text-sm text-slate-500">쿠폰 로딩 중...</div>
      </div>
    )
  }

  if (coupons.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-700">
          쿠폰 선택
        </label>
        <div className="text-sm text-slate-500">사용 가능한 쿠폰이 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-700">
        쿠폰 선택
      </label>

      <div className="space-y-2">
        {/* 쿠폰 없음 옵션 */}
        <button
          type="button"
          onClick={() => onSelectCoupon(null)}
          className={`w-full text-left rounded-md border p-3 transition-colors ${
            selectedCouponId === null
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-sm font-medium text-slate-900">
            쿠폰 사용 안 함
          </div>
        </button>

        {/* 쿠폰 목록 */}
        {coupons.map((coupon) => {
          const applicable = isCouponApplicable(coupon)
          const discount = calculateCouponDiscount(coupon)

          return (
            <button
              key={coupon.id}
              type="button"
              onClick={() => applicable && onSelectCoupon(coupon.id)}
              disabled={!applicable}
              className={`w-full text-left rounded-md border p-3 transition-colors ${
                selectedCouponId === coupon.id
                  ? 'border-slate-900 bg-slate-50'
                  : applicable
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-slate-200 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="text-sm font-medium text-slate-900">
                  {coupon.name}
                </div>
                {applicable ? (
                  <Badge variant="success">
                    -{discount.toLocaleString()}원
                  </Badge>
                ) : (
                  <Badge variant="secondary">사용 불가</Badge>
                )}
              </div>

              <div className="text-xs text-slate-600 space-y-0.5">
                <div>{formatDiscount(coupon)}</div>
                {coupon.minAmount && (
                  <div>최소 주문금액: {coupon.minAmount.toLocaleString()}원</div>
                )}
                {coupon.maxDiscount && coupon.discountType === 'PERCENT' && (
                  <div>최대 할인: {coupon.maxDiscount.toLocaleString()}원</div>
                )}
                {!applicable && coupon.minAmount && (
                  <div className="text-red-600 mt-1">
                    최소 주문금액 미달 ({(coupon.minAmount - subtotal).toLocaleString()}원 부족)
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
