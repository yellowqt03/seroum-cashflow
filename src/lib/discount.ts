import { DiscountCalculation, Service, Customer } from './types'

export interface DiscountConflict {
  type: 'multiple_customer_discounts' | 'package_with_vip' | 'birthday_limit_exceeded' | 'custom'
  description: string
  severity: 'warning' | 'critical'
  requiresApproval: boolean
}

export interface EnhancedDiscountCalculation extends DiscountCalculation {
  conflicts: DiscountConflict[]
  requiresApproval: boolean
  breakdown: {
    vipDiscount: number
    birthdayDiscount: number
    employeeDiscount: number
    packageDiscount: number
    addOnDiscount: number
  }
}

export interface OptimalDiscountOption {
  type: 'customer' | 'package' | 'combination'
  description: string
  discountAmount: number
  finalPrice: number
  discountRate: number
  appliedDiscounts: {
    vipDiscount: number
    birthdayDiscount: number
    employeeDiscount: number
    packageDiscount: number
    addOnDiscount: number
  }
  requiresApproval: boolean
  conflicts: DiscountConflict[]
}

export interface OptimalDiscountCalculation {
  originalPrice: number
  bestOption: OptimalDiscountOption
  allOptions: OptimalDiscountOption[]
  canAutoApply: boolean
}

export interface DiscountCalculationInput {
  service: Service
  customer: Customer
  packageType: string
  quantity: number
  addOns?: Array<{ id: string; name: string; price: number; quantity: number }>
}

/**
 * 고급 할인 계산 함수 (중복 할인 감지 및 관리자 승인 필요 여부 판단)
 */
export function calculateAdvancedDiscount(input: DiscountCalculationInput): EnhancedDiscountCalculation {
  const { service, customer, packageType, quantity, addOns = [] } = input

  // 1. 기본 가격 계산
  const servicePrice = getServicePrice(service, packageType, quantity)
  const addOnPrice = addOns.reduce((total, addOn) => total + (addOn.price * addOn.quantity), 0)
  const originalPrice = servicePrice + addOnPrice

  // 2. 각 할인을 별개로 계산
  const breakdown = {
    vipDiscount: calculateVipDiscount(customer, service, servicePrice + addOnPrice),
    birthdayDiscount: calculateBirthdayDiscount(customer, service, servicePrice + addOnPrice),
    employeeDiscount: calculateEmployeeDiscount(customer, service, servicePrice + addOnPrice),
    packageDiscount: calculatePackageDiscount(service, packageType, quantity),
    addOnDiscount: 0 // 추가구성은 별도 할인 없음
  }

  // 3. 패키지 할인을 먼저 적용한 후 고객 할인 계산
  const priceAfterPackageDiscount = originalPrice - breakdown.packageDiscount
  const customerDiscountOnReducedPrice = Math.max(
    calculateVipDiscount(customer, service, priceAfterPackageDiscount),
    calculateBirthdayDiscount(customer, service, priceAfterPackageDiscount),
    calculateEmployeeDiscount(customer, service, priceAfterPackageDiscount)
  )

  // 4. 중복 할인 감지
  const conflicts = detectDiscountConflicts(customer, service, breakdown, packageType)

  // 5. 최종 할인 계산 (기본 우선순위 적용)
  let finalDiscount: number
  let requiresApproval = false

  if (conflicts.some(c => c.requiresApproval)) {
    // 관리자 승인이 필요한 경우 - 가장 유리한 할인만 적용
    finalDiscount = breakdown.packageDiscount + customerDiscountOnReducedPrice
    requiresApproval = true
  } else {
    // 일반적인 경우 - 기존 로직 적용
    finalDiscount = breakdown.packageDiscount + customerDiscountOnReducedPrice
  }

  const finalPrice = Math.max(0, originalPrice - finalDiscount)
  const discountRate = originalPrice > 0 ? (finalDiscount / originalPrice) : 0

  return {
    originalPrice,
    packageDiscount: breakdown.packageDiscount,
    customerDiscount: customerDiscountOnReducedPrice,
    totalDiscount: finalDiscount,
    finalPrice,
    discountRate,
    conflicts,
    requiresApproval,
    breakdown
  }
}

/**
 * 종합 할인 계산 함수 (기존 함수 - 하위 호환성 유지)
 * PRD의 할인 우선순위에 따라 계산:
 * 1. 고객 유형별 할인 (VIP/생일자/직원)
 * 2. 패키지 할인 (4회/8회/10회)
 * 3. 추가구성 옵션 (개별 계산)
 */
export function calculateDiscount(input: DiscountCalculationInput): DiscountCalculation {
  const { service, customer, packageType, quantity, addOns = [] } = input

  // 1. 기본 서비스 가격 계산
  let servicePrice = getServicePrice(service, packageType, quantity)

  // 2. 추가구성 옵션 가격 계산
  const addOnPrice = addOns.reduce((total, addOn) => {
    return total + (addOn.price * addOn.quantity)
  }, 0)

  const originalPrice = servicePrice + addOnPrice

  // 3. 패키지 할인 계산 (서비스에만 적용)
  const packageDiscount = calculatePackageDiscount(service, packageType, quantity)

  // 4. 고객 할인 계산 (패키지 할인 적용 후 가격에 적용)
  const priceAfterPackageDiscount = servicePrice - packageDiscount + addOnPrice
  const customerDiscount = calculateCustomerDiscount(priceAfterPackageDiscount, customer, service)

  // 5. 최종 계산
  const totalDiscount = packageDiscount + customerDiscount
  const finalPrice = Math.max(0, originalPrice - totalDiscount)
  const discountRate = originalPrice > 0 ? (totalDiscount / originalPrice) : 0

  return {
    originalPrice,
    packageDiscount,
    customerDiscount,
    totalDiscount,
    finalPrice,
    discountRate
  }
}

/**
 * 서비스 가격 계산 (패키지 타입에 따라)
 */
function getServicePrice(service: Service, packageType: string, quantity: number): number {
  switch (packageType) {
    case 'package4':
      return service.package4Price ? service.package4Price * quantity : service.price * 4 * quantity
    case 'package8':
      return service.package8Price ? service.package8Price * quantity : service.price * 8 * quantity
    case 'package10':
      return service.package10Price ? service.package10Price * quantity : service.price * 10 * quantity
    default: // 'single'
      return service.price * quantity
  }
}

/**
 * 패키지 할인 계산
 */
function calculatePackageDiscount(service: Service, packageType: string, quantity: number): number {
  const basePrice = service.price

  switch (packageType) {
    case 'package4':
      // 설정된 패키지 가격이 있으면 그 차이만큼, 없으면 10% 할인
      if (service.package4Price) {
        const standardPrice = basePrice * 4 * quantity
        return Math.max(0, standardPrice - service.package4Price * quantity)
      }
      return Math.round(basePrice * 4 * quantity * 0.1)

    case 'package8':
      if (service.package8Price) {
        const standardPrice = basePrice * 8 * quantity
        return Math.max(0, standardPrice - service.package8Price * quantity)
      }
      return Math.round(basePrice * 8 * quantity * 0.2)

    case 'package10':
      if (service.package10Price) {
        const standardPrice = basePrice * 10 * quantity
        return Math.max(0, standardPrice - service.package10Price * quantity)
      }
      return Math.round(basePrice * 10 * quantity * 0.25)

    default:
      return 0
  }
}

/**
 * 고객 할인 계산
 */
function calculateCustomerDiscount(priceAfterPackageDiscount: number, customer: Customer, service: Service): number {
  switch (customer.discountType) {
    case 'VIP':
      // VIP는 특정 서비스에 대해 100% 할인
      if (service.name === 'VIP혈관청소' || service.name === 'VIP백옥') {
        return priceAfterPackageDiscount
      }
      return 0

    case 'BIRTHDAY':
      // 생일자는 특정 서비스에 대해 50% 할인 (연간 8회 제한)
      if (isBirthdayDiscountApplicable(service.name, customer)) {
        return Math.round(priceAfterPackageDiscount * 0.5)
      }
      return 0

    case 'EMPLOYEE':
      // 직원은 모든 서비스에 대해 50% 할인
      return Math.round(priceAfterPackageDiscount * 0.5)

    default:
      return 0
  }
}

/**
 * 생일자 할인 적용 가능 여부 확인
 */
function isBirthdayDiscountApplicable(serviceName: string, customer: Customer): boolean {
  // 현재 연도
  const currentYear = new Date().getFullYear()

  // 생일자 할인 가능 서비스
  const birthdayServices = ['프리미엄회복', '프리미엄면역']

  if (!birthdayServices.includes(serviceName)) {
    return false
  }

  // 연간 8회 제한 확인
  if (customer.birthdayDiscountYear === currentYear && customer.birthdayUsedCount >= 8) {
    return false
  }

  return true
}

/**
 * 할인 적용 시뮬레이션 (실제 적용 전 미리보기)
 */
export function simulateDiscount(input: DiscountCalculationInput): DiscountCalculation & {
  warnings: string[]
  canApply: boolean
} {
  const calculation = calculateDiscount(input)
  const warnings: string[] = []
  let canApply = true

  const { customer, service } = input

  // 생일자 할인 한도 체크
  if (customer.discountType === 'BIRTHDAY') {
    const currentYear = new Date().getFullYear()
    const birthdayServices = ['프리미엄회복', '프리미엄면역']

    if (birthdayServices.includes(service.name)) {
      if (customer.birthdayDiscountYear === currentYear && customer.birthdayUsedCount >= 8) {
        warnings.push('생일자 할인 연간 한도(8회)를 초과했습니다.')
        canApply = false
      } else if (customer.birthdayDiscountYear === currentYear) {
        const remaining = 8 - customer.birthdayUsedCount
        warnings.push(`생일자 할인 잔여 횟수: ${remaining}회`)
      }
    }
  }

  // VIP 할인 체크
  if (customer.discountType === 'VIP') {
    const vipServices = ['VIP혈관청소', 'VIP백옥']
    if (!vipServices.includes(service.name)) {
      warnings.push('이 서비스는 VIP 할인 대상이 아닙니다.')
    }
  }

  return {
    ...calculation,
    warnings,
    canApply
  }
}

/**
 * 월별 할인 사용 통계
 */
export interface MonthlyDiscountStats {
  month: string
  vipDiscount: number
  birthdayDiscount: number
  employeeDiscount: number
  packageDiscount: number
  totalDiscount: number
  totalOrders: number
}

/**
 * VIP 할인 계산
 */
function calculateVipDiscount(customer: Customer, service: Service, price: number): number {
  if (customer.discountType !== 'VIP') return 0

  // VIP는 특정 서비스에 대해 100% 할인
  if (service.name === 'VIP혈관청소' || service.name === 'VIP백옥') {
    return price
  }
  return 0
}

/**
 * 생일자 할인 계산
 */
function calculateBirthdayDiscount(customer: Customer, service: Service, price: number): number {
  if (customer.discountType !== 'BIRTHDAY') return 0

  const birthdayServices = ['프리미엄회복', '프리미엄면역']
  if (!birthdayServices.includes(service.name)) return 0

  // 생일자는 50% 할인
  return Math.round(price * 0.5)
}

/**
 * 직원 할인 계산
 */
function calculateEmployeeDiscount(customer: Customer, service: Service, price: number): number {
  if (customer.discountType !== 'EMPLOYEE') return 0

  // 직원은 모든 서비스에 대해 50% 할인
  return Math.round(price * 0.5)
}

/**
 * 중복 할인 감지 함수
 */
function detectDiscountConflicts(
  customer: Customer,
  service: Service,
  breakdown: any,
  packageType: string
): DiscountConflict[] {
  const conflicts: DiscountConflict[] = []

  // 1. 여러 고객 할인이 동시에 적용 가능한 경우
  const customerDiscountCount = [
    breakdown.vipDiscount > 0,
    breakdown.birthdayDiscount > 0,
    breakdown.employeeDiscount > 0
  ].filter(Boolean).length

  if (customerDiscountCount > 1) {
    conflicts.push({
      type: 'multiple_customer_discounts',
      description: `${customer.name} 고객에게 여러 할인 유형이 적용됩니다 (VIP: ${breakdown.vipDiscount > 0 ? 'O' : 'X'}, 생일자: ${breakdown.birthdayDiscount > 0 ? 'O' : 'X'}, 직원: ${breakdown.employeeDiscount > 0 ? 'O' : 'X'})`,
      severity: 'warning',
      requiresApproval: true
    })
  }

  // 2. 패키지 할인과 VIP 무료 서비스가 겹치는 경우
  if (breakdown.packageDiscount > 0 && breakdown.vipDiscount > 0) {
    conflicts.push({
      type: 'package_with_vip',
      description: `VIP 무료 서비스에 패키지 할인이 중복 적용됩니다`,
      severity: 'warning',
      requiresApproval: true
    })
  }

  // 3. 생일자 할인 한도 초과 검사
  if (breakdown.birthdayDiscount > 0) {
    const currentYear = new Date().getFullYear()
    if (customer.birthdayDiscountYear === currentYear && customer.birthdayUsedCount >= 8) {
      conflicts.push({
        type: 'birthday_limit_exceeded',
        description: `생일자 할인 연간 한도(8회)를 초과했습니다. 현재 사용: ${customer.birthdayUsedCount}회`,
        severity: 'critical',
        requiresApproval: true
      })
    }
  }

  // 4. 높은 할인율 (70% 이상) 경고
  const totalDiscountAmount = breakdown.packageDiscount + Math.max(
    breakdown.vipDiscount,
    breakdown.birthdayDiscount,
    breakdown.employeeDiscount
  )
  const originalPrice = getServicePrice(service, packageType, 1) // 1개 기준
  const discountRate = originalPrice > 0 ? (totalDiscountAmount / originalPrice) : 0

  if (discountRate >= 0.7) {
    conflicts.push({
      type: 'custom',
      description: `높은 할인율이 적용됩니다 (${Math.round(discountRate * 100)}%)`,
      severity: 'warning',
      requiresApproval: false // 높은 할인율은 경고만
    })
  }

  return conflicts
}

/**
 * 할인 승인 요청 생성
 */
export interface DiscountApprovalData {
  customerId: string
  serviceDetails: any
  appliedDiscounts: any
  originalAmount: number
  discountAmount: number
  finalAmount: number
  conflictReason: string
  staffNote?: string
  requestedBy: string
}

/**
 * 할인 유형별 색상 코드
 */
export function getDiscountTypeColor(discountType: string): string {
  switch (discountType) {
    case 'VIP':
      return 'bg-purple-100 text-purple-800'
    case 'BIRTHDAY':
      return 'bg-pink-100 text-pink-800'
    case 'EMPLOYEE':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * 최적 할인 조합 계산
 */
export function calculateOptimalDiscount(input: DiscountCalculationInput): OptimalDiscountCalculation {
  const { service, customer, packageType, quantity } = input

  // 기본 가격 계산
  const servicePrice = getServicePrice(service, packageType, quantity)
  const addOnPrice = (input.addOns || []).reduce((total, addOn) => total + (addOn.price * addOn.quantity), 0)
  const originalPrice = servicePrice + addOnPrice

  const options: OptimalDiscountOption[] = []

  // 1. 단품 + 고객 할인 조합들
  const singlePackagePrice = service.price * quantity + addOnPrice

  // VIP 할인만
  const vipDiscount = calculateVipDiscount(customer, service, singlePackagePrice)
  if (vipDiscount > 0) {
    const finalPrice = singlePackagePrice - vipDiscount
    const conflicts = detectDiscountConflicts(customer, service,
      { vipDiscount, birthdayDiscount: 0, employeeDiscount: 0, packageDiscount: 0, addOnDiscount: 0 }, 'single')

    options.push({
      type: 'customer',
      description: 'VIP 할인 (100% 무료)',
      discountAmount: vipDiscount,
      finalPrice,
      discountRate: vipDiscount / singlePackagePrice,
      appliedDiscounts: { vipDiscount, birthdayDiscount: 0, employeeDiscount: 0, packageDiscount: 0, addOnDiscount: 0 },
      requiresApproval: conflicts.some(c => c.requiresApproval),
      conflicts
    })
  }

  // 생일자 할인만
  const birthdayDiscount = calculateBirthdayDiscount(customer, service, singlePackagePrice)
  if (birthdayDiscount > 0) {
    const finalPrice = singlePackagePrice - birthdayDiscount
    const conflicts = detectDiscountConflicts(customer, service,
      { vipDiscount: 0, birthdayDiscount, employeeDiscount: 0, packageDiscount: 0, addOnDiscount: 0 }, 'single')

    options.push({
      type: 'customer',
      description: '생일자 할인 (50%)',
      discountAmount: birthdayDiscount,
      finalPrice,
      discountRate: birthdayDiscount / singlePackagePrice,
      appliedDiscounts: { vipDiscount: 0, birthdayDiscount, employeeDiscount: 0, packageDiscount: 0, addOnDiscount: 0 },
      requiresApproval: conflicts.some(c => c.requiresApproval),
      conflicts
    })
  }

  // 직원 할인만
  const employeeDiscount = calculateEmployeeDiscount(customer, service, singlePackagePrice)
  if (employeeDiscount > 0) {
    const finalPrice = singlePackagePrice - employeeDiscount
    const conflicts = detectDiscountConflicts(customer, service,
      { vipDiscount: 0, birthdayDiscount: 0, employeeDiscount, packageDiscount: 0, addOnDiscount: 0 }, 'single')

    options.push({
      type: 'customer',
      description: '직원 할인 (50%)',
      discountAmount: employeeDiscount,
      finalPrice,
      discountRate: employeeDiscount / singlePackagePrice,
      appliedDiscounts: { vipDiscount: 0, birthdayDiscount: 0, employeeDiscount, packageDiscount: 0, addOnDiscount: 0 },
      requiresApproval: conflicts.some(c => c.requiresApproval),
      conflicts
    })
  }

  // 2. 패키지 할인 조합들
  const packageTypes = ['package4', 'package8', 'package10']

  packageTypes.forEach(pkgType => {
    if (pkgType === 'package10' && !['킬레이션', '프리미엄킬레이션'].includes(service.name)) {
      return // 10회 패키지는 킬레이션만
    }

    const packagePrice = getServicePrice(service, pkgType, quantity) + addOnPrice
    const packageDiscount = calculatePackageDiscount(service, pkgType, quantity)

    if (packageDiscount > 0) {
      // 패키지 할인만
      const finalPrice = originalPrice - packageDiscount
      const conflicts = detectDiscountConflicts(customer, service,
        { vipDiscount: 0, birthdayDiscount: 0, employeeDiscount: 0, packageDiscount, addOnDiscount: 0 }, pkgType)

      const packageName = pkgType === 'package4' ? '4회 패키지 (10%)' :
                         pkgType === 'package8' ? '8회 패키지 (20%)' :
                         '10회 패키지 (25%)'

      options.push({
        type: 'package',
        description: packageName,
        discountAmount: packageDiscount,
        finalPrice,
        discountRate: packageDiscount / originalPrice,
        appliedDiscounts: { vipDiscount: 0, birthdayDiscount: 0, employeeDiscount: 0, packageDiscount, addOnDiscount: 0 },
        requiresApproval: conflicts.some(c => c.requiresApproval),
        conflicts
      })

      // 패키지 + 고객 할인 조합들
      const priceAfterPackage = packagePrice

      // 패키지 + VIP
      const vipOnPackage = calculateVipDiscount(customer, service, priceAfterPackage)
      if (vipOnPackage > 0) {
        const totalDiscount = packageDiscount + vipOnPackage
        const finalPrice = originalPrice - totalDiscount
        const conflicts = detectDiscountConflicts(customer, service,
          { vipDiscount: vipOnPackage, birthdayDiscount: 0, employeeDiscount: 0, packageDiscount, addOnDiscount: 0 }, pkgType)

        options.push({
          type: 'combination',
          description: `${packageName} + VIP 할인`,
          discountAmount: totalDiscount,
          finalPrice,
          discountRate: totalDiscount / originalPrice,
          appliedDiscounts: { vipDiscount: vipOnPackage, birthdayDiscount: 0, employeeDiscount: 0, packageDiscount, addOnDiscount: 0 },
          requiresApproval: true, // 조합 할인은 항상 승인 필요
          conflicts
        })
      }

      // 패키지 + 생일자
      const birthdayOnPackage = calculateBirthdayDiscount(customer, service, priceAfterPackage)
      if (birthdayOnPackage > 0) {
        const totalDiscount = packageDiscount + birthdayOnPackage
        const finalPrice = originalPrice - totalDiscount
        const conflicts = detectDiscountConflicts(customer, service,
          { vipDiscount: 0, birthdayDiscount: birthdayOnPackage, employeeDiscount: 0, packageDiscount, addOnDiscount: 0 }, pkgType)

        options.push({
          type: 'combination',
          description: `${packageName} + 생일자 할인`,
          discountAmount: totalDiscount,
          finalPrice,
          discountRate: totalDiscount / originalPrice,
          appliedDiscounts: { vipDiscount: 0, birthdayDiscount: birthdayOnPackage, employeeDiscount: 0, packageDiscount, addOnDiscount: 0 },
          requiresApproval: true,
          conflicts
        })
      }

      // 패키지 + 직원
      const employeeOnPackage = calculateEmployeeDiscount(customer, service, priceAfterPackage)
      if (employeeOnPackage > 0) {
        const totalDiscount = packageDiscount + employeeOnPackage
        const finalPrice = originalPrice - totalDiscount
        const conflicts = detectDiscountConflicts(customer, service,
          { vipDiscount: 0, birthdayDiscount: 0, employeeDiscount: employeeOnPackage, packageDiscount, addOnDiscount: 0 }, pkgType)

        options.push({
          type: 'combination',
          description: `${packageName} + 직원 할인`,
          discountAmount: totalDiscount,
          finalPrice,
          discountRate: totalDiscount / originalPrice,
          appliedDiscounts: { vipDiscount: 0, birthdayDiscount: 0, employeeDiscount: employeeOnPackage, packageDiscount, addOnDiscount: 0 },
          requiresApproval: true,
          conflicts
        })
      }
    }
  })

  // 할인 없음 옵션
  options.push({
    type: 'customer',
    description: '할인 없음',
    discountAmount: 0,
    finalPrice: originalPrice,
    discountRate: 0,
    appliedDiscounts: { vipDiscount: 0, birthdayDiscount: 0, employeeDiscount: 0, packageDiscount: 0, addOnDiscount: 0 },
    requiresApproval: false,
    conflicts: []
  })

  // 최대 할인 옵션 찾기
  const bestOption = options.reduce((best, current) =>
    current.discountAmount > best.discountAmount ? current : best
  )

  // 자동 적용 가능 여부 (승인이 필요하지 않은 경우만)
  const canAutoApply = !bestOption.requiresApproval

  return {
    originalPrice,
    bestOption,
    allOptions: options.sort((a, b) => b.discountAmount - a.discountAmount),
    canAutoApply
  }
}

/**
 * 중복 할인 승인 요청 생성
 */
export function createDiscountApprovalRequest(
  calculation: EnhancedDiscountCalculation,
  input: DiscountCalculationInput,
  requestedBy: string,
  staffNote?: string
): DiscountApprovalData {
  const conflictReasons = calculation.conflicts.map(c => c.description).join('; ')

  return {
    customerId: input.customer.id,
    serviceDetails: {
      serviceName: input.service.name,
      packageType: input.packageType,
      quantity: input.quantity,
      addOns: input.addOns || []
    },
    appliedDiscounts: calculation.breakdown,
    originalAmount: calculation.originalPrice,
    discountAmount: calculation.totalDiscount,
    finalAmount: calculation.finalPrice,
    conflictReason: conflictReasons,
    staffNote,
    requestedBy
  }
}