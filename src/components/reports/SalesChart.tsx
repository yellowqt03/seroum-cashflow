'use client'

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface SalesChartProps {
  data: Array<{
    period: string
    totalSales: number
    netSales: number
    totalDiscount: number
    orderCount: number
  }>
  period?: string
}

export function SalesChart({ data, period = 'month' }: SalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500 text-center">표시할 데이터가 없습니다.</p>
      </div>
    )
  }

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

  // 차트용 데이터 포맷팅 (안전성 검사 추가)
  const chartData = data.map(item => ({
    name: formatLabel(item.period || ''),
    '할인 전 매출': item.totalSales || 0,
    '순 매출': item.netSales || 0,
    '할인': item.totalDiscount || 0,
    '주문 수': item.orderCount || 0,
  }))

  // 금액 포맷팅 (천 단위 구분)
  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}천만`
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}백만`
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만`
    }
    return value.toLocaleString()
  }

  // 툴팁 커스텀
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}원
            </p>
          ))}
          {payload[0]?.payload?.['주문 수'] && (
            <p className="text-sm text-gray-600 mt-1 pt-1 border-t">
              주문: {payload[0].payload['주문 수']}건
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">기간별 매출 추이</h3>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
          />
          <Bar
            dataKey="할인 전 매출"
            fill="#cbd5e1"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="순 매출"
            fill="#0f172a"
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="순 매출"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
        <div>
          <p className="text-xs text-gray-500 mb-1">총 매출</p>
          <p className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, item) => sum + (item.totalSales || 0), 0).toLocaleString()}원
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">총 할인</p>
          <p className="text-lg font-semibold text-red-600">
            -{data.reduce((sum, item) => sum + (item.totalDiscount || 0), 0).toLocaleString()}원
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">순 매출</p>
          <p className="text-lg font-semibold text-slate-900">
            {data.reduce((sum, item) => sum + (item.netSales || 0), 0).toLocaleString()}원
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">총 주문</p>
          <p className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, item) => sum + (item.orderCount || 0), 0)}건
          </p>
        </div>
      </div>
    </div>
  )
}
