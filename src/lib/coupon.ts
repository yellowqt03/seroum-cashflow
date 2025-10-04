/**
 * 쿠폰 할인 계산 및 검증 유틸리티
 */

export interface Coupon {
  id: string
  name: string
  discountType: 'PERCENT' | 'AMOUNT'
  discountValue: number
  minAmount: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  validFrom: Date | string
  validUntil: Date | string
  isActive: boolean
}

export interface CouponValidation {
  isValid: boolean
  error?: string
  discountAmount?: number
}

/**
 * 쿠폰 사용 가능 여부 검증
 */
export function validateCoupon(coupon: Coupon, orderAmount: number): CouponValidation {
  const now = new Date()
  const validFrom = new Date(coupon.validFrom)
  const validUntil = new Date(coupon.validUntil)

  // 활성 상태 확인
  if (!coupon.isActive) {
    return { isValid: false, error: '비활성화된 쿠폰입니다.' }
  }

  // 유효 기간 확인
  if (now < validFrom) {
    return { isValid: false, error: '아직 사용할 수 없는 쿠폰입니다.' }
  }

  if (now > validUntil) {
    return { isValid: false, error: '만료된 쿠폰입니다.' }
  }

  // 사용 횟수 제한 확인
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { isValid: false, error: '사용 횟수가 초과된 쿠폰입니다.' }
  }

  // 최소 주문 금액 확인
  if (coupon.minAmount && orderAmount < coupon.minAmount) {
    return {
      isValid: false,
      error: `최소 주문 금액 ${coupon.minAmount.toLocaleString()}원 이상이어야 합니다.`
    }
  }

  // 할인 금액 계산
  const discountAmount = calculateCouponDiscount(coupon, orderAmount)

  return {
    isValid: true,
    discountAmount
  }
}

/**
 * 쿠폰 할인 금액 계산
 */
export function calculateCouponDiscount(coupon: Coupon, orderAmount: number): number {
  let discountAmount = 0

  if (coupon.discountType === 'PERCENT') {
    // 퍼센트 할인
    discountAmount = Math.round(orderAmount * coupon.discountValue)

    // 최대 할인 금액 제한 적용
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount
    }
  } else {
    // 금액 할인
    discountAmount = coupon.discountValue
  }

  // 주문 금액을 초과할 수 없음
  return Math.min(discountAmount, orderAmount)
}

/**
 * 쿠폰 할인 설명 텍스트 생성
 */
export function getCouponDiscountDescription(coupon: Coupon): string {
  if (coupon.discountType === 'PERCENT') {
    const percent = Math.round(coupon.discountValue * 100)
    let desc = `${percent}% 할인`

    if (coupon.maxDiscount) {
      desc += ` (최대 ${coupon.maxDiscount.toLocaleString()}원)`
    }

    return desc
  } else {
    return `${coupon.discountValue.toLocaleString()}원 할인`
  }
}

/**
 * 쿠폰과 고객 할인 중복 적용 가능 여부 확인
 */
export function canCombineWithCustomerDiscount(
  customerDiscountType: string
): { canCombine: boolean; reason?: string } {
  // 현재 정책: 쿠폰과 고객 할인은 중복 적용 불가
  // VIP, 생일자, 직원 할인이 있는 경우 쿠폰 사용 불가
  if (['VIP', 'BIRTHDAY', 'EMPLOYEE'].includes(customerDiscountType)) {
    return {
      canCombine: false,
      reason: '고객 할인(VIP/생일자/직원)과 쿠폰은 중복 사용할 수 없습니다.'
    }
  }

  return { canCombine: true }
}

/**
 * 쿠폰 사용 기록 생성 데이터
 */
export interface CouponUsageData {
  couponId: string
  customerId: string
  orderId: string
  usedAt: Date
}

/**
 * 쿠폰 상태 표시 텍스트
 */
export function getCouponStatusText(coupon: Coupon): string {
  const now = new Date()
  const validUntil = new Date(coupon.validUntil)

  if (!coupon.isActive) {
    return '비활성'
  }

  if (now > validUntil) {
    return '만료'
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return '한도 도달'
  }

  return '활성'
}

/**
 * 쿠폰 잔여 사용 가능 횟수
 */
export function getRemainingUsage(coupon: Coupon): number | null {
  if (!coupon.usageLimit) {
    return null // 무제한
  }

  return Math.max(0, coupon.usageLimit - coupon.usedCount)
}
