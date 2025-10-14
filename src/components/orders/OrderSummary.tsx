'use client'

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Customer, DISCOUNT_TYPES, PAYMENT_METHODS } from '@/lib/types'
import { calculateDiscount, simulateDiscount, calculateAdvancedDiscount, calculateOptimalDiscount, OptimalDiscountOption } from '@/lib/discount'
import { formatPrice } from '@/lib/utils'
import { Calculator, AlertTriangle, CheckCircle, CreditCard, Sparkles, Tag } from 'lucide-react'

interface ServiceItem {
  service: any
  packageType: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Coupon {
  id: string
  name: string
  discountType: string
  discountValue: number
  minAmount: number | null
  maxDiscount: number | null
}

interface OrderSummaryProps {
  customer: Customer | null
  services: ServiceItem[]
  selectedCouponId: string | null
  paymentMethod: string
  onPaymentMethodChange: (method: string) => void
  onApprovalRequest?: () => void
  onOptimalDiscountApply?: (option: OptimalDiscountOption, serviceIndex: number) => void
}

export function OrderSummary({ customer, services, selectedCouponId, paymentMethod, onPaymentMethodChange, onApprovalRequest, onOptimalDiscountApply }: OrderSummaryProps) {
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)

  useEffect(() => {
    if (selectedCouponId) {
      fetchCoupon(selectedCouponId)
    } else {
      setSelectedCoupon(null)
    }
  }, [selectedCouponId])

  const fetchCoupon = async (couponId: string) => {
    try {
      const res = await fetch(`/api/coupons/${couponId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedCoupon(data)
      }
    } catch (error) {
      console.error('쿠폰 조회 오류:', error)
    }
  }
  const calculations = useMemo(() => {
    if (!customer || services.length === 0) {
      return null
    }

    // 각 서비스별 고급 할인 계산 (중복 할인 감지 포함)
    const serviceCalculations = services.map((item, index) => {
      const result = calculateAdvancedDiscount({
        service: item.service,
        customer: customer,
        packageType: item.packageType,
        quantity: item.quantity
      })

      // 최적 할인 계산도 추가
      const optimalResult = calculateOptimalDiscount({
        service: item.service,
        customer: customer,
        packageType: item.packageType,
        quantity: item.quantity
      })

      return {
        ...item,
        calculation: result,
        optimalCalculation: optimalResult,
        serviceIndex: index
      }
    })

    // 전체 합계 계산
    const totalOriginal = serviceCalculations.reduce((sum, item) =>
      sum + item.calculation.originalPrice, 0)
    const totalPackageDiscount = serviceCalculations.reduce((sum, item) =>
      sum + item.calculation.packageDiscount, 0)
    const totalCustomerDiscount = serviceCalculations.reduce((sum, item) =>
      sum + item.calculation.customerDiscount, 0)
    const totalDiscount = totalPackageDiscount + totalCustomerDiscount
    const subtotalAfterDiscount = totalOriginal - totalDiscount

    // 쿠폰 할인 계산
    let couponDiscount = 0
    if (selectedCoupon) {
      if (selectedCoupon.discountType === 'PERCENT') {
        couponDiscount = Math.floor(subtotalAfterDiscount * selectedCoupon.discountValue)
        if (selectedCoupon.maxDiscount) {
          couponDiscount = Math.min(couponDiscount, selectedCoupon.maxDiscount)
        }
      } else {
        couponDiscount = selectedCoupon.discountValue
      }
    }

    const finalAmount = subtotalAfterDiscount - couponDiscount

    // 중복 할인 감지 및 경고 메시지 수집
    const conflicts = serviceCalculations.flatMap(item => item.calculation.conflicts)
    const hasConflicts = conflicts.length > 0
    const requiresApproval = serviceCalculations.some(item => item.calculation.requiresApproval)
    const canProceed = !requiresApproval // 승인이 필요한 경우 진행 불가

    return {
      serviceCalculations,
      summary: {
        originalPrice: totalOriginal,
        packageDiscount: totalPackageDiscount,
        customerDiscount: totalCustomerDiscount,
        totalDiscount: totalDiscount,
        couponDiscount: couponDiscount,
        finalPrice: finalAmount,
        discountRate: totalOriginal > 0 ? ((totalDiscount + couponDiscount) / totalOriginal) : 0
      },
      conflicts,
      hasConflicts,
      requiresApproval,
      canProceed
    }
  }, [customer, services, selectedCoupon])

  if (!customer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            주문 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            고객을 먼저 선택해주세요.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            주문 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            서비스를 선택해주세요.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          주문 요약 및 할인 계산
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 고객 정보 요약 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{customer.name}</span>
            <Badge variant={customer.discountType === 'VIP' ? 'default' : 'secondary'}>
              {DISCOUNT_TYPES[customer.discountType as keyof typeof DISCOUNT_TYPES]}
            </Badge>
          </div>
          {customer.discountType === 'BIRTHDAY' && (
            <div className="text-sm text-gray-600">
              올해 생일자 할인 사용: {customer.birthdayUsedCount}/8회
            </div>
          )}
        </div>

        {/* 중복 할인 경고 메시지 */}
        {calculations?.hasConflicts && (
          <div className="space-y-2">
            {calculations.conflicts.map((conflict, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 p-3 rounded-lg ${
                  conflict.severity === 'critical'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <AlertTriangle className={`h-4 w-4 ${
                  conflict.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                }`} />
                <span className={`text-sm ${
                  conflict.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {conflict.description}
                </span>
                {conflict.requiresApproval && (
                  <Badge className="ml-auto bg-orange-100 text-orange-800 border border-orange-200">
                    관리자 승인 필요
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 승인 필요 알림 */}
        {calculations?.requiresApproval && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">관리자 승인이 필요합니다</span>
            </div>
            <p className="text-sm text-orange-700 mb-3">
              중복 할인이 감지되어 관리자의 승인이 필요합니다. 주문을 진행하려면 승인 요청을 보내주세요.
            </p>
            {onApprovalRequest && (
              <Button
                onClick={onApprovalRequest}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                관리자 승인 요청하기
              </Button>
            )}
          </div>
        )}

        {/* 서비스별 계산 내역 */}
        {calculations?.serviceCalculations && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">서비스별 할인 내역</h4>
            {calculations.serviceCalculations.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{item.service.name}</div>
                    <div className="text-sm text-gray-600">
                      {item.packageType === 'single' ? '단품' : `${item.packageType.replace('package', '')}회 패키지`} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    {item.calculation.totalDiscount > 0 && (
                      <div className="text-sm text-red-600 line-through">
                        {formatPrice(item.calculation.originalPrice)}
                      </div>
                    )}
                    <div className="font-medium text-blue-600">
                      {formatPrice(item.calculation.finalPrice)}
                    </div>
                  </div>
                </div>

                {/* 최적 할인 추천 */}
                {item.optimalCalculation && item.optimalCalculation.bestOption.discountAmount > 0 && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">💡 더 저렴한 옵션이 있어요!</span>
                    </div>
                    <div className="text-sm text-green-700 mb-2">
                      <strong>{item.optimalCalculation.bestOption.description}</strong>으로 변경하면
                      <strong className="text-green-800"> {formatPrice(item.optimalCalculation.bestOption.discountAmount - item.calculation.totalDiscount)} 더 절약</strong>할 수 있습니다.
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        현재: {formatPrice(item.calculation.finalPrice)} → 최적: {formatPrice(item.optimalCalculation.bestOption.finalPrice)}
                      </div>
                      {onOptimalDiscountApply && item.optimalCalculation.canAutoApply && (
                        <Button
                          size="sm"
                          onClick={() => onOptimalDiscountApply(item.optimalCalculation.bestOption, item.serviceIndex)}
                          className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          즉시 적용
                        </Button>
                      )}
                      {onOptimalDiscountApply && !item.optimalCalculation.canAutoApply && (
                        <Badge className="bg-orange-100 text-orange-800 border border-orange-200 text-xs">
                          승인 필요
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* 할인 내역 */}
                {(item.calculation.packageDiscount > 0 || item.calculation.customerDiscount > 0) && (
                  <div className="space-y-1 text-sm">
                    {item.calculation.packageDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>패키지 할인</span>
                        <span>-{formatPrice(item.calculation.packageDiscount)}</span>
                      </div>
                    )}
                    {item.calculation.customerDiscount > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>
                          {customer.discountType === 'VIP' ? 'VIP' :
                           customer.discountType === 'BIRTHDAY' ? '생일자' :
                           customer.discountType === 'EMPLOYEE' ? '직원' : '고객'} 할인
                        </span>
                        <span>-{formatPrice(item.calculation.customerDiscount)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 전체 합계 */}
        {calculations?.summary && (
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>소계 (할인 전)</span>
                <span>{formatPrice(calculations.summary.originalPrice)}</span>
              </div>

              {calculations.summary.packageDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>패키지 할인</span>
                  <span>-{formatPrice(calculations.summary.packageDiscount)}</span>
                </div>
              )}

              {calculations.summary.customerDiscount > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>
                    {customer.discountType === 'VIP' ? 'VIP' :
                     customer.discountType === 'BIRTHDAY' ? '생일자' :
                     customer.discountType === 'EMPLOYEE' ? '직원' : '고객'} 할인
                  </span>
                  <span>-{formatPrice(calculations.summary.customerDiscount)}</span>
                </div>
              )}

              {calculations.summary.couponDiscount > 0 && (
                <div className="flex justify-between items-center text-purple-600">
                  <span className="flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    쿠폰 할인
                    {selectedCoupon && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {selectedCoupon.name}
                      </Badge>
                    )}
                  </span>
                  <span>-{formatPrice(calculations.summary.couponDiscount)}</span>
                </div>
              )}

              {(calculations.summary.totalDiscount + calculations.summary.couponDiscount) > 0 && (
                <div className="flex justify-between border-t pt-2 text-gray-600">
                  <span>총 할인 금액</span>
                  <span>-{formatPrice(calculations.summary.totalDiscount + calculations.summary.couponDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>최종 결제금액</span>
                <span className="text-blue-600">{formatPrice(calculations.summary.finalPrice)}</span>
              </div>

              {calculations.summary.discountRate > 0 && (
                <div className="text-center text-sm text-gray-600">
                  총 {Math.round(calculations.summary.discountRate * 100)}% 할인 적용
                </div>
              )}
            </div>
          </div>
        )}

        {/* 결제 방법 선택 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            결제 방법
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => onPaymentMethodChange(key)}
                className={`p-3 text-sm border rounded-lg transition-colors ${
                  paymentMethod === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 주문 가능 여부 */}
        <div className="flex items-center space-x-2 p-3 rounded-lg">
          {calculations?.canProceed ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">주문 가능</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-700 font-medium">주문 불가 (할인 한도 초과)</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}