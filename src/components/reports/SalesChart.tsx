'use client'

interface SalesChartProps {
  data: Array<{
    period: string
    totalSales: number
    netSales: number
    totalDiscount: number
    orderCount: number
  }>
  period: string
}

export function SalesChart({ data, period }: SalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500 text-center">표시할 데이터가 없습니다.</p>
      </div>
    )
  }

  // 최대값 계산 (차트 스케일링용)
  const maxSales = Math.max(...data.map(d => d.totalSales))
  const maxOrders = Math.max(...data.map(d => d.orderCount))

  // 기간별 라벨 포맷
  const formatLabel = (period: string) => {
    if (period.includes('-')) {
      const parts = period.split('-')
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}` // MM/DD
      } else if (parts.length === 2) {
        return `${parts[0]}/${parts[1]}` // YYYY/MM
      }
    }
    return period
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">기간별 매출 추이</h3>

      {/* 간단한 바 차트 */}
      <div className="space-y-4">
        {data.map((item, index) => {
          const salesBarWidth = maxSales > 0 ? (item.netSales / maxSales) * 100 : 0
          const discountBarWidth = maxSales > 0 ? (item.totalDiscount / maxSales) * 100 : 0

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 min-w-[100px]">
                  {formatLabel(item.period)}
                </span>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>매출: {item.netSales.toLocaleString()}원</span>
                  <span>주문: {item.orderCount}건</span>
                </div>
              </div>

              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                {/* 할인 전 매출 (연한 배경) */}
                <div
                  className="absolute h-full bg-blue-200 rounded-lg transition-all"
                  style={{ width: `${(item.totalSales / maxSales) * 100}%` }}
                />
                {/* 실제 매출 (진한 색) */}
                <div
                  className="absolute h-full bg-blue-600 rounded-lg transition-all"
                  style={{ width: `${salesBarWidth}%` }}
                />
                {/* 값 표시 */}
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-medium text-white">
                    {item.netSales.toLocaleString()}원
                  </span>
                </div>
              </div>

              {item.totalDiscount > 0 && (
                <div className="text-xs text-red-600 pl-[100px]">
                  할인: -{item.totalDiscount.toLocaleString()}원
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-6 mt-6 pt-4 border-t text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 rounded"></div>
          <span className="text-gray-600">할인 전 매출</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span className="text-gray-600">순 매출</span>
        </div>
      </div>
    </div>
  )
}
