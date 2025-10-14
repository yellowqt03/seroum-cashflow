import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { formatPrice, formatNumber, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  type?: 'currency' | 'number' | 'percentage' | 'text'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = '전일 대비',
  icon,
  type = 'number',
  color = 'blue'
}: StatsCardProps) {
  const formatValue = (val: number | string, valueType: string) => {
    if (typeof val === 'string') return val

    switch (valueType) {
      case 'currency':
        return formatPrice(val)
      case 'percentage':
        return `${val}%`
      case 'number':
        return formatNumber(val)
      default:
        return val.toString()
    }
  }

  const colorClasses = {
    blue: 'text-slate-900 bg-slate-50',
    green: 'text-slate-900 bg-green-50',
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    purple: 'text-slate-900 bg-purple-50'
  }

  const isPositiveChange = change !== undefined && change > 0
  const isNegativeChange = change !== undefined && change < 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatValue(value, type)}
            </p>

            {change !== undefined && (
              <div className="flex items-center mt-2">
                {isPositiveChange && (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                )}
                {isNegativeChange && (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  isPositiveChange && "text-slate-900",
                  isNegativeChange && "text-red-600",
                  change === 0 && "text-gray-600"
                )}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                <span className="text-sm text-gray-500 ml-1">{changeLabel}</span>
              </div>
            )}
          </div>

          {icon && (
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg",
              colorClasses[color]
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}