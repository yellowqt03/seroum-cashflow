'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { calculateOptimalDiscount, OptimalDiscountOption } from '@/lib/discount'
import { Customer } from '@/lib/types'
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface ServiceItem {
  service: any
  packageType: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface OptimalDiscountSuggestionProps {
  customer: Customer | null
  service: any
  quantity: number
  onApplyDiscount: (option: OptimalDiscountOption) => void
}

export function OptimalDiscountSuggestion({
  customer,
  service,
  quantity,
  onApplyDiscount
}: OptimalDiscountSuggestionProps) {
  const [showAllOptions, setShowAllOptions] = useState(false)

  const optimalCalculation = useMemo(() => {
    if (!customer || !service) return null

    return calculateOptimalDiscount({
      service,
      customer,
      packageType: 'single',
      quantity
    })
  }, [customer, service, quantity])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const getOptionIcon = (option: OptimalDiscountOption) => {
    if (option.requiresApproval) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
    if (option.discountAmount === 0) {
      return <CheckCircle className="h-4 w-4 text-gray-500" />
    }
    return <TrendingUp className="h-4 w-4 text-green-500" />
  }

  const getOptionBadge = (option: OptimalDiscountOption) => {
    if (option.requiresApproval) {
      return <Badge className="bg-orange-100 text-orange-800 border border-orange-200">승인 필요</Badge>
    }
    if (option === optimalCalculation?.bestOption && option.discountAmount > 0) {
      return <Badge className="bg-green-100 text-green-800 border border-green-200">최대 할인</Badge>
    }
    return null
  }

  if (!optimalCalculation || !customer) return null

  const { bestOption, allOptions, canAutoApply } = optimalCalculation
  const displayOptions = showAllOptions ? allOptions : allOptions.slice(0, 3)

  return (
    <Card className="p-6 border-l-4 border-l-green-400">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="h-6 w-6 text-slate-900" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">최적 할인 추천</h3>
          <p className="text-sm text-gray-600">가능한 모든 할인 조합을 분석했습니다</p>
        </div>
      </div>

      {/* 최대 할인 옵션 하이라이트 */}
      {bestOption.discountAmount > 0 && (
        <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-900" />
              <span className="font-medium text-green-800">💰 최대 절약 가능</span>
            </div>
            <Badge className="bg-green-100 text-green-800 border border-green-200">
              {Math.round(bestOption.discountRate * 100)}% 할인
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-600">원래 금액</div>
              <div className="font-medium text-lg">{formatCurrency(optimalCalculation.originalPrice)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">할인 금액</div>
              <div className="font-medium text-lg text-red-600">-{formatCurrency(bestOption.discountAmount)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">최종 금액</div>
              <div className="font-medium text-lg text-slate-900">{formatCurrency(bestOption.finalPrice)}</div>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm text-green-700 mb-2">
              <strong>{bestOption.description}</strong>을 적용하면 최대 할인을 받을 수 있습니다.
            </p>
            {canAutoApply ? (
              <Button
                onClick={() => onApplyDiscount(bestOption)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                최대 할인 즉시 적용
              </Button>
            ) : (
              <Button
                onClick={() => onApplyDiscount(bestOption)}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                승인 요청 후 적용
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 할인 옵션 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">모든 할인 옵션</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllOptions(!showAllOptions)}
            className="flex items-center gap-2"
          >
            {showAllOptions ? (
              <>
                <ChevronUp className="h-4 w-4" />
                간단히 보기
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                전체 보기 ({allOptions.length}개)
              </>
            )}
          </Button>
        </div>

        {displayOptions.map((option, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${
              option === bestOption && option.discountAmount > 0
                ? 'border-green-300 bg-green-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getOptionIcon(option)}
                <span className="font-medium text-gray-900">{option.description}</span>
                {getOptionBadge(option)}
              </div>
              <div className="text-right">
                <div className="font-medium text-lg">
                  {formatCurrency(option.finalPrice)}
                </div>
                {option.discountAmount > 0 && (
                  <div className="text-sm text-red-600">
                    -{formatCurrency(option.discountAmount)}
                  </div>
                )}
              </div>
            </div>

            {/* 할인 내역 상세 */}
            {option.discountAmount > 0 && (
              <div className="bg-slate-50 rounded p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {option.appliedDiscounts.vipDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>VIP 할인:</span>
                      <span className="text-red-600">-{formatCurrency(option.appliedDiscounts.vipDiscount)}</span>
                    </div>
                  )}
                  {option.appliedDiscounts.birthdayDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>생일자 할인:</span>
                      <span className="text-red-600">-{formatCurrency(option.appliedDiscounts.birthdayDiscount)}</span>
                    </div>
                  )}
                  {option.appliedDiscounts.employeeDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>직원 할인:</span>
                      <span className="text-red-600">-{formatCurrency(option.appliedDiscounts.employeeDiscount)}</span>
                    </div>
                  )}
                  {option.appliedDiscounts.packageDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>패키지 할인:</span>
                      <span className="text-red-600">-{formatCurrency(option.appliedDiscounts.packageDiscount)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {option !== bestOption && option.discountAmount > 0 && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyDiscount(option)}
                  className="w-full"
                  disabled={option.requiresApproval}
                >
                  {option.requiresApproval ? '승인 필요' : '이 할인 적용'}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 절약 요약 */}
      {bestOption.discountAmount > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-center text-sm text-gray-600">
            최대 할인 적용 시 <strong className="text-slate-900">{formatCurrency(bestOption.discountAmount)}</strong> 절약!
            <br />
            {customer.name}님께 가장 유리한 조건입니다.
          </div>
        </div>
      )}
    </Card>
  )
}