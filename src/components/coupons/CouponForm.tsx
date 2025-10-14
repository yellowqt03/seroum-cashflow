'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { X } from 'lucide-react'

interface CouponFormProps {
  coupon?: {
    id: string
    name: string
    discountType: string
    discountValue: number
    minAmount: number | null
    maxDiscount: number | null
    usageLimit: number | null
    validFrom: string
    validUntil: string
    isActive: boolean
  }
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export function CouponForm({ coupon, onSubmit, onCancel }: CouponFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    discountType: 'PERCENT',
    discountValue: '',
    minAmount: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (coupon) {
      setFormData({
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountType === 'PERCENT'
          ? String(coupon.discountValue * 100)
          : String(coupon.discountValue),
        minAmount: coupon.minAmount ? String(coupon.minAmount) : '',
        maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
        usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
        validFrom: coupon.validFrom.split('T')[0],
        validUntil: coupon.validUntil.split('T')[0],
        isActive: coupon.isActive
      })
    }
  }, [coupon])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 유효성 검증
      if (!formData.name.trim()) {
        throw new Error('쿠폰명을 입력해주세요.')
      }

      if (!formData.discountValue || Number(formData.discountValue) <= 0) {
        throw new Error('할인값을 올바르게 입력해주세요.')
      }

      if (!formData.validFrom || !formData.validUntil) {
        throw new Error('유효 기간을 입력해주세요.')
      }

      if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
        throw new Error('종료일은 시작일보다 이후여야 합니다.')
      }

      // 할인값 변환 (퍼센트는 0~1 사이 값으로 변환)
      let discountValue = Number(formData.discountValue)
      if (formData.discountType === 'PERCENT') {
        if (discountValue <= 0 || discountValue > 100) {
          throw new Error('퍼센트 할인은 0과 100 사이의 값이어야 합니다.')
        }
        discountValue = discountValue / 100
      }

      const submitData = {
        name: formData.name.trim(),
        discountType: formData.discountType,
        discountValue: discountValue,
        minAmount: formData.minAmount ? Number(formData.minAmount) : null,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        isActive: formData.isActive
      }

      await onSubmit(submitData)
    } catch (err: any) {
      setError(err.message || '쿠폰 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {coupon ? '쿠폰 수정' : '쿠폰 생성'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 쿠폰명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              쿠폰명 <span className="text-red-500">*</span>
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="예: 신규 고객 환영 쿠폰"
              required
            />
          </div>

          {/* 할인 타입 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              할인 타입 <span className="text-red-500">*</span>
            </label>
            <Select
              name="discountType"
              value={formData.discountType}
              onChange={handleChange}
              required
            >
              <option value="PERCENT">퍼센트 할인 (%)</option>
              <option value="AMOUNT">금액 할인 (원)</option>
            </Select>
          </div>

          {/* 할인값 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              할인값 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
                placeholder={formData.discountType === 'PERCENT' ? '10 (10%)' : '10000'}
                required
                min="0"
                step={formData.discountType === 'PERCENT' ? '1' : '1000'}
              />
              <span className="text-gray-600 min-w-[60px]">
                {formData.discountType === 'PERCENT' ? '%' : '원'}
              </span>
            </div>
            {formData.discountType === 'PERCENT' && (
              <p className="text-xs text-gray-500 mt-1">
                0~100 사이의 숫자를 입력해주세요.
              </p>
            )}
          </div>

          {/* 최소 주문 금액 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              최소 주문 금액 (선택)
            </label>
            <Input
              type="number"
              name="minAmount"
              value={formData.minAmount}
              onChange={handleChange}
              placeholder="예: 50000"
              min="0"
              step="1000"
            />
            <p className="text-xs text-gray-500 mt-1">
              미입력 시 제한 없음
            </p>
          </div>

          {/* 최대 할인 금액 */}
          {formData.discountType === 'PERCENT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 할인 금액 (선택)
              </label>
              <Input
                type="number"
                name="maxDiscount"
                value={formData.maxDiscount}
                onChange={handleChange}
                placeholder="예: 30000"
                min="0"
                step="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                퍼센트 할인 시 최대 할인 금액 제한
              </p>
            </div>
          )}

          {/* 사용 횟수 제한 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사용 횟수 제한 (선택)
            </label>
            <Input
              type="number"
              name="usageLimit"
              value={formData.usageLimit}
              onChange={handleChange}
              placeholder="예: 100"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              미입력 시 무제한
            </p>
          </div>

          {/* 유효 기간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일 <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* 활성 상태 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-slate-900 border-gray-300 rounded focus:ring-slate-900"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              쿠폰 활성화
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? '저장 중...' : coupon ? '수정' : '생성'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
