'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Ticket, Calendar, Users, TrendingUp, Edit, Trash2, UserCog } from 'lucide-react'

interface CouponCardProps {
  coupon: {
    id: string
    name: string
    discountType: string
    discountValue: number
    minAmount: number | null
    maxDiscount: number | null
    usageLimit: number | null
    usedCount: number
    validFrom: string
    validUntil: string
    isActive: boolean
    status: string
    canUse: boolean
    remainingUsage: number | null
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onToggleActive?: (id: string, isActive: boolean) => void
}

export function CouponCard({ coupon, onEdit, onDelete, onToggleActive }: CouponCardProps) {
  const router = useRouter()

  const handleManageAllocations = () => {
    router.push(`/coupons/${coupon.id}`)
  }

  const getStatusBadge = () => {
    switch (coupon.status) {
      case 'active':
        return <Badge variant="success">활성</Badge>
      case 'expired':
        return <Badge variant="default">만료</Badge>
      case 'limit_reached':
        return <Badge variant="warning">한도 도달</Badge>
      case 'inactive':
        return <Badge variant="default">비활성</Badge>
      default:
        return <Badge variant="default">알 수 없음</Badge>
    }
  }

  const getDiscountText = () => {
    if (coupon.discountType === 'PERCENT') {
      return `${Math.round(coupon.discountValue * 100)}% 할인`
    } else {
      return `${coupon.discountValue.toLocaleString()}원 할인`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const usagePercentage = coupon.usageLimit
    ? (coupon.usedCount / coupon.usageLimit) * 100
    : 0

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Ticket className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {coupon.name}
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {getDiscountText()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {getStatusBadge()}
        </div>
      </div>

      {/* 할인 조건 */}
      <div className="space-y-2 mb-4 text-sm text-gray-600">
        {coupon.minAmount && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>최소 주문 금액: {coupon.minAmount.toLocaleString()}원</span>
          </div>
        )}
        {coupon.maxDiscount && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>최대 할인 금액: {coupon.maxDiscount.toLocaleString()}원</span>
          </div>
        )}
      </div>

      {/* 유효 기간 */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pb-4 border-b">
        <Calendar className="h-4 w-4" />
        <span>
          {formatDate(coupon.validFrom)} ~ {formatDate(coupon.validUntil)}
        </span>
      </div>

      {/* 사용 현황 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-4 w-4" />
            <span>사용 현황</span>
          </div>
          <span className="font-medium text-gray-900">
            {coupon.usedCount}
            {coupon.usageLimit ? ` / ${coupon.usageLimit}회` : '회'}
          </span>
        </div>
        {coupon.usageLimit && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                usagePercentage >= 100 ? 'bg-red-500' :
                usagePercentage >= 80 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        )}
        {coupon.remainingUsage !== null && coupon.remainingUsage > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            잔여 사용 가능 횟수: {coupon.remainingUsage}회
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-2">
        <Button
          onClick={handleManageAllocations}
          variant="primary"
          size="sm"
          className="w-full"
        >
          <UserCog className="h-4 w-4 mr-2" />
          직원 할당 관리
        </Button>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              onClick={() => onEdit(coupon.id)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              수정
            </Button>
          )}
          {onToggleActive && (
            <Button
              onClick={() => onToggleActive(coupon.id, !coupon.isActive)}
              variant={coupon.isActive ? 'outline' : 'primary'}
              size="sm"
              className="flex-1"
            >
              {coupon.isActive ? '비활성화' : '활성화'}
            </Button>
          )}
          {onDelete && coupon.usedCount === 0 && (
            <Button
              onClick={() => onDelete(coupon.id)}
              variant="outline"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
