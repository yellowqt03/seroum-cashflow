'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, Check, X, User, CreditCard, Clock, MessageSquare } from 'lucide-react'

interface DiscountApprovalRequest {
  id: string
  customer: {
    id: string
    name: string
    phone: string | null
    discountType: string
  }
  originalAmount: number
  discountAmount: number
  finalAmount: number
  conflictReason: string
  staffNote: string | null
  status: string
  requestedBy: string
  requestedAt: string
  appliedDiscounts: {
    vipDiscount: number
    birthdayDiscount: number
    employeeDiscount: number
    packageDiscount: number
    addOnDiscount: number
  }
  serviceDetails: {
    serviceName: string
    packageType: string
    quantity: number
    addOns: Array<{ name: string; [key: string]: unknown }>
  }
}

interface DiscountApprovalCardProps {
  request: DiscountApprovalRequest
  onApprove: (id: string, adminNote?: string) => void
  onReject: (id: string, adminNote?: string) => void
}

export function DiscountApprovalCard({ request, onApprove, onReject }: DiscountApprovalCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">승인 대기</Badge>
      case 'APPROVED':
        return <Badge className="bg-green-50 text-green-700 border border-green-200">승인 완료</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-50 text-red-700 border border-red-200">승인 거부</Badge>
      default:
        return <Badge>알 수 없음</Badge>
    }
  }

  const getSeverityIcon = (conflictReason: string) => {
    if (conflictReason.includes('한도') || conflictReason.includes('초과')) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    }
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />
  }

  const discountBreakdown = Object.entries(request.appliedDiscounts)
    .filter(([, amount]) => amount > 0)
    .map(([type, amount]) => {
      const names = {
        vipDiscount: 'VIP 할인',
        birthdayDiscount: '생일자 할인',
        employeeDiscount: '직원 할인',
        packageDiscount: '패키지 할인',
        addOnDiscount: '추가구성 할인'
      }
      return { type: names[type as keyof typeof names] || type, amount }
    })

  return (
    <Card className="p-6 border-l-4 border-l-yellow-400">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getSeverityIcon(request.conflictReason)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              중복 할인 승인 요청
            </h3>
            <p className="text-sm text-gray-500">
              요청일: {formatDate(request.requestedAt)}
            </p>
          </div>
        </div>
        {getStatusBadge(request.status)}
      </div>

      {/* 고객 정보 */}
      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">고객 정보</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">이름:</span>
            <span className="ml-2 font-medium">{request.customer.name}</span>
          </div>
          <div>
            <span className="text-gray-500">전화번호:</span>
            <span className="ml-2">{request.customer.phone || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">할인 유형:</span>
            <span className="ml-2">
              <Badge variant="secondary" className="text-xs">
                {request.customer.discountType}
              </Badge>
            </span>
          </div>
        </div>
      </div>

      {/* 서비스 정보 */}
      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-gray-900">서비스 정보</span>
        </div>
        <div className="text-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-600">{request.serviceDetails.serviceName}</span>
            <span className="font-medium">
              {request.serviceDetails.packageType === 'single' ? '단품' :
               request.serviceDetails.packageType === 'package4' ? '4회 패키지' :
               request.serviceDetails.packageType === 'package8' ? '8회 패키지' :
               request.serviceDetails.packageType === 'package10' ? '10회 패키지' :
               request.serviceDetails.packageType}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">수량:</span>
            <span>{request.serviceDetails.quantity}개</span>
          </div>
        </div>
      </div>

      {/* 할인 내역 */}
      <div className="bg-red-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-3">할인 내역</h4>
        <div className="space-y-2 text-sm">
          {discountBreakdown.map((discount, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-gray-600">{discount.type}:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(discount.amount)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-medium">
            <span>총 할인:</span>
            <span className="text-red-600">-{formatCurrency(request.discountAmount)}</span>
          </div>
        </div>
      </div>

      {/* 금액 정보 */}
      <div className="bg-green-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500">원래 금액</div>
            <div className="font-medium text-lg">{formatCurrency(request.originalAmount)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">할인 금액</div>
            <div className="font-medium text-lg text-red-600">-{formatCurrency(request.discountAmount)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">최종 금액</div>
            <div className="font-medium text-lg text-slate-900">{formatCurrency(request.finalAmount)}</div>
          </div>
        </div>
      </div>

      {/* 중복 이유 */}
      <div className="bg-yellow-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="font-medium text-gray-900">중복 할인 사유</span>
        </div>
        <p className="text-sm text-gray-700">{request.conflictReason}</p>
      </div>

      {/* 직원 메모 */}
      {request.staffNote && (
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-gray-900">직원 메모</span>
          </div>
          <p className="text-sm text-gray-700">{request.staffNote}</p>
        </div>
      )}

      {/* 요청자 정보 */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <Clock className="h-4 w-4" />
        <span>요청자: {request.requestedBy}</span>
      </div>

      {/* 승인/거부 버튼 */}
      {request.status === 'PENDING' && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onReject(request.id)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
          >
            <X className="h-4 w-4" />
            거부
          </Button>
          <Button
            onClick={() => onApprove(request.id)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4" />
            승인
          </Button>
        </div>
      )}
    </Card>
  )
}