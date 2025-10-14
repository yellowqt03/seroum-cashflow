'use client'

import { User, TrendingUp, RefreshCw, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Allocation {
  id: string
  allocatedAmount: number
  usedAmount: number
  remainingAmount: number
  usageRate: number
  autoRefresh: boolean
  refreshPeriod: string | null
  note: string | null
  user: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

interface AllocationCardProps {
  allocation: Allocation
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onReset: (id: string) => void
  onQuickAdjust: (id: string, amount: number) => void
}

export function AllocationCard({
  allocation,
  onEdit,
  onDelete,
  onReset,
  onQuickAdjust
}: AllocationCardProps) {
  const getUsageColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600 bg-red-100'
    if (rate >= 70) return 'text-orange-600 bg-orange-100'
    if (rate >= 50) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500'
    if (rate >= 70) return 'bg-orange-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* 직원 정보 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{allocation.user.name}</h3>
            <p className="text-sm text-gray-500">{allocation.user.email}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getUsageColor(allocation.usageRate)}`}>
          {Math.round(allocation.usageRate)}%
        </div>
      </div>

      {/* 할당 현황 */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">할당량</span>
          <span className="font-semibold text-gray-900">{allocation.allocatedAmount}매</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">사용</span>
          <span className="font-semibold text-blue-600">{allocation.usedAmount}매</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">잔여</span>
          <span className="font-semibold text-green-600">{allocation.remainingAmount}매</span>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${getProgressColor(allocation.usageRate)}`}
            style={{ width: `${Math.min(allocation.usageRate, 100)}%` }}
          />
        </div>
      </div>

      {/* 자동 갱신 정보 */}
      {allocation.autoRefresh && (
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-4 bg-blue-50 p-2 rounded">
          <RefreshCw className="h-3 w-3" />
          <span>자동 갱신: {allocation.refreshPeriod === 'MONTHLY' ? '매월' : allocation.refreshPeriod === 'WEEKLY' ? '매주' : '수동'}</span>
        </div>
      )}

      {/* 메모 */}
      {allocation.note && (
        <div className="text-xs text-gray-600 mb-4 p-2 bg-gray-50 rounded">
          {allocation.note}
        </div>
      )}

      {/* 빠른 조정 버튼 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onQuickAdjust(allocation.id, 5)}
          className="text-xs"
        >
          +5
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onQuickAdjust(allocation.id, 10)}
          className="text-xs"
        >
          +10
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReset(allocation.id)}
          className="text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          리셋
        </Button>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(allocation.id)}
          className="flex-1"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          수정
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(allocation.id)}
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
