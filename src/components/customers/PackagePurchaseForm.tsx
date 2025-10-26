'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/providers/ToastProvider'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { X, Package, Tag } from 'lucide-react'
import CouponSelector from '@/components/orders/CouponSelector'

interface Service {
  id: string
  name: string
  price: number
  package4Price: number | null
  package8Price: number | null
  package10Price: number | null
}

interface PackagePurchaseFormProps {
  customerId: string
  onClose: () => void
  onSuccess: () => void
}

export function PackagePurchaseForm({
  customerId,
  onClose,
  onSuccess
}: PackagePurchaseFormProps) {
  const { showToast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [formData, setFormData] = useState({
    serviceId: '',
    packageType: '',
    paymentMethod: 'CARD',
    notes: ''
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services')
      if (res.ok) {
        const data = await res.json()
        // 패키지 가격이 설정된 서비스만 필터링
        const servicesWithPackages = data.filter(
          (s: Service) => s.package4Price || s.package8Price || s.package10Price
        )
        setServices(servicesWithPackages)
      }
    } catch (error) {
      console.error('서비스 목록 조회 오류:', error)
    }
  }

  const selectedService = services.find(s => s.id === formData.serviceId)

  const getPackageOptions = () => {
    if (!selectedService) return []

    const options = []
    if (selectedService.package4Price) {
      options.push({
        value: 'package4',
        label: `4회 패키지 - ${selectedService.package4Price.toLocaleString()}원`,
        price: selectedService.package4Price
      })
    }
    if (selectedService.package8Price) {
      options.push({
        value: 'package8',
        label: `8회 패키지 - ${selectedService.package8Price.toLocaleString()}원`,
        price: selectedService.package8Price
      })
    }
    if (selectedService.package10Price) {
      options.push({
        value: 'package10',
        label: `10회 패키지 - ${selectedService.package10Price.toLocaleString()}원`,
        price: selectedService.package10Price
      })
    }
    return options
  }

  const packageOptions = getPackageOptions()
  const selectedPackage = packageOptions.find(opt => opt.value === formData.packageType)

  // 쿠폰 적용된 최종 금액 계산
  const subtotal = selectedPackage?.price || 0
  const finalAmount = Math.max(0, subtotal - couponDiscount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.serviceId || !formData.packageType) {
      showToast('서비스와 패키지를 선택해주세요.', 'warning')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          ...formData,
          couponId: selectedCouponId
        })
      })

      if (res.ok) {
        showToast('패키지가 구매되었습니다.', 'success')
        onSuccess()
        onClose()
      } else {
        const error = await res.json()
        showToast(error.error || '패키지 구매에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('패키지 구매 오류:', error)
      showToast('패키지 구매 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">패키지 구매</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 서비스 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              서비스 선택 *
            </label>
            <Select
              value={formData.serviceId}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  serviceId: e.target.value,
                  packageType: '' // 서비스 변경 시 패키지 선택 초기화
                })
              }}
              required
            >
              <option value="">서비스를 선택하세요</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </div>

          {/* 패키지 선택 */}
          {formData.serviceId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                패키지 선택 *
              </label>
              <Select
                value={formData.packageType}
                onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                required
              >
                <option value="">패키지를 선택하세요</option>
                {packageOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* 쿠폰 선택 */}
          {selectedPackage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                할인 쿠폰 (선택사항)
              </label>
              <CouponSelector
                customerId={customerId}
                subtotal={subtotal}
                selectedCouponId={selectedCouponId}
                onSelectCoupon={(couponId) => {
                  setSelectedCouponId(couponId)
                  // 쿠폰 할인 금액 계산
                  if (couponId) {
                    // 쿠폰 정보를 다시 조회하여 할인 금액 계산
                    fetch(`/api/coupons/${couponId}`)
                      .then(res => res.json())
                      .then(coupon => {
                        let discount = 0
                        if (coupon.discountType === 'PERCENT') {
                          discount = Math.floor(subtotal * coupon.discountValue)
                          if (coupon.maxDiscount) {
                            discount = Math.min(discount, coupon.maxDiscount)
                          }
                        } else {
                          discount = coupon.discountValue
                        }
                        setCouponDiscount(discount)
                      })
                      .catch(err => {
                        console.error('쿠폰 정보 조회 오류:', err)
                        setCouponDiscount(0)
                      })
                  } else {
                    setCouponDiscount(0)
                  }
                }}
              />
            </div>
          )}

          {/* 결제 정보 */}
          {selectedPackage && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">결제 정보</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>서비스</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>패키지</span>
                  <span className="font-medium">
                    {formData.packageType === 'package4' && '4회'}
                    {formData.packageType === 'package8' && '8회'}
                    {formData.packageType === 'package10' && '10회'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>패키지 금액</span>
                  <span className="font-medium">
                    {subtotal.toLocaleString()}원
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>쿠폰 할인</span>
                    <span className="font-medium">
                      -{couponDiscount.toLocaleString()}원
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="font-semibold">최종 결제 금액</span>
                  <span className="font-bold text-lg">
                    {finalAmount.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 결제 방법 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              결제 방법 *
            </label>
            <Select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              required
            >
              <option value="CARD">카드</option>
              <option value="CASH">현금</option>
              <option value="TRANSFER">계좌이체</option>
            </Select>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모
            </label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="특이사항을 입력하세요"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !formData.serviceId || !formData.packageType}
            >
              {loading ? '처리 중...' : '구매하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
