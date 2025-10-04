import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 가격 포맷팅 (원화)
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0
  }).format(price)
}

// 숫자 포맷팅 (천 단위 구분)
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num)
}

// 날짜 포맷팅
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  switch (format) {
    case 'short':
      return d.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      })
    case 'long':
      return d.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    case 'time':
      return d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    default:
      return d.toLocaleDateString('ko-KR')
  }
}

// 시간 포맷팅 (분을 시간:분으로)
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}

// 할인율 계산
export function calculateDiscountRate(originalPrice: number, discountedPrice: number): number {
  if (originalPrice === 0) return 0
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
}

// 패키지 할인 계산
export function calculatePackageDiscount(basePrice: number, packageType: string): number {
  switch (packageType) {
    case 'package4':
      return Math.round(basePrice * 4 * 0.1) // 10% 할인
    case 'package8':
      return Math.round(basePrice * 8 * 0.2) // 20% 할인
    case 'package10':
      return Math.round(basePrice * 10 * 0.25) // 25% 할인
    default:
      return 0
  }
}

// 고객 할인 계산
export function calculateCustomerDiscount(price: number, discountType: string): number {
  switch (discountType) {
    case 'VIP':
      return price // 100% 할인 (VIP 전용 서비스의 경우)
    case 'BIRTHDAY':
      return Math.round(price * 0.5) // 50% 할인
    case 'EMPLOYEE':
      return Math.round(price * 0.5) // 50% 할인
    default:
      return 0
  }
}

// 전화번호 포맷팅
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }
  return phone
}

// 생일인지 확인 (월, 일만 비교)
export function isBirthday(birthDate: Date): boolean {
  const today = new Date()
  return birthDate.getMonth() === today.getMonth() &&
         birthDate.getDate() === today.getDate()
}

// 생일 월인지 확인
export function isBirthdayMonth(birthDate: Date): boolean {
  const today = new Date()
  return birthDate.getMonth() === today.getMonth()
}

// 주차 계산 (1일부터 시작하는 주차)
export function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const dayOfMonth = date.getDate()
  const firstDayOfWeek = firstDay.getDay()
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7)
}

// 매출 색상 코드 (목표 대비 달성률에 따라)
export function getSalesColor(achievementRate: number): string {
  if (achievementRate >= 120) return 'text-green-600'
  if (achievementRate >= 100) return 'text-blue-600'
  if (achievementRate >= 80) return 'text-yellow-600'
  return 'text-red-600'
}

// 상태 색상 코드
export function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-600 bg-green-50'
    case 'IN_PROGRESS':
      return 'text-blue-600 bg-blue-50'
    case 'PENDING':
      return 'text-yellow-600 bg-yellow-50'
    case 'CANCELLED':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}