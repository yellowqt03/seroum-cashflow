'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ServiceRankingChartProps {
  data: Array<{
    serviceName: string
    totalQuantity: number
    totalSales: number
  }>
  limit?: number
}

export function ServiceRankingChart({ data, limit = 10 }: ServiceRankingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500 text-center">표시할 데이터가 없습니다.</p>
      </div>
    )
  }

  // TOP N 개만 표시
  const topServices = data.slice(0, limit)

  // 차트용 데이터 포맷팅 (안전성 검사 추가)
  const chartData = topServices.map((item, index) => ({
    name: item.serviceName && item.serviceName.length > 15
      ? item.serviceName.substring(0, 15) + '...'
      : (item.serviceName || 'Unknown'),
    fullName: item.serviceName || 'Unknown',
    count: item.totalQuantity || 0,
    revenue: item.totalSales || 0,
    rank: index + 1,
  }))

  // 색상 그라데이션 (순위별)
  const getBarColor = (index: number) => {
    const colors = [
      '#0f172a', // 1위 - slate-900
      '#1e293b', // 2위
      '#334155', // 3위
      '#475569', // 4-5위
      '#475569',
      '#64748b', // 6-10위
      '#64748b',
      '#64748b',
      '#64748b',
      '#64748b',
    ]
    return colors[index] || '#94a3b8'
  }

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-gray-900 mb-2">
            {data.rank || 0}위. {data.fullName || 'Unknown'}
          </p>
          <p className="text-sm text-gray-700">
            판매: {data.count || 0}건
          </p>
          <p className="text-sm text-gray-700">
            매출: {(data.revenue || 0).toLocaleString()}원
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        인기 서비스 TOP {limit}
      </h3>

      <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 50)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            width={90}
          />
          <Tooltip
            content={<CustomTooltip />}
            animationDuration={0}
            isAnimationActive={false}
            cursor={false}
          />
          <Bar
            dataKey="count"
            fill="#0f172a"
            radius={[0, 4, 4, 0]}
            label={{
              position: 'right',
              formatter: (value: any) => `${value}건`,
              style: { fontSize: '12px', fill: '#64748b' }
            }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* TOP 3 강조 표시 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t">
        {topServices.slice(0, 3).map((item, index) => (
          <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl font-bold" style={{ color: getBarColor(index) }}>
                {index + 1}
              </span>
              <span className="text-xs text-gray-500">위</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {item.serviceName || 'Unknown'}
            </p>
            <p className="text-xs text-gray-600">
              {item.totalQuantity || 0}건 • {(item.totalSales || 0).toLocaleString()}원
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
