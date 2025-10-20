'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DISCOUNT_TYPES, CUSTOMER_SOURCES, Customer } from '@/lib/types'
import { X, Save, UserPlus } from 'lucide-react'

interface CustomerFormProps {
  customer?: Customer
  onSubmit: (data: CustomerFormData) => void
  onCancel: () => void
  loading?: boolean
}

export interface CustomerFormData {
  name: string
  phone?: string
  birthDate?: string
  discountType: string
  source: string
  isVip: boolean
}

export function CustomerForm({ customer, onSubmit, onCancel, loading = false }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name || '',
    phone: customer?.phone || '',
    birthDate: customer?.birthDate ? customer.birthDate.toISOString().split('T')[0] : '',
    discountType: customer?.discountType || 'REGULAR',
    source: customer?.source || 'SEARCH',
    isVip: customer?.isVip || false
  })

  const [errors, setErrors] = useState<Partial<CustomerFormData>>({})

  const validate = (): boolean => {
    const newErrors: Partial<CustomerFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = '고객명을 입력해주세요.'
    }

    if (formData.phone && !/^\d{3}-?\d{4}-?\d{4}$/.test(formData.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSubmit(formData)
  }

  const handleInputChange = (field: keyof CustomerFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.value

    setFormData(prev => ({ ...prev, [field]: value }))

    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const isEdit = !!customer

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>{isEdit ? '고객 정보 수정' : '새 고객 등록'}</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">기본 정보</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="고객명"
                name="name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={errors.name}
                required
                placeholder="홍길동"
              />

              <Input
                label="전화번호"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                error={errors.phone}
                placeholder="010-1234-5678"
              />
            </div>

            <Input
              label="생년월일"
              name="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={handleInputChange('birthDate')}
              error={errors.birthDate}
            />
          </div>

          {/* 할인 및 분류 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">할인 및 분류</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="할인 유형"
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange('discountType')}
                required
              >
                {Object.entries(DISCOUNT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>

              <Select
                label="유입 경로"
                name="source"
                value={formData.source}
                onChange={handleInputChange('source')}
                required
              >
                {Object.entries(CUSTOMER_SOURCES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            {/* VIP 고객 체크박스 */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isVip"
                name="isVip"
                checked={formData.isVip}
                onChange={handleInputChange('isVip')}
                className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-gray-300 rounded"
              />
              <label htmlFor="isVip" className="text-sm font-medium text-gray-700">
                VIP 고객
              </label>
            </div>
          </div>

          {/* 할인 안내 */}
          {formData.discountType === 'EMPLOYEE' && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-slate-900 mb-2">할인 혜택 안내</h4>
              <div className="text-sm text-slate-900">
                <p>• 모든 서비스 50% 할인</p>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex space-x-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? '저장 중...' : (isEdit ? '수정하기' : '등록하기')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}