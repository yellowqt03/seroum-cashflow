import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Users, ShoppingBag, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  홈으로
                </Button>
              </Link>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                운영 대시보드
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/services" className="text-gray-600 hover:text-slate-900 transition-colors">
                서비스 관리
              </Link>
              <Link href="/customers" className="text-gray-600 hover:text-slate-900 transition-colors">
                고객 관리
              </Link>
              <Link href="/orders" className="text-gray-600 hover:text-slate-900 transition-colors">
                주문 관리
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            세로움 수액센터 운영 현황
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            실시간 매출, 고객, 주문 현황을 한눈에 확인하고 효율적인 운영을 지원합니다.
          </p>
        </div>

        {/* 빠른 액션 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/orders" className="group">
            <div className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-all group-hover:scale-105">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">새 주문</h3>
                  <p className="text-sm text-gray-600">주문 접수</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/customers" className="group">
            <div className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-all group-hover:scale-105">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">고객 등록</h3>
                  <p className="text-sm text-gray-600">새 고객 추가</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/services" className="group">
            <div className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-all group-hover:scale-105">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">서비스 관리</h3>
                  <p className="text-sm text-gray-600">가격 및 패키지</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/reports" className="group">
            <div className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-all group-hover:scale-105">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Settings className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">매출 리포트</h3>
                  <p className="text-sm text-gray-600">분석 및 통계</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 대시보드 데이터 */}
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-4 text-gray-600">대시보드 데이터를 불러오는 중...</div>
          </div>
        }>
          <DashboardOverview />
        </Suspense>
      </main>
    </div>
  )
}