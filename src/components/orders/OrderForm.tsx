'use client'

import { useState } from 'react'
import { CustomerSelector } from './CustomerSelector'
import { ServiceSelector } from './ServiceSelector'
import { OrderSummary } from './OrderSummary'
import CouponSelector from './CouponSelector'
import { CustomerForm, CustomerFormData } from '../customers/CustomerForm'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Customer } from '@/lib/types'
import { calculateAdvancedDiscount, createDiscountApprovalRequest, OptimalDiscountOption } from '@/lib/discount'
import { useToast } from '@/components/providers/ToastProvider'
import { ArrowLeft, ArrowRight, Save, X, AlertTriangle } from 'lucide-react'

interface ServiceItem {
  service: any
  packageType: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface OrderFormProps {
  onOrderSubmit?: (orderData: any) => void
  onCancel?: () => void
}

export function OrderForm({ onOrderSubmit, onCancel }: OrderFormProps) {
  const { showToast } = useToast()
  const [step, setStep] = useState(1) // 1: 고객선택, 2: 서비스선택, 3: 확인/결제
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([])
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('CARD')
  const [notes, setNotes] = useState<string>('')
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [discountConflicts, setDiscountConflicts] = useState<any[]>([])
  const [requiresApproval, setRequiresApproval] = useState(false)

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return selectedCustomer !== null
      case 2:
        return selectedServices.length > 0
      case 3:
        return selectedCustomer && selectedServices.length > 0 && paymentMethod
      default:
        return false
    }
  }

  const handleCustomerSubmit = async (data: CustomerFormData) => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('고객 등록에 실패했습니다.')
      }

      const newCustomer = await response.json()
      setSelectedCustomer(newCustomer)
      setShowNewCustomerForm(false)
      showToast('고객이 등록되었습니다', 'success')
    } catch (error) {
      console.error('고객 등록 오류:', error)
      showToast('고객 등록에 실패했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalRequest = async () => {
    if (!selectedCustomer || selectedServices.length === 0) {
      showToast('고객과 서비스를 모두 선택해주세요', 'warning')
      return
    }

    const staffNote = prompt('승인 요청 사유를 입력해주세요:')
    if (!staffNote) return

    setLoading(true)
    try {
      // 각 서비스에 대해 할인 계산
      const serviceCalculations = selectedServices.map(item => {
        const calculation = calculateAdvancedDiscount({
          service: item.service,
          customer: selectedCustomer,
          packageType: item.packageType,
          quantity: item.quantity
        })

        return {
          service: item.service,
          packageType: item.packageType,
          quantity: item.quantity,
          calculation
        }
      })

      // 총 금액 계산
      const totalOriginal = serviceCalculations.reduce((sum, item) =>
        sum + item.calculation.originalPrice, 0)
      const totalDiscount = serviceCalculations.reduce((sum, item) =>
        sum + item.calculation.totalDiscount, 0)
      const totalFinal = totalOriginal - totalDiscount

      // 승인 요청 데이터 생성
      const approvalData = {
        customerId: selectedCustomer.id,
        serviceDetails: {
          services: serviceCalculations.map(item => ({
            serviceName: item.service.name,
            packageType: item.packageType,
            quantity: item.quantity
          }))
        },
        appliedDiscounts: serviceCalculations.reduce((acc, item) => {
          acc.vipDiscount += item.calculation.breakdown.vipDiscount
          acc.birthdayDiscount += item.calculation.breakdown.birthdayDiscount
          acc.employeeDiscount += item.calculation.breakdown.employeeDiscount
          acc.packageDiscount += item.calculation.breakdown.packageDiscount
          return acc
        }, { vipDiscount: 0, birthdayDiscount: 0, employeeDiscount: 0, packageDiscount: 0, addOnDiscount: 0 }),
        originalAmount: totalOriginal,
        discountAmount: totalDiscount,
        finalAmount: totalFinal,
        conflictReason: serviceCalculations.flatMap(item =>
          item.calculation.conflicts.map(c => c.description)).join('; '),
        staffNote,
        requestedBy: '직원' // 실제로는 로그인된 사용자 정보
      }

      const response = await fetch('/api/discount-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData)
      })

      if (!response.ok) {
        throw new Error('승인 요청에 실패했습니다.')
      }

      showToast('할인 승인 요청이 전송되었습니다', 'success')

      // 폼 초기화
      setSelectedCustomer(null)
      setSelectedServices([])
      setPaymentMethod('CARD')
      setNotes('')
      setStep(1)

    } catch (error) {
      console.error('승인 요청 오류:', error)
      showToast('승인 요청 중 오류가 발생했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOptimalDiscountApply = (option: OptimalDiscountOption, serviceIndex: number) => {
    setSelectedServices(prevServices => {
      const newServices = [...prevServices]
      const service = newServices[serviceIndex]

      if (!service) return prevServices

      // 최적 할인 옵션을 적용하여 가격 정보만 업데이트
      // (packageType과 quantity는 기존 값 유지)
      const updatedService = {
        ...service,
        unitPrice: option.finalPrice / service.quantity,
        totalPrice: option.finalPrice
      }

      newServices[serviceIndex] = updatedService
      return newServices
    })

    // 사용자에게 적용 완료 알림
    showToast(`최적 할인 적용! ${option.discountAmount.toLocaleString()}원 절약`, 'success')
  }

  const handleOrderSubmit = async () => {
    if (!selectedCustomer || selectedServices.length === 0) return

    try {
      setLoading(true)

      const orderData = {
        customerId: selectedCustomer.id,
        paymentMethod,
        notes: notes || null,
        couponId: selectedCouponId,
        items: selectedServices.map(item => ({
          serviceId: item.service.id,
          quantity: item.quantity,
          packageType: item.packageType,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        throw new Error('주문 처리에 실패했습니다.')
      }

      const order = await response.json()

      if (onOrderSubmit) {
        onOrderSubmit(order)
      } else {
        showToast('주문이 성공적으로 접수되었습니다', 'success')
        // 폼 초기화
        setSelectedCustomer(null)
        setSelectedServices([])
        setPaymentMethod('CARD')
        setNotes('')
        setStep(1)
      }
    } catch (error) {
      console.error('주문 처리 오류:', error)
      showToast('주문 처리 중 오류가 발생했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (showNewCustomerForm) {
    return (
      <CustomerForm
        onSubmit={handleCustomerSubmit}
        onCancel={() => setShowNewCustomerForm(false)}
        loading={loading}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 단계 표시 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step >= stepNumber
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNumber}
              </div>
              <div className="ml-2 text-sm">
                {stepNumber === 1 && '고객 선택'}
                {stepNumber === 2 && '서비스 선택'}
                {stepNumber === 3 && '주문 확인'}
              </div>
              {stepNumber < 3 && (
                <ArrowRight className="h-4 w-4 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>

        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            취소
          </Button>
        )}
      </div>

      {/* 단계별 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {step === 1 && (
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onCustomerSelect={setSelectedCustomer}
              onNewCustomer={() => setShowNewCustomerForm(true)}
            />
          )}

          {step === 2 && (
            <ServiceSelector
              selectedServices={selectedServices}
              onServiceChange={setSelectedServices}
            />
          )}

          {step === 3 && (
            <div className="space-y-6">
              {/* 주문 확인 */}
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold mb-4">주문 확인</h3>

                <div className="space-y-4">
                  {/* 쿠폰 선택 */}
                  {selectedCustomer && (
                    <CouponSelector
                      customerId={selectedCustomer.id}
                      subtotal={selectedServices.reduce((sum, item) => sum + item.totalPrice, 0)}
                      selectedCouponId={selectedCouponId}
                      onSelectCoupon={setSelectedCouponId}
                    />
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      특이사항 (선택)
                    </label>
                    <Input
                      placeholder="특별한 요청사항이나 참고사항을 입력하세요..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="h-24"
                      as="textarea"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 주문 요약 (우측 고정) */}
        <div>
          <OrderSummary
            customer={selectedCustomer}
            services={selectedServices}
            selectedCouponId={selectedCouponId}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onApprovalRequest={handleApprovalRequest}
            onOptimalDiscountApply={handleOptimalDiscountApply}
          />
        </div>
      </div>

      {/* 하단 네비게이션 - 화면 하단 고정 */}
      <div className="sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg -mx-6 px-6 py-4 mt-6">
        <div className="flex justify-between max-w-7xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            이전
          </Button>

          <div className="space-x-4">
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNext() || loading}
              >
                다음
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleOrderSubmit}
                disabled={!canProceedToNext() || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? '처리 중...' : '주문 완료'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}