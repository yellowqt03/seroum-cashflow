'use client'

import { useEffect, useState } from 'react'
import { X, Package, User, Calendar, CreditCard, Receipt, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { ORDER_STATUSES, PAYMENT_METHODS, DISCOUNT_TYPES } from '@/lib/types'

interface OrderDetailModalProps {
  orderId: string
  onClose: () => void
}

interface PackageChange {
  serviceId: string
  serviceName: string
  packageType: string
  change: number // 양수: 추가, 음수: 차감
  totalCount: number
  remainingBefore: number | null
  remainingAfter: number | null
}

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const [order, setOrder] = useState<any>(null)
  const [packageChanges, setPackageChanges] = useState<PackageChange[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderDetail()
  }, [orderId])

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)

        // 패키지 변경 정보 계산
        if (data.status === 'COMPLETED') {
          const changes = await calculatePackageChanges(data)
          setPackageChanges(changes)
        }
      }
    } catch (error) {
      console.error('주문 상세 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePackageChanges = async (orderData: any): Promise<PackageChange[]> => {
    const changes: PackageChange[] = []

    for (const item of orderData.orderItems) {
      // 패키지 구매인지 확인 (package4, package8, package10 또는 PACKAGE_5, PACKAGE_10 등)
      const isPackagePurchase = item.packageType &&
        (item.packageType.toLowerCase().startsWith('package') &&
         item.packageType !== 'single')

      if (isPackagePurchase) {
        // 패키지 구매 - 횟수 추출
        let pkgCount = 0
        if (item.packageType.includes('_')) {
          // PACKAGE_10 형식
          pkgCount = parseInt(item.packageType.split('_')[1])
        } else {
          // package4, package8 형식
          pkgCount = parseInt(item.packageType.replace(/\D/g, ''))
        }

        changes.push({
          serviceId: item.serviceId,
          serviceName: item.service.name,
          packageType: item.packageType,
          change: pkgCount * item.quantity,
          totalCount: pkgCount * item.quantity,
          remainingBefore: null,
          remainingAfter: pkgCount * item.quantity
        })
      } else {
        // 패키지 사용 (차감)
        // 실제 패키지 사용 정보 조회
        try {
          const pkgResponse = await fetch(`/api/packages?customerId=${orderData.customerId}&serviceId=${item.serviceId}`)
          if (pkgResponse.ok) {
            const pkgData = await pkgResponse.json()
            const activePackages = pkgData.packages.filter((p: any) => p.status === 'ACTIVE')

            if (activePackages.length > 0) {
              const pkg = activePackages[0]
              changes.push({
                serviceId: item.serviceId,
                serviceName: item.service.name,
                packageType: pkg.packageType,
                change: -item.quantity,
                totalCount: pkg.totalCount,
                remainingBefore: pkg.remainingCount + item.quantity, // 사용 전 횟수
                remainingAfter: pkg.remainingCount
              })
            }
          }
        } catch (error) {
          console.error('패키지 정보 조회 오류:', error)
        }
      }
    }

    return changes
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  const isPackagePurchase = order.orderItems.some((item: any) =>
    item.packageType &&
    (item.packageType.toLowerCase().startsWith('package') &&
     item.packageType !== 'single')
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">주문 상세 정보</h2>
            <p className="text-sm text-gray-600 mt-1">주문 #{order.id.slice(-8)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 주문 유형 및 상태 */}
          <div className="flex items-center gap-3">
            {isPackagePurchase ? (
              <Badge variant="default" className="bg-blue-600 text-white">
                <Package className="h-4 w-4 mr-1" />
                패키지 구매
              </Badge>
            ) : (
              <Badge variant="secondary">
                일반 주문
              </Badge>
            )}
            <Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'}>
              {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]}
            </Badge>
            <span className="text-sm text-gray-600">{formatDate(order.createdAt, 'full')}</span>
          </div>

          {/* 고객 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">고객 정보</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">이름:</span>
                <span className="ml-2 font-medium">{order.customer.name}</span>
              </div>
              <div>
                <span className="text-gray-600">연락처:</span>
                <span className="ml-2 font-medium">{order.customer.phone || '미등록'}</span>
              </div>
              {order.appliedDiscountType && (
                <div className="col-span-2">
                  <span className="text-gray-600">할인 유형:</span>
                  <Badge variant="secondary" className="ml-2">
                    {DISCOUNT_TYPES[order.appliedDiscountType as keyof typeof DISCOUNT_TYPES]}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* 주문 항목 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              주문 항목
            </h3>
            <div className="space-y-3">
              {order.orderItems.map((item: any, index: number) => {
                const isPkg = item.packageType && item.packageType.startsWith('PACKAGE_')
                const pkgCount = isPkg ? item.packageType.split('_')[1] : null

                return (
                  <div key={index} className={`p-4 rounded-lg border ${isPkg ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {isPkg && <Package className="h-5 w-5 text-blue-600" />}
                          <span className="font-semibold text-gray-900">{item.service.name}</span>
                        </div>
                        {isPkg ? (
                          <div className="text-sm space-y-1">
                            <div className="text-blue-700">
                              📦 {pkgCount}회 패키지 × {item.quantity}개
                            </div>
                            <div className="text-blue-600 font-medium">
                              = 총 {parseInt(pkgCount || '0') * item.quantity}회 제공
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            일반 서비스 × {item.quantity}회
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg text-gray-900">
                          {formatPrice(item.totalPrice)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatPrice(item.unitPrice)}/개
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 패키지 변경 정보 */}
          {packageChanges.length > 0 && order.status === 'COMPLETED' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">패키지 횟수 변경</h3>
              </div>
              <div className="space-y-2">
                {packageChanges.map((change, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-blue-200">
                    <div className="font-medium text-gray-900 mb-1">{change.serviceName}</div>
                    {change.change > 0 ? (
                      <div className="text-sm text-green-700 font-medium">
                        ✅ +{change.change}회 추가 (총 {change.totalCount}회)
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div className="text-orange-700 font-medium">
                          ⚠️ {Math.abs(change.change)}회 사용
                        </div>
                        <div className="text-gray-600 mt-1">
                          {change.remainingBefore}회 → {change.remainingAfter}회 (남은 횟수)
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 결제 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">결제 정보</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">소계:</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>할인:</span>
                  <span className="font-medium">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="font-semibold text-gray-900">최종 금액:</span>
                <span className="font-bold text-xl text-blue-600">{formatPrice(order.finalAmount)}</span>
              </div>
              <div className="pt-2">
                <span className="text-gray-600">결제 방법:</span>
                <span className="ml-2 font-medium">{PAYMENT_METHODS[order.paymentMethod as keyof typeof PAYMENT_METHODS]}</span>
              </div>
            </div>
          </div>

          {/* 특이사항 */}
          {order.notes && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">특이사항</div>
              <div className="text-sm text-gray-700">{order.notes}</div>
            </div>
          )}

          {/* 일자 정보 */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>생성일:</span>
              </div>
              <div className="ml-6 font-medium">{formatDate(order.createdAt, 'full')}</div>
            </div>
            {order.completedAt && (
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>완료일:</span>
                </div>
                <div className="ml-6 font-medium">{formatDate(order.completedAt, 'full')}</div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end">
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  )
}
