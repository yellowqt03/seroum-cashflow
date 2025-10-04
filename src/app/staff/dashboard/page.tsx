import { redirect } from 'next/navigation'
import { getSession, isStaff } from '@/lib/auth'
import Link from 'next/link'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { Settings, Users, FileText, User, Activity, Clock } from 'lucide-react'

export default async function StaffDashboard() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!isStaff(user)) {
    redirect('/admin/dashboard')
  }

  const menuItems = [
    {
      href: '/services',
      icon: Settings,
      title: '서비스 조회',
      description: '수액/주사 서비스 조회',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      href: '/customers',
      icon: Users,
      title: '고객 관리',
      description: '고객 등록 및 조회',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      href: '/orders',
      icon: FileText,
      title: '주문 접수',
      description: '주문 접수 및 처리',
      gradient: 'from-purple-500 to-pink-500'
    }
  ]

  const quickGuide = [
    {
      step: '1',
      title: '신규 고객 등록',
      description: '고객 관리 → 새 고객 추가 버튼 클릭'
    },
    {
      step: '2',
      title: '주문 접수',
      description: '주문 관리 → 새 주문 → 고객/서비스 선택'
    },
    {
      step: '3',
      title: '서비스 조회',
      description: '서비스 조회 → 카테고리 및 검색'
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
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-green-600 to-teal-600 p-2 rounded-xl">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  직원 대시보드
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {user.name}님 환영합니다
                </p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 정보 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">오늘 처리한 주문</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">0건</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">근무 시간</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">--:--</p>
              </div>
            </div>
          </div>
        </div>

        {/* 기능 카드 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-teal-600 rounded-full"></div>
            주요 기능
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
          {menuItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="glass-card rounded-2xl p-8 border border-white/20 card-hover h-full">
                <div className="relative mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                  <div className={`relative w-16 h-16 bg-gradient-to-r ${item.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* 빠른 작업 가이드 */}
        <div className="glass-card rounded-2xl p-6 border border-white/20 mb-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            빠른 작업 가이드
          </h3>
          <div className="space-y-4">
            {quickGuide.map((guide, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50/30 hover:from-blue-50 hover:to-purple-50/30 transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{guide.step}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">{guide.title}</p>
                  <p className="text-sm text-gray-600">{guide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 직원 권한 안내 */}
        <div className="glass-card rounded-2xl p-6 border border-green-200/50 bg-gradient-to-r from-green-50/50 to-teal-50/50 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">직원 권한</h3>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                서비스 조회, 고객 관리, 주문 접수 기능을 사용할 수 있습니다.
              </p>
              <div className="glass-card rounded-xl p-4 border border-green-200/50 bg-white/50">
                <p className="text-sm font-semibold text-gray-800 mb-2">제한된 기능:</p>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    매출 리포트 조회 (관리자 전용)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    쿠폰 생성 및 관리 (관리자 전용)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    할인 승인 처리 (관리자 전용)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    특이사항 관리 (관리자 전용)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    직원 계정 관리 (관리자 전용)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
