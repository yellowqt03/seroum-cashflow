'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface DiscountDonutChartProps {
  stats: {
    vipDiscount: { count: number; total: number }
    birthdayDiscount: { count: number; total: number }
    employeeDiscount: { count: number; total: number }
    packageDiscount: { count: number; total: number }
  }
}

// 할인 유형별 색상
const DISCOUNT_COLORS = {
  '패키지 할인': '#0f172a',
  '직원 할인': '#475569',
  '생일자 할인': '#64748b',
  'VIP 할인': '#94a3b8',
}

export function DiscountDonutChart({ stats }: DiscountDonutChartProps) {
  // 차트용 데이터 포맷팅
  const chartData = [
    {
      name: '패키지 할인',
      value: stats.packageDiscount.total,
      count: stats.packageDiscount.count,
      color: DISCOUNT_COLORS['패키지 할인'],
    },
    {
      name: '직원 할인',
      value: stats.employeeDiscount.total,
      count: stats.employeeDiscount.count,
      color: DISCOUNT_COLORS['직원 할인'],
    },
    {
      name: '생일자 할인',
      value: stats.birthdayDiscount.total,
      count: stats.birthdayDiscount.count,
      color: DISCOUNT_COLORS['생일자 할인'],
    },
    {
      name: 'VIP 할인',
      value: stats.vipDiscount.total,
      count: stats.vipDiscount.count,
      color: DISCOUNT_COLORS['VIP 할인'],
    },
  ].filter(item => item.value > 0) // 0원인 항목 제외

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500 text-center">할인 사용 내역이 없습니다.</p>
      </div>
    )
  }

  // 총합 계산
  const totalDiscount = chartData.reduce((sum, item) => sum + item.value, 0)
  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0)

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / totalDiscount) * 100).toFixed(1)
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <p className="text-sm text-gray-700">
            할인액: {data.value.toLocaleString()}원
          </p>
          <p className="text-sm text-gray-700">
            비중: {percentage}%
          </p>
          <p className="text-sm text-gray-600">
            사용: {data.count}건
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
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        할인 유형별 사용 현황
      </h3>

      <div className="relative">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              innerRadius={80}
              outerRadius={130}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
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

        {/* 중앙 총계 표시 */}
        <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-xs text-gray-500 mb-1">총 할인액</p>
          <p className="text-xl font-bold text-gray-900">
            {(totalDiscount / 10000).toFixed(0)}만원
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {totalCount}건
          </p>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
        {chartData.map((item, index) => (
          <div key={index}>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <p className="text-xs text-gray-600">{item.name}</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {item.value.toLocaleString()}원
            </p>
            <p className="text-xs text-gray-500">
              {((item.value / totalDiscount) * 100).toFixed(1)}% • {item.count}건
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
