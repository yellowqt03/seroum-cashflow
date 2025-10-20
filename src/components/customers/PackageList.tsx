'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/providers/ToastProvider'
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PackagePurchase {
  id: string
  service: {
    id: string
    name: string
  }
  packageType: string
  totalCount: number
  remainingCount: number
  purchasePrice: number
  purchasedAt: string
  expiresAt: string | null
  status: string
  packageUsages: Array<{
    id: string
    usedCount: number
    usedAt: string
    order: {
      id: string
      orderDate: string
      status: string
    }
  }>
}

interface PackageListProps {
  customerId: string
}

export function PackageList({ customerId }: PackageListProps) {
  const { showToast } = useToast()
  const [packages, setPackages] = useState<PackagePurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    fetchPackages()
  }, [customerId])

  const fetchPackages = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/packages?customerId=${customerId}`)
      if (res.ok) {
        const data = await res.json()
        setPackages(data.packages)
      }
    } catch (error) {
      console.error('패키지 목록 조회 오류:', error)
      showToast('패키지 목록을 불러올 수 없습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getPackageTypeName = (packageType: string) => {
    switch (packageType) {
      case 'package4': return '4회 패키지'
      case 'package8': return '8회 패키지'
      case 'package10': return '10회 패키지'
      default: return packageType
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Clock className="w-3 h-3 mr-1" />
            사용 중
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            완료
          </span>
        )
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            만료
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            <XCircle className="w-3 h-3 mr-1" />
            취소
          </span>
        )
      default:
        return null
    }
  }

  const filteredPackages = packages.filter(pkg => {
    if (filter === 'all') return true
    if (filter === 'active') return pkg.status === 'ACTIVE'
    if (filter === 'completed') return pkg.status === 'COMPLETED'
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
        >
          전체 ({packages.length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'active' ? 'primary' : 'outline'}
          onClick={() => setFilter('active')}
        >
          사용 중 ({packages.filter(p => p.status === 'ACTIVE').length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'completed' ? 'primary' : 'outline'}
          onClick={() => setFilter('completed')}
        >
          완료 ({packages.filter(p => p.status === 'COMPLETED').length})
        </Button>
      </div>

      {/* 패키지 목록 */}
      {filteredPackages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">패키지 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {pkg.service.name}
                    </h3>
                    {getStatusBadge(pkg.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {getPackageTypeName(pkg.packageType)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {pkg.remainingCount}/{pkg.totalCount}
                  </p>
                  <p className="text-xs text-gray-500">남은 횟수</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">구매일</p>
                  <p className="font-medium">
                    {new Date(pkg.purchasedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">구매 금액</p>
                  <p className="font-medium">
                    {pkg.purchasePrice.toLocaleString()}원
                  </p>
                </div>
              </div>

              {pkg.expiresAt && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-600">
                    만료일: {new Date(pkg.expiresAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              )}

              {/* 사용 내역 */}
              {pkg.packageUsages.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    사용 내역 ({pkg.packageUsages.length}회)
                  </p>
                  <div className="space-y-1">
                    {pkg.packageUsages.slice(0, 3).map((usage) => (
                      <div
                        key={usage.id}
                        className="flex items-center justify-between text-xs text-gray-600"
                      >
                        <span>
                          {new Date(usage.usedAt).toLocaleDateString('ko-KR')}
                        </span>
                        <span>{usage.usedCount}회 사용</span>
                      </div>
                    ))}
                    {pkg.packageUsages.length > 3 && (
                      <p className="text-xs text-gray-500 text-center pt-1">
                        외 {pkg.packageUsages.length - 3}건
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
