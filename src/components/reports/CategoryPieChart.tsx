'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface CategoryPieChartProps {
  data: Array<{
    category: string
    total: number
    count: number
  }>
}

// 카테고리별 색상 매핑
const CATEGORY_COLORS: Record<string, string> = {
  '면역/피로회복': '#10b981',
  '혈관/순환': '#3b82f6',
  '뇌/인지': '#8b5cf6',
  '소화기/장건강': '#f59e0b',
  '미용/안티에이징': '#ec4899',
  '영양/에너지': '#14b8a6',
  '기타': '#6b7280',
}

const COLORS = [
  '#0f172a', // slate-900
  '#64748b', // slate-500
  '#94a3b8', // slate-400
  '#cbd5e1', // slate-300
  '#e2e8f0', // slate-200
  '#f1f5f9', // slate-100
]

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500 text-center">표시할 데이터가 없습니다.</p>
      </div>
    )
  }

  // 차트용 데이터 포맷팅
  const chartData = data.map((item, index) => ({
    name: item.category,
    value: item.total,
    count: item.count,
    color: CATEGORY_COLORS[item.category] || COLORS[index % COLORS.length],
  }))

  // 총합 계산
  const totalSales = data.reduce((sum, item) => sum + item.total, 0)

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / totalSales) * 100).toFixed(1)
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <p className="text-sm text-gray-700">
            매출: {data.value.toLocaleString()}원
          </p>
          <p className="text-sm text-gray-700">
            비중: {percentage}%
          </p>
          <p className="text-sm text-gray-600">
            주문: {data.count}건
          </p>
        </div>
      )
    }
    return null
  }

  // 커스텀 라벨
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // 5% 미만은 라벨 숨김

    const RADIAN = Math.PI / 180
    const radius = outerRadius + 25
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        카테고리별 매출 비중
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '14px' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-4 border-t">
        {data.slice(0, 3).map((item, index) => (
          <div key={index}>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: chartData[index].color }}
              />
              <p className="text-xs text-gray-600">{item.category}</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {item.total.toLocaleString()}원
            </p>
            <p className="text-xs text-gray-500">
              {((item.total / totalSales) * 100).toFixed(1)}% • {item.count}건
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
