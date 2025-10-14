'use client'

import { TrendingUp, Users, Award, AlertCircle } from 'lucide-react'

interface AllocationStatsProps {
  stats: {
    summary: {
      totalStaff: number
      totalAllocated: number
      totalUsed: number
      totalRemaining: number
      avgUsageRate: number
    }
    topUsers: Array<{
      userName: string
      used: number
      allocated: number
    }>
  }
}

export function AllocationStats({ stats }: AllocationStatsProps) {
  const { summary, topUsers } = stats

  return (
    <div className="space-y-6">
      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">할당 직원</p>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.totalStaff}명</p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">총 할당</p>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.totalAllocated}매</p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">사용됨</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{summary.totalUsed}매</p>
          <p className="text-xs text-gray-500 mt-1">
            평균 사용률: {summary.avgUsageRate}%
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">잔여</p>
            <AlertCircle className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{summary.totalRemaining}매</p>
        </div>
      </div>

      {/* TOP 사용자 */}
      {topUsers && topUsers.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">TOP 3 사용자</h3>
          </div>
          <div className="space-y-3">
            {topUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${index === 1 ? 'bg-gray-100 text-gray-700' : ''}
                    ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                  `}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{user.userName}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{user.used}매 사용</p>
                  <p className="text-xs text-gray-500">총 {user.allocated}매 중</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 권장 사항 */}
      {summary.avgUsageRate < 50 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">권장 사항</h4>
              <p className="text-sm text-blue-700">
                평균 사용률이 낮습니다. 직원들에게 쿠폰 사용을 독려하거나 할당량 조정을 고려해보세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {summary.totalRemaining < 10 && summary.totalStaff > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900 mb-1">잔여량 부족</h4>
              <p className="text-sm text-orange-700">
                잔여 쿠폰이 {summary.totalRemaining}매 남았습니다. 추가 할당을 고려해보세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
