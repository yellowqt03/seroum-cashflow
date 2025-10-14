import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CustomersGrid } from '@/components/customers/CustomersGrid'

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  홈으로
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                고객 관리
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-slate-900 transition-colors">
                대시보드
              </Link>
              <Link href="/services" className="text-gray-600 hover:text-slate-900 transition-colors">
                서비스 관리
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">고객 관리</h2>
          <p className="text-gray-600">
            VIP, 생일자, 직원 할인 고객을 체계적으로 관리하고 할인 혜택을 추적하세요.
          </p>
        </div>

        <Suspense fallback={
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-4 text-gray-600">고객 정보를 불러오는 중...</div>
          </div>
        }>
          <CustomersGrid />
        </Suspense>
      </main>
    </div>
  )
}