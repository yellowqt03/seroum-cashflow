'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Customer, DISCOUNT_TYPES } from '@/lib/types'
import { getDiscountTypeColor } from '@/lib/discount'
import { formatPhoneNumber, isBirthdayMonth } from '@/lib/utils'
import { Search, UserPlus, Crown, Gift, Briefcase, User } from 'lucide-react'

interface CustomerSelectorProps {
  selectedCustomer: Customer | null
  onCustomerSelect: (customer: Customer) => void
  onNewCustomer: () => void
}

export function CustomerSelector({ selectedCustomer, onCustomerSelect, onNewCustomer }: CustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchCustomers()
    } else {
      setCustomers([])
      setShowSuggestions(false)
    }
  }, [searchTerm])

  const searchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.slice(0, 5)) // 최대 5개만 표시
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('고객 검색 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer)
    setSearchTerm('')
    setShowSuggestions(false)
  }

  const getCustomerIcon = (customer: Customer) => {
    if (customer.isVip) return <Crown className="h-4 w-4 text-yellow-500" />
    if (customer.discountType === 'BIRTHDAY' && customer.birthDate && isBirthdayMonth(customer.birthDate)) {
      return <Gift className="h-4 w-4 text-pink-500" />
    }
    if (customer.discountType === 'EMPLOYEE') return <Briefcase className="h-4 w-4 text-blue-500" />
    return <User className="h-4 w-4 text-gray-500" />
  }

  if (selectedCustomer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              선택된 고객
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCustomerSelect(null as any)}
            >
              변경
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {getCustomerIcon(selectedCustomer)}
              <div>
                <div className="font-semibold text-lg">{selectedCustomer.name}</div>
                {selectedCustomer.phone && (
                  <div className="text-sm text-gray-600">
                    {formatPhoneNumber(selectedCustomer.phone)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant={getDiscountTypeColor(selectedCustomer.discountType) as any}>
                {DISCOUNT_TYPES[selectedCustomer.discountType as keyof typeof DISCOUNT_TYPES]}
              </Badge>
              {selectedCustomer.isVip && (
                <Badge className="bg-yellow-100 text-yellow-800">VIP</Badge>
              )}
            </div>

            {/* 할인 안내 */}
            {selectedCustomer.discountType !== 'REGULAR' && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                {selectedCustomer.discountType === 'VIP' && (
                  <p className="text-blue-700">🎉 VIP 전용 서비스 무료 이용 가능</p>
                )}
                {selectedCustomer.discountType === 'BIRTHDAY' && (
                  <div className="text-blue-700">
                    <p>🎂 생일자 할인 50% (프리미엄회복, 프리미엄면역)</p>
                    <p className="text-xs mt-1">
                      올해 사용: {selectedCustomer.birthdayUsedCount}/8회
                    </p>
                  </div>
                )}
                {selectedCustomer.discountType === 'EMPLOYEE' && (
                  <p className="text-blue-700">👔 모든 서비스 50% 직원 할인</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          고객 선택
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="고객명 또는 전화번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* 검색 결과 */}
          {showSuggestions && customers.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    {getCustomerIcon(customer)}
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-600">
                          {formatPhoneNumber(customer.phone)}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={getDiscountTypeColor(customer.discountType) as any} className="text-xs">
                    {DISCOUNT_TYPES[customer.discountType as keyof typeof DISCOUNT_TYPES]}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* 검색 결과가 없을 때 */}
          {showSuggestions && customers.length === 0 && !loading && (
            <div className="text-center py-4 text-gray-500 text-sm">
              검색 결과가 없습니다.
            </div>
          )}

          {/* 새 고객 등록 버튼 */}
          <div className="pt-2">
            <Button variant="outline" onClick={onNewCustomer} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              새 고객 등록
            </Button>
          </div>

          {/* 검색 안내 */}
          {searchTerm.length < 2 && searchTerm.length > 0 && (
            <div className="text-sm text-gray-500 text-center">
              최소 2글자 이상 입력해주세요.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}