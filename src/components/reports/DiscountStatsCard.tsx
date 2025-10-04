'use client'

interface DiscountStats {
  vip: { count: number; totalDiscount: number; avgDiscount: number }
  birthday: { count: number; totalDiscount: number; avgDiscount: number }
  employee: { count: number; totalDiscount: number; avgDiscount: number }
  package: { count: number; totalDiscount: number; avgDiscount: number }
  regular: { count: number; totalDiscount: number; avgDiscount: number }
}

interface DiscountStatsCardProps {
  stats: DiscountStats
}

export function DiscountStatsCard({ stats }: DiscountStatsCardProps) {
  const discountTypes = [
    { key: 'vip', label: 'VIP 할인', color: 'purple', icon: '👑' },
    { key: 'birthday', label: '생일자 할인', color: 'pink', icon: '🎂' },
    { key: 'employee', label: '직원 할인', color: 'blue', icon: '👔' },
    { key: 'package', label: '패키지 할인', color: 'green', icon: '📦' },
    { key: 'regular', label: '일반 (할인 없음)', color: 'gray', icon: '💰' }
  ]

  const totalDiscountAmount = Object.values(stats).reduce((sum, s) => sum + s.totalDiscount, 0)
  const totalDiscountCount = Object.values(stats).reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">할인 유형별 통계</h3>

      {/* 전체 통계 */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600 mb-1">총 할인 금액</p>
          <p className="text-2xl font-bold text-red-600">
            {totalDiscountAmount.toLocaleString()}원
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">총 할인 건수</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalDiscountCount.toLocaleString()}건
          </p>
        </div>
      </div>

      {/* 할인 유형별 상세 */}
      <div className="space-y-4">
        {discountTypes.map(type => {
          const stat = stats[type.key as keyof DiscountStats]
          const percentage = totalDiscountAmount > 0
            ? (stat.totalDiscount / totalDiscountAmount) * 100
            : 0

          return (
            <div key={type.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{type.icon}</span>
                  <span className="font-medium text-gray-900">{type.label}</span>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-gray-900">
                    {stat.totalDiscount.toLocaleString()}원
                  </p>
                  <p className="text-gray-600">{stat.count}건</p>
                </div>
              </div>

              {/* 프로그레스 바 */}
              {stat.totalDiscount > 0 && (
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute h-full rounded-full transition-all bg-${type.color}-500`}
                    style={{
                      width: `${percentage}%`,
                      backgroundColor:
                        type.color === 'purple' ? '#8b5cf6' :
                        type.color === 'pink' ? '#ec4899' :
                        type.color === 'blue' ? '#3b82f6' :
                        type.color === 'green' ? '#10b981' :
                        '#6b7280'
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>전체 할인의 {percentage.toFixed(1)}%</span>
                {stat.count > 0 && (
                  <span>평균: {stat.avgDiscount.toLocaleString()}원/건</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 할인율 분석 */}
      {totalDiscountAmount > 0 && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">할인 집중도</span>
            <div className="text-right">
              {discountTypes.map(type => {
                const stat = stats[type.key as keyof DiscountStats]
                const pct = totalDiscountAmount > 0
                  ? (stat.totalDiscount / totalDiscountAmount) * 100
                  : 0
                if (pct < 10) return null
                return (
                  <div key={type.key} className="text-xs text-gray-600">
                    {type.label}: {pct.toFixed(0)}%
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
