'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPrice, formatDuration } from '@/lib/utils'
import { SERVICE_CATEGORIES, Service } from '@/lib/types'
import { Edit, Clock, DollarSign, Package } from 'lucide-react'

interface ServiceCardProps {
  service: Service
  onEdit?: (service: Service) => void
  onSelect?: (service: Service) => void
  isSelected?: boolean
}

export function ServiceCard({ service, onEdit, onSelect, isSelected = false }: ServiceCardProps) {
  const categoryName = SERVICE_CATEGORIES[service.category as keyof typeof SERVICE_CATEGORIES] || service.category

  const getCategoryColor = (category: string) => {
    const colors = {
      'IMMUNE_RECOVERY': 'success',
      'CIRCULATION': 'danger',
      'BRAIN_COGNITIVE': 'default',
      'DIGESTIVE': 'warning',
      'BEAUTY_ANTI_AGING': 'secondary',
      'NUTRITION_ENERGY': 'success',
      'OTHER': 'secondary'
    } as const
    return colors[category as keyof typeof colors] || 'secondary'
  }

  const hasPackages = service.package4Price || service.package8Price || service.package10Price

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
      }`}
      onClick={() => onSelect?.(service)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{service.name}</CardTitle>
            <Badge variant={getCategoryColor(service.category)}>
              {categoryName}
            </Badge>
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(service)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 가격 정보 */}
        <div className="flex items-center space-x-2 text-sm">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span className="font-semibold text-lg text-blue-600">
            {formatPrice(service.price)}
          </span>
        </div>

        {/* 소요 시간 */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{formatDuration(service.duration)}</span>
        </div>

        {/* 패키지 정보 */}
        {hasPackages && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Package className="h-4 w-4" />
              <span>패키지 할인</span>
            </div>
            <div className="space-y-1 text-xs">
              {service.package4Price && (
                <div className="flex justify-between">
                  <span>4회:</span>
                  <span className="font-medium">{formatPrice(service.package4Price)}</span>
                </div>
              )}
              {service.package8Price && (
                <div className="flex justify-between">
                  <span>8회:</span>
                  <span className="font-medium">{formatPrice(service.package8Price)}</span>
                </div>
              )}
              {service.package10Price && (
                <div className="flex justify-between">
                  <span>10회:</span>
                  <span className="font-medium">{formatPrice(service.package10Price)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 설명 */}
        {service.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* 추가구성 옵션 */}
        <div className="flex flex-wrap gap-1">
          {service.allowWhiteJade && (
            <Badge variant="secondary">백옥</Badge>
          )}
          {service.allowWhiteJadeDouble && (
            <Badge variant="secondary">백옥더블</Badge>
          )}
          {service.allowThymus && (
            <Badge variant="secondary">가슴샘</Badge>
          )}
          {service.allowPowerShot && (
            <Badge variant="secondary">강력주사</Badge>
          )}
        </div>

        {/* 상태 */}
        <div className="flex items-center justify-between">
          <Badge variant={service.isActive ? 'success' : 'secondary'}>
            {service.isActive ? '활성' : '비활성'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}