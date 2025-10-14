'use client'

import { useState, useEffect } from 'react'
import { ServiceCard } from './ServiceCard'
import { ServiceForm } from './ServiceForm'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Service, SERVICE_CATEGORIES } from '@/lib/types'
import { Search, Filter, Plus } from 'lucide-react'

export function ServicesGrid() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/services')
      if (!response.ok) {
        throw new Error('서비스 정보를 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setServices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddService = async (data: Partial<Service>) => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('서비스 추가에 실패했습니다.')
      }

      await fetchServices()
      setShowAddForm(false)
      alert('서비스가 추가되었습니다.')
    } catch (err) {
      throw err
    }
  }

  const handleEditService = async (data: Partial<Service>) => {
    if (!editingService) return

    try {
      const response = await fetch(`/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('서비스 수정에 실패했습니다.')
      }

      await fetchServices()
      setEditingService(null)
      alert('서비스가 수정되었습니다.')
    } catch (err) {
      throw err
    }
  }

  const handleDeleteService = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '서비스 삭제에 실패했습니다.')
      }

      await fetchServices()
      alert('서비스가 삭제되었습니다.')
    } catch (err) {
      alert(err instanceof Error ? err.message : '서비스 삭제에 실패했습니다.')
    }
  }

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    return matchesCategory && matchesSearch && service.isActive
  })

  const categories = Object.entries(SERVICE_CATEGORIES)

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchServices}>다시 시도</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 추가 버튼 */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          서비스 추가
        </Button>
      </div>

      {/* 필터링 및 검색 */}
      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="서비스명 또는 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === 'all' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('all')}
              >
                전체 ({services.filter(s => s.isActive).length})
              </Badge>
              {categories.map(([key, label]) => {
                const count = services.filter(s => s.category === key && s.isActive).length
                if (count === 0) return null
                return (
                  <Badge
                    key={key}
                    variant={selectedCategory === key ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(key)}
                  >
                    {label} ({count})
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 서비스 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-xl font-semibold text-slate-900">{services.filter(s => s.isActive).length}</div>
          <div className="text-xs text-slate-600">활성 서비스</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-xl font-semibold text-slate-900">
            {services.filter(s => s.package4Price || s.package8Price || s.package10Price).length}
          </div>
          <div className="text-xs text-slate-600">패키지 서비스</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-xl font-semibold text-slate-900">
            {Math.round(services.filter(s => s.isActive).reduce((sum, s) => sum + s.price, 0) / services.filter(s => s.isActive).length / 1000) || 0}K
          </div>
          <div className="text-xs text-slate-600">평균 가격</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-xl font-semibold text-slate-900">
            {Math.round(services.filter(s => s.isActive).reduce((sum, s) => sum + s.duration, 0) / services.filter(s => s.isActive).length) || 0}분
          </div>
          <div className="text-xs text-slate-600">평균 시간</div>
        </div>
      </div>

      {/* 서비스 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onEdit={setEditingService}
            onDelete={handleDeleteService}
          />
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? '검색 조건에 맞는 서비스가 없습니다.'
              : '등록된 서비스가 없습니다.'
            }
          </div>
          {(searchTerm || selectedCategory !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
            >
              필터 초기화
            </Button>
          )}
        </div>
      )}

      {/* 서비스 추가/수정 폼 */}
      {(showAddForm || editingService) && (
        <ServiceForm
          service={editingService || undefined}
          onSubmit={editingService ? handleEditService : handleAddService}
          onCancel={() => {
            setShowAddForm(false)
            setEditingService(null)
          }}
        />
      )}
    </div>
  )
}