import { redirect } from 'next/navigation'
import { getSession, isStaff } from '@/lib/auth'
import Link from 'next/link'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { Settings, Users, FileText, User } from 'lucide-react'

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
      description: '수액/주사 서비스 조회'
    },
    {
      href: '/customers',
      icon: Users,
      title: '고객 관리',
      description: '고객 등록 및 조회'
    },
    {
      href: '/orders',
      icon: FileText,
      title: '주문 접수',
      description: '주문 접수 및 처리'
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
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-md flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  직원 대시보드
                </h1>
                <p className="text-xs text-slate-600">
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
        {/* 기능 카드 */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">주요 기능</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

        {/* 빠른 작업 가이드 */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            빠른 작업 가이드
          </h3>
          <div className="space-y-3">
            {quickGuide.map((guide) => (
              <div
                key={guide.step}
                className="flex items-start gap-3 p-3 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{guide.step}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">{guide.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{guide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 직원 권한 안내 */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-md flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">직원 권한</h3>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                서비스 조회, 고객 관리, 주문 접수 기능을 사용할 수 있습니다.
              </p>
              <div className="bg-slate-50 rounded-md border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-900 mb-2">제한된 기능:</p>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                    매출 리포트 조회 (관리자 전용)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                    쿠폰 생성 및 관리 (관리자 전용)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                    할인 승인 처리 (관리자 전용)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                    특이사항 관리 (관리자 전용)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-400"></span>
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
