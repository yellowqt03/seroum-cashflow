import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { OrdersGrid } from '@/components/orders/OrdersGrid'

export default function OrdersPage() {
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
                주문 관리
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-slate-900 transition-colors">
                대시보드
              </Link>
              <Link href="/services" className="text-gray-600 hover:text-slate-900 transition-colors">
                서비스 관리
              </Link>
              <Link href="/customers" className="text-gray-600 hover:text-slate-900 transition-colors">
                고객 관리
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">주문 관리</h2>
          <p className="text-gray-600">
            고객 주문을 접수하고 진행 상황을 관리하며 할인이 자동으로 적용됩니다.
          </p>
        </div>

        <Suspense fallback={
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-4 text-gray-600">주문 정보를 불러오는 중...</div>
          </div>
        }>
          <OrdersGrid />
        </Suspense>
      </main>
    </div>
  )
}