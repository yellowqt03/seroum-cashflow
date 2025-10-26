'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { Settings, Users, FileText, BarChart3, ShieldCheck, UserCog, Ticket, CheckCircle, StickyNote } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface DashboardStats {
  todayRevenue: number
  todayOrderCount: number
  totalCustomers: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayOrderCount: 0,
    totalCustomers: 0
  })
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  const checkAuthAndFetchData = async () => {
    try {
      // 세션 확인
      const sessionRes = await fetch('/api/auth/session')
      if (!sessionRes.ok) {
        router.push('/login')
        return
      }

      const user = await sessionRes.json()
      if (user.role !== 'ADMIN') {
        router.push('/staff/dashboard')
        return
      }

      setUserName(user.name)

      // 통계 데이터 가져오기
      const statsRes = await fetch('/api/dashboard/stats')
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (error) {
      console.error('데이터 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    {
      href: '/services',
      icon: Settings,
      title: '서비스 관리',
      description: '38개 수액/주사 서비스'
    },
    {
      href: '/customers',
      icon: Users,
      title: '고객 관리',
      description: 'VIP 및 할인 고객'
    },
    {
      href: '/orders',
      icon: FileText,
      title: '주문 관리',
      description: '주문 접수 및 처리'
    },
    {
      href: '/reports',
      icon: BarChart3,
      title: '매출 리포트',
      description: '분석 및 통계'
    },
    {
      href: '/coupons',
      icon: Ticket,
      title: '쿠폰 관리',
      description: '할인 쿠폰 생성'
    },
    {
      href: '/approvals',
      icon: CheckCircle,
      title: '할인 승인',
      description: '중복 할인 요청'
    },
    {
      href: '/notes',
      icon: StickyNote,
      title: '특이사항',
      description: '월별 특이사항 기록'
    },
    {
      href: '/users',
      icon: UserCog,
      title: '직원 관리',
      description: '계정 생성 및 관리'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-md flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  관리자 대시보드
                </h1>
                <p className="text-xs text-slate-600">
                  {userName}님 환영합니다
                </p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">오늘 매출</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {loading ? (
                    <span className="inline-block w-24 h-8 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    formatPrice(stats.todayRevenue)
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">오늘 주문</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {loading ? (
                    <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    `${stats.todayOrderCount}건`
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center">
                <FileText className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">전체 고객</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {loading ? (
                    <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    `${stats.totalCustomers}명`
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center">
                <Users className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 기능 카드 그리드 */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">전체 기능</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:border-slate-300 transition-colors"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5 text-slate-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600">{item.description}</p>
            </Link>
          ))}
        </div>

        {/* 관리자 권한 안내 */}
        <div className="mt-8 bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-md flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">관리자 권한</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                모든 기능에 대한 전체 접근 권한이 있습니다. 할인 승인, 쿠폰 관리, 리포트, 직원 계정 관리 등
                모든 관리 기능을 사용할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
