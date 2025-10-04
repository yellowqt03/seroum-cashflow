'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Service, PACKAGE_TYPES, SERVICE_CATEGORIES } from '@/lib/types'
import { formatPrice, formatDuration } from '@/lib/utils'
import { ShoppingCart, Package, Clock, DollarSign, Minus, Plus } from 'lucide-react'

interface ServiceItem {
  service: Service
  packageType: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface ServiceSelectorProps {
  selectedServices: ServiceItem[]
  onServiceChange: (services: ServiceItem[]) => void
}

export function ServiceSelector({ selectedServices, onServiceChange }: ServiceSelectorProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data.filter((s: Service) => s.isActive))
      }
    } catch (error) {
      console.error('서비스 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addService = (service: Service, packageType: string = 'single') => {
    const unitPrice = getServicePrice(service, packageType)
    const newItem: ServiceItem = {
      service,
      packageType,
      quantity: 1,
      unitPrice,
      totalPrice: unitPrice
    }

    const existingIndex = selectedServices.findIndex(
      item => item.service.id === service.id && item.packageType === packageType
    )

    if (existingIndex >= 0) {
      // 이미 있는 경우 수량 증가
      const updatedServices = [...selectedServices]
      updatedServices[existingIndex].quantity += 1
      updatedServices[existingIndex].totalPrice = updatedServices[existingIndex].unitPrice * updatedServices[existingIndex].quantity
      onServiceChange(updatedServices)
    } else {
      // 새로 추가
      onServiceChange([...selectedServices, newItem])
    }
  }

  const updateQuantity = (index: number, change: number) => {
    const updatedServices = [...selectedServices]
    const newQuantity = updatedServices[index].quantity + change

    if (newQuantity <= 0) {
      // 수량이 0 이하면 제거
      updatedServices.splice(index, 1)
    } else {
      updatedServices[index].quantity = newQuantity
      updatedServices[index].totalPrice = updatedServices[index].unitPrice * newQuantity
    }

    onServiceChange(updatedServices)
  }

  const updatePackageType = (index: number, packageType: string) => {
    const updatedServices = [...selectedServices]
    const item = updatedServices[index]
    const newUnitPrice = getServicePrice(item.service, packageType)

    updatedServices[index] = {
      ...item,
      packageType,
      unitPrice: newUnitPrice,
      totalPrice: newUnitPrice * item.quantity
    }

    onServiceChange(updatedServices)
  }

  const getServicePrice = (service: Service, packageType: string): number => {
    switch (packageType) {
      case 'package4':
        return service.package4Price || (service.price * 4 * 0.9)
      case 'package8':
        return service.package8Price || (service.price * 8 * 0.8)
      case 'package10':
        return service.package10Price || (service.price * 10 * 0.75)
      default:
        return service.price
    }
  }

  const getAvailablePackages = (service: Service) => {
    const packages = [{ key: 'single', label: '단품', price: service.price }]

    if (service.package4Price || service.price) {
      packages.push({
        key: 'package4',
        label: '4회 패키지',
        price: service.package4Price || (service.price * 4 * 0.9)
      })
    }

    if (service.package8Price || service.price) {
      packages.push({
        key: 'package8',
        label: '8회 패키지',
        price: service.package8Price || (service.price * 8 * 0.8)
      })
    }

    if (service.package10Price) {
      packages.push({
        key: 'package10',
        label: '10회 패키지',
        price: service.package10Price
      })
    }

    return packages
  }

  const totalAmount = selectedServices.reduce((sum, item) => sum + item.totalPrice, 0)
  const totalItems = selectedServices.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="space-y-6">
      {/* 선택된 서비스 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              선택된 서비스 ({totalItems}개)
            </span>
            <div className="text-xl font-bold text-blue-600">
              {formatPrice(totalAmount)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아래에서 서비스를 선택해주세요.
            </div>
          ) : (
            <div className="space-y-4">
              {selectedServices.map((item, index) => (
                <div key={`${item.service.id}-${item.packageType}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.service.name}</div>
                    <div className="text-sm text-gray-600">
                      {PACKAGE_TYPES[item.packageType as keyof typeof PACKAGE_TYPES]} • {formatPrice(item.unitPrice)}
                    </div>
                  </div>

                  {/* 패키지 타입 변경 */}
                  <div className="mx-4">
                    <Select
                      value={item.packageType}
                      onChange={(e) => updatePackageType(index, e.target.value)}
                      className="w-32"
                    >
                      {getAvailablePackages(item.service).map((pkg) => (
                        <option key={pkg.key} value={pkg.key}>
                          {pkg.key === 'single' ? '단품' : pkg.key.replace('package', '') + '회'}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* 수량 조절 */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(index, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(index, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right font-medium w-20">
                    {formatPrice(item.totalPrice)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 서비스 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>서비스 선택</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 필터링 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              placeholder="서비스 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">모든 카테고리</option>
              {Object.entries(SERVICE_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>

          {/* 서비스 목록 */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredServices.map((service) => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{service.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatPrice(service.price)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {SERVICE_CATEGORIES[service.category as keyof typeof SERVICE_CATEGORIES]}
                    </Badge>
                  </div>

                  {service.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {/* 패키지 옵션 */}
                  <div className="space-y-2">
                    {getAvailablePackages(service).map((pkg) => (
                      <div key={pkg.key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {pkg.key === 'single' ? '단품' : `${pkg.key.replace('package', '')}회 패키지`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{formatPrice(pkg.price)}</span>
                          <Button
                            size="sm"
                            onClick={() => addService(service, pkg.key)}
                          >
                            추가
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 빈 상태 */}
          {!loading && filteredServices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              검색 조건에 맞는 서비스가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}