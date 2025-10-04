import { redirect } from 'next/navigation'
import { getSession, isAdmin } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { LogOut, Settings, Users, FileText, BarChart3, ShieldCheck, UserCog, Ticket, CheckCircle, StickyNote, TrendingUp, Activity } from 'lucide-react'

export default async function AdminDashboard() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!isAdmin(user)) {
    redirect('/staff/dashboard')
  }

  const menuItems = [
    {
      href: '/services',
      icon: Settings,
      title: '서비스 관리',
      description: '38개 수액/주사 서비스',
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      href: '/customers',
      icon: Users,
      title: '고객 관리',
      description: 'VIP 및 할인 고객',
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      href: '/orders',
      icon: FileText,
      title: '주문 관리',
      description: '주문 접수 및 처리',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      href: '/reports',
      icon: BarChart3,
      title: '매출 리포트',
      description: '분석 및 통계',
      color: 'indigo',
      gradient: 'from-indigo-500 to-blue-500'
    },
    {
      href: '/coupons',
      icon: Ticket,
      title: '쿠폰 관리',
      description: '할인 쿠폰 생성',
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      href: '/approvals',
      icon: CheckCircle,
      title: '할인 승인',
      description: '중복 할인 요청',
      color: 'red',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      href: '/notes',
      icon: StickyNote,
      title: '특이사항',
      description: '월별 특이사항 기록',
      color: 'orange',
      gradient: 'from-orange-500 to-amber-500'
    },
    {
      href: '/users',
      icon: UserCog,
      title: '직원 관리',
      description: '계정 생성 및 관리',
      color: 'teal',
      gradient: 'from-teal-500 to-cyan-500'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="glass-card border-b sticky top-0 z-50 backdrop-blur-lg bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  관리자 대시보드
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {user.name}님 환영합니다
                </p>
              </div>
            </div>
            <form action="/api/auth/logout" method="POST">
              <Button variant="outline" size="sm" className="group">
                <LogOut className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                로그아웃
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">오늘 매출</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0원</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3" />
                  전일 대비 0%
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">오늘 주문</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0건</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-2">
                  <Activity className="h-3 w-3" />
                  실시간 업데이트
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">전체 고객</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0명</p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-2">
                  <Users className="h-3 w-3" />
                  VIP 0명 포함
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* 기능 카드 그리드 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            전체 기능
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          {menuItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="glass-card rounded-2xl p-6 border border-white/20 card-hover h-full">
                <div className="relative mb-4">
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                  <div className={`relative w-14 h-14 bg-gradient-to-r ${item.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* 관리자 권한 안내 */}
        <div className="mt-8 glass-card rounded-2xl p-6 border border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">관리자 권한</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
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
