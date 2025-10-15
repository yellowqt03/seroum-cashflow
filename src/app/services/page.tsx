import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ServicesGrid } from '@/components/services/ServicesGrid'

export default function ServicesPage() {
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
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900">
                서비스 관리
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                대시보드
              </Link>
              <Link href="/customers" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                고객 관리
              </Link>
              <Link href="/orders" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                주문 관리
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 mb-2">서비스 카탈로그</h2>
          <p className="text-sm md:text-base text-slate-600">
            세로움 수액센터의 모든 서비스를 관리하고 가격 정보를 확인하세요.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-8">서비스 정보를 불러오는 중...</div>}>
          <ServicesGrid />
        </Suspense>
      </main>
    </div>
  )
}