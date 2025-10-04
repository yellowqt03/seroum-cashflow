# 세로움 캐시플로우 - Vercel 배포 가이드

## 사전 준비

1. **Vercel 계정** 생성: https://vercel.com/signup
2. **GitHub 계정** (선택사항 - GitHub 연동 배포 시)

## 배포 방법 1: Vercel 웹 대시보드 (권장)

### 1단계: GitHub에 코드 푸시
```bash
# Git 저장소 초기화 (아직 안했다면)
git init
git add .
git commit -m "Initial commit: Seroum Cashflow Management System"

# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/seroum-cashflow.git
git push -u origin main
```

### 2단계: Vercel에서 프로젝트 Import
1. https://vercel.com/new 접속
2. "Import Git Repository" 선택
3. GitHub 저장소 연결
4. 프로젝트 선택: `seroum-cashflow`

### 3단계: 환경 변수 설정
**Environment Variables** 섹션에서 다음을 추가:

```
DATABASE_URL = postgresql://postgres.xmvkoyksffbzlttwpsma:gmlakd0327!@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_APP_NAME = 세로움 캐시플로우
NEXT_PUBLIC_APP_VERSION = 1.0.0
```

### 4단계: Deploy 클릭
- Framework Preset: **Next.js** (자동 감지됨)
- Build Command: `prisma generate && next build` (자동 설정됨)
- Output Directory: `.next` (자동)
- Install Command: `npm install` (자동)

배포가 완료되면 Vercel이 자동으로 URL을 생성합니다!

---

## 배포 방법 2: Vercel CLI

### 1단계: Vercel CLI 설치
```bash
npm install -g vercel
```

### 2단계: 로그인
```bash
vercel login
```

### 3단계: 배포
```bash
# 프로젝트 디렉토리에서
vercel

# 프로덕션 배포
vercel --prod
```

### 4단계: 환경 변수 설정
```bash
vercel env add DATABASE_URL production
# 값 입력: postgresql://postgres.xmvkoyksffbzlttwpsma:gmlakd0327!@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres

vercel env add NEXT_PUBLIC_APP_NAME production
# 값 입력: 세로움 캐시플로우

vercel env add NEXT_PUBLIC_APP_VERSION production
# 값 입력: 1.0.0
```

### 5단계: 재배포
```bash
vercel --prod
```

---

## 배포 후 확인사항

### ✅ 체크리스트
- [ ] 로그인 페이지가 정상적으로 로드됨
- [ ] 관리자 로그인 (admin@seroum.com / admin1234)
- [ ] 직원 로그인 (staff@seroum.com / staff1234)
- [ ] 데이터베이스 연결 확인
- [ ] 각 페이지 정상 작동 확인
  - [ ] 관리자 대시보드
  - [ ] 직원 대시보드
  - [ ] 서비스 관리
  - [ ] 고객 관리
  - [ ] 주문 관리
  - [ ] 쿠폰 관리
  - [ ] 할인 승인
  - [ ] 특이사항 관리
  - [ ] 직원 관리
  - [ ] 매출 리포트

---

## 주요 설정 파일

### `vercel.json`
```json
{
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev --turbopack",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["icn1"]
}
```

### `package.json` (scripts 섹션)
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

---

## 트러블슈팅

### 빌드 오류: "prisma.user is undefined"
**해결**: `postinstall` 스크립트가 `package.json`에 있는지 확인
```json
"postinstall": "prisma generate"
```

### 데이터베이스 연결 오류
**해결**:
1. Vercel 대시보드에서 환경 변수 확인
2. Supabase 연결 풀링 URL 사용 확인
3. DATABASE_URL이 정확한지 확인

### 페이지가 로딩되지 않음
**해결**:
1. Vercel 대시보드 → Deployments → Logs 확인
2. 빌드 로그에서 에러 확인
3. Runtime Logs에서 서버 에러 확인

---

## 도메인 연결 (선택사항)

### Custom Domain 추가
1. Vercel 프로젝트 → Settings → Domains
2. Add Domain 클릭
3. 도메인 입력 (예: cashflow.seroum.com)
4. DNS 레코드 추가 (Vercel이 안내)

---

## 자동 배포 설정

GitHub 연동 시 자동으로 설정됩니다:
- `main` 브랜치 푸시 → 프로덕션 배포
- PR 생성 → 프리뷰 배포
- Commit 푸시 → 자동 재배포

---

## 유용한 링크

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
- Prisma on Vercel: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel

---

## 지원

문제가 발생하면:
1. Vercel 대시보드에서 Logs 확인
2. GitHub Issues에 보고
3. Vercel Support에 문의: https://vercel.com/support
