'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useToast } from '@/components/providers/ToastProvider'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { PackageList } from '@/components/customers/PackageList'
import { PackagePurchaseForm } from '@/components/customers/PackagePurchaseForm'
import { OrderHistory } from '@/components/customers/OrderHistory'
import { CustomerStatistics } from '@/components/customers/CustomerStatistics'
import {
  User,
  Phone,
  Calendar,
  Tag,
  Users,
  Package,
  ShoppingCart,
  TrendingUp
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string | null
  birthDate: string | null
  discountType: string
  source: string
  isVip: boolean
  createdAt: string
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string
  const { showToast } = useToast()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'packages' | 'orders'>('packages')

  useEffect(() => {
    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/customers/${customerId}`)
      if (res.ok) {
        const data = await res.json()
        setCustomer(data)
      } else {
        showToast('고객 정보를 불러올 수 없습니다.', 'error')
        router.push('/customers')
      }
    } catch (error) {
      console.error('고객 조회 오류:', error)
      showToast('고객 정보를 불러오는 중 오류가 발생했습니다.', 'error')
      router.push('/customers')
    } finally {
      setLoading(false)
    }
  }

  const getDiscountTypeName = (type: string) => {
    switch (type) {
      case 'VIP': return 'VIP 고객'
      case 'BIRTHDAY': return '생일자'
      case 'EMPLOYEE': return '직원'
      case 'REGULAR': return '일반 고객'
      default: return type
    }
  }

  const getSourceName = (source: string) => {
    switch (source) {
      case 'SEARCH': return '검색'
      case 'STAFF': return '직원 소개'
      case 'AD': return '광고'
      case 'EVENT': return '이벤트'
      case 'ENDOSCOPY': return '내시경센터'
      case 'CLINIC': return '내과'
      case 'REFERRAL': return '지인 추천'
      default: return source
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">고객 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <BackButton label="고객 목록" fallbackHref="/customers" />
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {customer.name}
                </h1>
                <p className="text-sm text-gray-600">고객 상세 정보</p>
              </div>
            </div>
            {activeTab === 'packages' && (
              <Button
                onClick={() => setShowPurchaseForm(true)}
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                패키지 구매
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 고객 정보 카드 */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">고객명</p>
                <p className="font-semibold text-gray-900">{customer.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">연락처</p>
                <p className="font-semibold text-gray-900">
                  {customer.phone || '미등록'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">생년월일</p>
                <p className="font-semibold text-gray-900">
                  {customer.birthDate
                    ? new Date(customer.birthDate).toLocaleDateString('ko-KR')
                    : '미등록'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Tag className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">할인 유형</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">
                    {getDiscountTypeName(customer.discountType)}
                  </p>
                  {customer.isVip && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      VIP
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">유입 경로</p>
                <p className="font-semibold text-gray-900">
                  {getSourceName(customer.source)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                <Calendar className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">등록일</p>
                <p className="font-semibold text-gray-900">
                  {new Date(customer.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="border-b mb-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('packages')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'packages'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                패키지 관리
              </div>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                주문 내역
              </div>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                통계
              </div>
            </button>
          </nav>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'packages' && (
          <PackageList customerId={customerId} />
        )}

        {activeTab === 'orders' && (
          <OrderHistory customerId={customerId} />
        )}

        {activeTab === 'info' && (
          <CustomerStatistics customerId={customerId} />
        )}
      </main>

      {/* 패키지 구매 폼 */}
      {showPurchaseForm && (
        <PackagePurchaseForm
          customerId={customerId}
          onClose={() => setShowPurchaseForm(false)}
          onSuccess={() => {
            // 패키지 목록 새로고침을 위해 페이지 리로드
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
