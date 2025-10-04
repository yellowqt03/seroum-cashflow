'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { DiscountApprovalCard } from '@/components/approvals/DiscountApprovalCard'
import { Shield, AlertTriangle, CheckCircle, XCircle, Filter } from 'lucide-react'

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
    addOns: any[]
  }
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<DiscountApprovalRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<DiscountApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredRequests(requests)
    } else {
      setFilteredRequests(requests.filter(req => req.status === filterStatus))
    }
  }, [requests, filterStatus])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/discount-approvals')
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      } else {
        console.error('승인 요청 조회 실패')
      }
    } catch (error) {
      console.error('승인 요청 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string, adminNote?: string) => {
    try {
      const response = await fetch(`/api/discount-approvals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
          approvedBy: '관리자', // 실제로는 로그인된 사용자 정보
          adminNote: adminNote || '승인됨'
        })
      })

      if (response.ok) {
        await fetchRequests()
        alert('할인이 승인되었습니다.')
      } else {
        alert('승인 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('승인 처리 오류:', error)
      alert('승인 처리 중 오류가 발생했습니다.')
    }
  }

  const handleReject = async (id: string, adminNote?: string) => {
    const reason = prompt('거부 사유를 입력해주세요:')
    if (!reason) return

    try {
      const response = await fetch(`/api/discount-approvals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          approvedBy: '관리자', // 실제로는 로그인된 사용자 정보
          adminNote: reason
        })
      })

      if (response.ok) {
        await fetchRequests()
        alert('할인이 거부되었습니다.')
      } else {
        alert('거부 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('거부 처리 오류:', error)
      alert('거부 처리 중 오류가 발생했습니다.')
    }
  }

  const getStats = () => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'PENDING').length,
      approved: requests.filter(r => r.status === 'APPROVED').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length
    }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">승인 요청을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">할인 승인 관리</h1>
            <p className="text-gray-600 mt-1">중복 할인 요청을 검토하고 승인/거부합니다</p>
          </div>
        </div>
        <Button onClick={fetchRequests} variant="outline">
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 요청</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">승인 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">승인 완료</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">승인 거부</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">상태 필터:</span>
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-40"
          >
            <option value="all">전체</option>
            <option value="PENDING">승인 대기</option>
            <option value="APPROVED">승인 완료</option>
            <option value="REJECTED">승인 거부</option>
          </Select>
        </div>
        <div className="text-sm text-gray-500">
          총 {filteredRequests.length}개의 요청
        </div>
      </div>

      {/* 승인 요청 목록 */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">📋</div>
          <p className="text-gray-500">
            {filterStatus === 'all'
              ? '승인 요청이 없습니다.'
              : '해당 상태의 승인 요청이 없습니다.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map((request) => (
            <DiscountApprovalCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  )
}