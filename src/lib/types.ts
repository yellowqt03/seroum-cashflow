// 서비스 카테고리
export const SERVICE_CATEGORIES = {
  IMMUNE_RECOVERY: '면역/피로회복',
  CIRCULATION: '혈관/순환',
  BRAIN_COGNITIVE: '뇌/인지',
  DIGESTIVE: '소화기/장건강',
  BEAUTY_ANTI_AGING: '미용/안티에이징',
  NUTRITION_ENERGY: '영양/에너지',
  OTHER: '기타'
} as const

export type ServiceCategory = keyof typeof SERVICE_CATEGORIES

// 할인 유형
export const DISCOUNT_TYPES = {
  VIP: 'VIP 고객',
  BIRTHDAY: '생일자',
  EMPLOYEE: '직원',
  REGULAR: '일반 고객'
} as const

export type DiscountType = keyof typeof DISCOUNT_TYPES

// 유입 경로
export const CUSTOMER_SOURCES = {
  SEARCH: '검색',
  STAFF: '직원소개',
  AD: '원내광고',
  EVENT: '이벤트메시지',
  ENDOSCOPY: '내시경실',
  CLINIC: '진료',
  REFERRAL: '지인소개'
} as const

export type CustomerSource = keyof typeof CUSTOMER_SOURCES

// 결제 방법
export const PAYMENT_METHODS = {
  CARD: '카드',
  CASH: '현금',
  TRANSFER: '계좌이체'
} as const

export type PaymentMethod = keyof typeof PAYMENT_METHODS

// 주문 상태
export const ORDER_STATUSES = {
  PENDING: '대기',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소'
} as const

export type OrderStatus = keyof typeof ORDER_STATUSES

// 패키지 타입
export const PACKAGE_TYPES = {
  single: '단품',
  package4: '4회 패키지 (10% 할인)',
  package8: '8회 패키지 (20% 할인)',
  package10: '10회 패키지 (25% 할인)'
} as const

export type PackageType = keyof typeof PACKAGE_TYPES

// 할인 계산 결과
export interface DiscountCalculation {
  originalPrice: number
  packageDiscount: number
  customerDiscount: number
  totalDiscount: number
  finalPrice: number
  discountRate: number
}

// 서비스 정보 (DB 타입과 매칭)
export interface Service {
  id: string
  name: string
  category: string
  price: number
  duration: number
  description?: string | null
  isActive: boolean
  package4Price?: number | null
  package8Price?: number | null
  package10Price?: number | null
  allowWhiteJade: boolean
  allowWhiteJadeDouble: boolean
  allowThymus: boolean
  allowPowerShot: boolean
  createdAt: Date
  updatedAt: Date
}

// 고객 정보
export interface Customer {
  id: string
  name: string
  phone?: string | null
  birthDate?: Date | null
  discountType: string
  source: string
  isVip: boolean
  birthdayDiscountYear?: number | null
  birthdayUsedCount: number
  createdAt: Date
  updatedAt: Date
}

// 주문 정보
export interface Order {
  id: string
  customerId: string
  status: string
  paymentMethod: string
  subtotal: number
  discountAmount: number
  finalAmount: number
  appliedDiscountType?: string
  discountRate?: number
  notes?: string
  orderDate: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 주문 항목
export interface OrderItem {
  id: string
  orderId: string
  serviceId: string
  quantity: number
  packageType?: string
  unitPrice: number
  totalPrice: number
  createdAt: Date
}

// 추가구성 옵션
export interface AddOnOption {
  id: string
  name: string
  price: number
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}