'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SERVICE_CATEGORIES, Service } from '@/lib/types'
import { X } from 'lucide-react'

interface ServiceFormProps {
  service?: Service
  onSubmit: (data: Partial<Service>) => Promise<void>
  onCancel: () => void
}

export function ServiceForm({ service, onSubmit, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    category: service?.category || 'IMMUNE_RECOVERY',
    price: service?.price?.toString() || '',
    duration: service?.duration?.toString() || '30',
    description: service?.description || '',
    package4Price: service?.package4Price?.toString() || '',
    package8Price: service?.package8Price?.toString() || '',
    package10Price: service?.package10Price?.toString() || '',
    allowWhiteJade: service?.allowWhiteJade ?? true,
    allowWhiteJadeDouble: service?.allowWhiteJadeDouble ?? true,
    allowThymus: service?.allowThymus ?? true,
    allowPowerShot: service?.allowPowerShot ?? true,
    isActive: service?.isActive ?? true
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit({
        ...formData,
        price: parseInt(formData.price),
        duration: parseInt(formData.duration),
        package4Price: formData.package4Price ? parseInt(formData.package4Price) : null,
        package8Price: formData.package8Price ? parseInt(formData.package8Price) : null,
        package10Price: formData.package10Price ? parseInt(formData.package10Price) : null,
      })
    } catch (error) {
      console.error('서비스 저장 오류:', error)
      alert('서비스 저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {service ? '서비스 수정' : '서비스 추가'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">기본 정보</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                서비스명 *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 프리미엄회복"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 *
                </label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {Object.entries(SERVICE_CATEGORIES).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <Select
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                >
                  <option value="true">활성</option>
                  <option value="false">비활성</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가격 (원) *
                </label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="120000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  소요 시간 (분) *
                </label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="서비스 설명"
                rows={3}
              />
            </div>
          </div>

          {/* 패키지 가격 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">패키지 할인 가격</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4회 패키지
                </label>
                <Input
                  type="number"
                  value={formData.package4Price}
                  onChange={(e) => setFormData({ ...formData, package4Price: e.target.value })}
                  placeholder="10% 할인"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  8회 패키지
                </label>
                <Input
                  type="number"
                  value={formData.package8Price}
                  onChange={(e) => setFormData({ ...formData, package8Price: e.target.value })}
                  placeholder="20% 할인"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  10회 패키지
                </label>
                <Input
                  type="number"
                  value={formData.package10Price}
                  onChange={(e) => setFormData({ ...formData, package10Price: e.target.value })}
                  placeholder="25% 할인"
                />
              </div>
            </div>
          </div>

          {/* 추가구성 옵션 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">추가구성 옵션</h3>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowWhiteJade}
                  onChange={(e) => setFormData({ ...formData, allowWhiteJade: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">백옥 가능</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowWhiteJadeDouble}
                  onChange={(e) => setFormData({ ...formData, allowWhiteJadeDouble: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">백옥더블 가능</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowThymus}
                  onChange={(e) => setFormData({ ...formData, allowThymus: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">가슴샘 가능</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowPowerShot}
                  onChange={(e) => setFormData({ ...formData, allowPowerShot: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">강력주사 가능</span>
              </label>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? '저장 중...' : service ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
