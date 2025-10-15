'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, formatPhoneNumber, isBirthdayMonth } from '@/lib/utils'
import { DISCOUNT_TYPES, CUSTOMER_SOURCES, Customer } from '@/lib/types'
import { getDiscountTypeColor } from '@/lib/discount'
import { Edit, Phone, Calendar, MapPin, Gift, Crown, Trash2 } from 'lucide-react'

interface CustomerCardProps {
  customer: Customer
  onEdit?: (customer: Customer) => void
  onDelete?: (customer: Customer) => void
  onSelect?: (customer: Customer) => void
  isSelected?: boolean
}

export function CustomerCard({ customer, onEdit, onDelete, onSelect, isSelected = false }: CustomerCardProps) {
  const discountTypeName = DISCOUNT_TYPES[customer.discountType as keyof typeof DISCOUNT_TYPES] || customer.discountType
  const sourceName = CUSTOMER_SOURCES[customer.source as keyof typeof CUSTOMER_SOURCES] || customer.source

  const isBirthdayCustomer = customer.birthDate && isBirthdayMonth(customer.birthDate)
  const currentYear = new Date().getFullYear()

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
      } ${isBirthdayCustomer ? 'bg-pink-50' : ''}`}
      onClick={() => onSelect?.(customer)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CardTitle className="text-lg">{customer.name}</CardTitle>
              {customer.isVip && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
              {isBirthdayCustomer && (
                <Gift className="h-4 w-4 text-pink-500" />
              )}
            </div>
            <Badge variant={getDiscountTypeColor(customer.discountType) as 'default' | 'secondary' | 'success' | 'danger' | 'warning'}>
              {discountTypeName}
            </Badge>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(customer)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`"${customer.name}" 고객을 삭제하시겠습니까?`)) {
                      onDelete(customer)
                    }
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 연락처 정보 */}
        {customer.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{formatPhoneNumber(customer.phone)}</span>
          </div>
        )}

        {/* 생년월일 */}
        {customer.birthDate && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(customer.birthDate)}</span>
            {isBirthdayCustomer && (
              <Badge variant="secondary" className="text-xs">
                생일월
              </Badge>
            )}
          </div>
        )}

        {/* 유입 경로 */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{sourceName}</span>
        </div>

        {/* 생일자 할인 사용 현황 */}
        {customer.discountType === 'BIRTHDAY' && (
          <div className="bg-pink-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-pink-800 mb-1">
              생일자 할인 현황 ({currentYear}년)
            </div>
            <div className="text-sm text-pink-600">
              사용: {customer.birthdayUsedCount}회 / 8회
              {customer.birthdayUsedCount >= 8 && (
                <Badge variant="danger" className="ml-2 text-xs">
                  한도 초과
                </Badge>
              )}
            </div>
            {customer.birthdayUsedCount < 8 && (
              <div className="text-xs text-pink-500 mt-1">
                남은 횟수: {8 - customer.birthdayUsedCount}회
              </div>
            )}
          </div>
        )}

        {/* VIP 고객 표시 */}
        {customer.isVip && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-yellow-800 flex items-center">
              <Crown className="h-4 w-4 mr-1" />
              VIP 고객
            </div>
            <div className="text-xs text-yellow-600">
              VIP 전용 서비스 무료 이용 가능
            </div>
          </div>
        )}

        {/* 등록일 */}
        <div className="text-xs text-gray-500">
          등록일: {formatDate(customer.createdAt)}
        </div>
      </CardContent>
    </Card>
  )
}