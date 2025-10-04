# 할인 승인 시스템 테스트 가이드

## 구현 완료 사항 ✅

### 1. API 엔드포인트
- `POST /api/discount-approvals` - 승인 요청 생성
- `GET /api/discount-approvals` - 승인 요청 목록 조회
- `PUT /api/discount-approvals/[id]` - 승인/거부 처리
- `DELETE /api/discount-approvals/[id]` - 승인 요청 삭제

### 2. 승인 처리 로직 (PUT API)

#### 승인(APPROVED) 시 자동 처리:
1. ✅ 승인 요청 상태를 'APPROVED'로 업데이트
2. ✅ 실제 주문(Order) 생성
3. ✅ 주문 항목(OrderItem) 생성
4. ✅ 추가구성 옵션(OrderAddOn) 생성 (있는 경우)
5. ✅ 생일자 할인 사용 횟수 업데이트 (해당되는 경우)
6. ✅ 승인 요청에 주문 ID 연결
7. ✅ 트랜잭션으로 모든 작업 원자성 보장

#### 거부(REJECTED) 시:
1. ✅ 승인 요청 상태를 'REJECTED'로 업데이트
2. ✅ 관리자 메모 저장
3. ✅ 주문은 생성되지 않음

### 3. 데이터 무결성 보장
- ✅ Prisma 트랜잭션으로 모든 DB 작업 원자성 보장
- ✅ 승인 시 서비스 존재 여부 검증
- ✅ 생일자 할인 연간 한도 자동 업데이트
- ✅ 에러 발생 시 롤백 처리

## 테스트 시나리오

### 시나리오 1: 패키지 + 생일자 할인 승인
```json
// 1. POST /api/discount-approvals 요청
{
  "customerId": "customer_id",
  "serviceDetails": {
    "serviceName": "프리미엄회복",
    "packageType": "package8",
    "quantity": 1,
    "addOns": []
  },
  "appliedDiscounts": {
    "vipDiscount": 0,
    "birthdayDiscount": 384000,
    "employeeDiscount": 0,
    "packageDiscount": 192000,
    "addOnDiscount": 0
  },
  "originalAmount": 960000,
  "discountAmount": 576000,
  "finalAmount": 384000,
  "conflictReason": "패키지 할인과 생일자 할인 중복 적용",
  "staffNote": "고객 요청으로 중복 할인 승인 요청",
  "requestedBy": "김직원"
}

// 2. PUT /api/discount-approvals/[id] 승인
{
  "status": "APPROVED",
  "approvedBy": "관리자",
  "adminNote": "특별 승인"
}

// 예상 결과:
// - 승인 요청 상태: APPROVED
// - 주문 생성됨 (finalAmount: 384,000원)
// - 생일자 할인 사용 횟수 +1
```

### 시나리오 2: VIP 무료 서비스 승인
```json
// 1. 승인 요청 생성
{
  "customerId": "vip_customer_id",
  "serviceDetails": {
    "serviceName": "VIP혈관청소",
    "packageType": "single",
    "quantity": 1,
    "addOns": []
  },
  "appliedDiscounts": {
    "vipDiscount": 150000,
    "birthdayDiscount": 0,
    "employeeDiscount": 0,
    "packageDiscount": 0,
    "addOnDiscount": 0
  },
  "originalAmount": 150000,
  "discountAmount": 150000,
  "finalAmount": 0,
  "conflictReason": "VIP 100% 무료 서비스",
  "requestedBy": "김직원"
}

// 2. 승인 처리
// 예상 결과:
// - 주문 생성됨 (finalAmount: 0원)
// - VIP 고객 할인 기록 유지
```

### 시나리오 3: 거부 처리
```json
// PUT /api/discount-approvals/[id]
{
  "status": "REJECTED",
  "approvedBy": "관리자",
  "adminNote": "할인 정책 위반으로 거부"
}

// 예상 결과:
// - 승인 요청 상태: REJECTED
// - 주문 생성 안됨
// - 거부 사유 저장됨
```

## UI 통합 테스트

### 승인 페이지 (/approvals)
1. ✅ 승인 요청 목록 표시
2. ✅ 상태별 필터링 (전체/대기/승인/거부)
3. ✅ 통계 카드 (전체/대기/승인/거부 수)
4. ✅ 승인 버튼 클릭 → API 호출 → 목록 새로고침
5. ✅ 거부 버튼 클릭 → 사유 입력 → API 호출 → 목록 새로고침

### 테스트 방법
1. 개발 서버 실행: `npm run dev` (Node.js 18.18+ 필요)
2. 브라우저에서 `/approvals` 접속
3. 승인 대기 중인 요청 확인
4. 승인/거부 버튼 클릭하여 테스트
5. 주문 목록(`/orders`)에서 생성된 주문 확인

## 핵심 개선 사항

### Before (기존)
```typescript
// TODO: 실제 주문 생성 또는 할인 적용 로직
console.log('할인 승인됨:', approvalRequest.id)
```

### After (완성)
```typescript
// 트랜잭션으로 승인 처리 및 주문 생성
const result = await prisma.$transaction(async (tx) => {
  // 1. 승인 요청 상태 업데이트
  // 2. 주문 생성
  // 3. 주문 항목 생성
  // 4. 추가구성 옵션 생성
  // 5. 생일자 할인 사용 횟수 업데이트
  // 6. 승인 요청에 주문 ID 연결
  return { approval: updated, order }
})
```

## 다음 단계 권장사항

### Phase 2 우선순위
1. **쿠폰 관리 시스템** (스키마 완료, UI 구현 필요)
2. **매출 리포팅 상세 분석** (Excel/PDF 다운로드)
3. **알림 시스템** (할인 한도 초과, 승인 대기 알림)

### 개선 제안
1. 승인 권한 관리 (관리자/직원 역할 구분)
2. 승인 요청 시 결제 방법 선택 가능하도록 개선
3. 승인 이력 감사 로그 추가
4. 일괄 승인/거부 기능
