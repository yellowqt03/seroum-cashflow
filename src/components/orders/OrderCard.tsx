'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils'
import { ORDER_STATUSES, PAYMENT_METHODS, DISCOUNT_TYPES } from '@/lib/types'
import { getDiscountTypeColor } from '@/lib/discount'
import {
  Clock,
  User,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  PlayCircle,
  Package,
  ShoppingCart
} from 'lucide-react'

interface OrderItem {
  quantity: number
  service: {
    name: string
  }
  packageType: string
  totalPrice: number
}

interface OrderData {
  id: string
  status: string
  discountAmount: number
  discountRate?: number
  subtotal: number
  finalAmount: number
  customer: {
    name: string
    phone?: string
  }
  appliedDiscountType?: string
  orderItems: OrderItem[]
  paymentMethod: string
  notes?: string
  createdAt: string
}

interface OrderCardProps {
  order: OrderData
  onStatusUpdate?: (orderId: string, status: string) => void
  onViewDetails?: (order: OrderData) => void
  onUsePackage?: (orderId: string, packagePurchaseId: string) => void
}

export function OrderCard({ order, onStatusUpdate, onViewDetails, onUsePackage }: OrderCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <PlayCircle className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const canUpdateStatus = (currentStatus: string) => {
    return ['PENDING', 'IN_PROGRESS'].includes(currentStatus)
  }

  const totalItems = order.orderItems.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0)
  const discountApplied = order.discountAmount > 0

  // 패키지 구매 여부 확인 (package4, package8, package10 또는 PACKAGE_X)
  const isPackagePurchase = order.orderItems.some(item =>
    item.packageType &&
    (item.packageType.toLowerCase().startsWith('package') &&
     item.packageType !== 'single')
  )

  // 패키지 세션 정보 파싱
  let packageSession: any = null
  try {
    if (order.notes && order.notes.startsWith('{')) {
      const parsed = JSON.parse(order.notes)
      packageSession = parsed.packageSession
    }
  } catch (e) {
    // JSON 아님
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${isPackagePurchase ? 'border-l-4 border-l-blue-500' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>주문 #{order.id.slice(-8)}</span>
              </CardTitle>
              {isPackagePurchase && (
                <Badge variant="default" className="bg-blue-600">
                  <Package className="h-3 w-3 mr-1" />
                  패키지 구매
                </Badge>
              )}
              {!isPackagePurchase && (
                <Badge variant="secondary">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  일반 주문
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(order.status).includes('green') ? 'success' :
                             getStatusColor(order.status).includes('blue') ? 'default' :
                             getStatusColor(order.status).includes('yellow') ? 'warning' : 'danger'}>
                {getStatusIcon(order.status)}
                <span className="ml-1">
                  {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]}
                </span>
              </Badge>
              <div className="text-sm text-gray-600">
                {formatDate(order.createdAt, 'time')}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-bold text-slate-900">
              {formatPrice(order.finalAmount)}
            </div>
            {discountApplied && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(order.subtotal)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 고객 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium">{order.customer.name}</div>
              {order.customer.phone && (
                <div className="text-sm text-gray-600">{order.customer.phone}</div>
              )}
            </div>
          </div>

          {order.appliedDiscountType && order.appliedDiscountType !== 'REGULAR' && (
            <Badge variant={getDiscountTypeColor(order.appliedDiscountType) as 'default' | 'secondary' | 'success' | 'danger' | 'warning'} className="text-xs">
              {DISCOUNT_TYPES[order.appliedDiscountType as keyof typeof DISCOUNT_TYPES]}
            </Badge>
          )}
        </div>

        {/* 주문 항목 요약 */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-900">
            주문 내역 ({totalItems}개 항목)
          </div>
          <div className="space-y-2">
            {order.orderItems.slice(0, 2).map((item: OrderItem, index: number) => {
              const isPkg = item.packageType &&
                (item.packageType.toLowerCase().startsWith('package') &&
                 item.packageType !== 'single')

              // 패키지 횟수 추출
              let pkgCount: number | null = null
              if (isPkg) {
                if (item.packageType.includes('_')) {
                  pkgCount = parseInt(item.packageType.split('_')[1])
                } else {
                  pkgCount = parseInt(item.packageType.replace(/\D/g, ''))
                }
              }

              return (
                <div key={index} className={`flex justify-between text-sm p-2 rounded ${isPkg ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isPkg && <Package className="h-4 w-4 text-blue-600" />}
                      <span className="font-medium">{item.service.name}</span>
                    </div>
                    {isPkg && pkgCount && (
                      <div className="text-xs text-blue-700 mt-1 ml-6">
                        📦 {pkgCount}회 패키지 × {item.quantity}개 = 총 {pkgCount * item.quantity}회 제공
                      </div>
                    )}
                    {!isPkg && (
                      <div className="text-xs text-gray-600 mt-1">
                        일반 서비스 × {item.quantity}회
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-right">{formatPrice(item.totalPrice)}</span>
                </div>
              )
            })}
            {order.orderItems.length > 2 && (
              <div className="text-sm text-gray-500 text-center">
                + {order.orderItems.length - 2}개 항목 더보기
              </div>
            )}
          </div>
        </div>

        {/* 할인 정보 */}
        {discountApplied && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-green-800">
              할인 적용: {formatPrice(order.discountAmount)}
              {order.discountRate && `(${Math.round(order.discountRate * 100)}% 할인)`}
            </div>
          </div>
        )}

        {/* 결제 정보 */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CreditCard className="h-4 w-4" />
          <span>{PAYMENT_METHODS[order.paymentMethod as keyof typeof PAYMENT_METHODS]}</span>
        </div>

        {/* 패키지 세션 정보 */}
        {packageSession && order.status === 'IN_PROGRESS' && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="text-sm font-medium text-orange-900 mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              패키지 사용 중
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">서비스:</span>
                <span className="font-medium text-gray-900">{packageSession.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">이번 방문 사용:</span>
                <span className="font-medium text-blue-600">{packageSession.usedInThisSession}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">남은 횟수:</span>
                <span className="font-medium text-orange-600">{packageSession.remainingCount}/{packageSession.totalCount}회</span>
              </div>
            </div>
          </div>
        )}

        {/* 특이사항 (JSON이 아닌 경우에만 표시) */}
        {order.notes && !order.notes.startsWith('{') && (
          <div className="flex items-start space-x-2 text-sm">
            <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="text-gray-600">
              <div className="font-medium">특이사항</div>
              <div>{order.notes}</div>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(order)}
          >
            상세보기
          </Button>

          <div className="space-x-2">
            {canUpdateStatus(order.status) && (
              <>
                {order.status === 'PENDING' && (
                  <Button
                    size="sm"
                    onClick={() => onStatusUpdate?.(order.id, 'IN_PROGRESS')}
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    시작
                  </Button>
                )}
                {order.status === 'IN_PROGRESS' && (
                  <>
                    {/* 패키지 사용 버튼 (패키지 세션이 있고 남은 횟수가 있을 때만) */}
                    {packageSession && packageSession.remainingCount > 0 && onUsePackage && (
                      <Button
                        size="sm"
                        onClick={() => onUsePackage(order.id, packageSession.packagePurchaseId)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Package className="h-4 w-4 mr-1" />
                        확인 ({packageSession.remainingCount}회 남음)
                      </Button>
                    )}
                    {/* 일반 완료 버튼 (패키지가 없거나 모두 사용한 경우) */}
                    {(!packageSession || packageSession.remainingCount === 0) && (
                      <Button
                        size="sm"
                        onClick={() => onStatusUpdate?.(order.id, 'COMPLETED')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        완료
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusUpdate?.(order.id, 'CANCELLED')}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  취소
                </Button>
              </>
            )}
            {order.status === 'COMPLETED' && (
              <Badge variant="success" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                완료됨
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}