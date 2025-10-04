import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📊 세로움 수액센터 통합관리시스템 - 데이터베이스 현황\n')
  console.log('=' . repeat(60))

  // 서비스 수
  const services = await prisma.service.count()
  console.log('📋 서비스:', services, '개')

  // 고객 수
  const customers = await prisma.customer.count()
  console.log('👥 고객:', customers, '명')

  // 주문 수
  const orders = await prisma.order.count()
  const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } })
  console.log('🛒 주문:', orders, '건 (완료:', completedOrders, '건)')

  // 쿠폰 수
  const coupons = await prisma.coupon.count()
  const activeCoupons = await prisma.coupon.count({ where: { isActive: true } })
  console.log('🎟️  쿠폰:', coupons, '개 (활성:', activeCoupons, '개)')

  // 특이사항 수
  const notes = await prisma.monthlyNote.count()
  console.log('📝 특이사항:', notes, '건')

  // 할인 승인 요청 수
  const approvals = await prisma.discountApprovalRequest.count()
  const pendingApprovals = await prisma.discountApprovalRequest.count({ where: { status: 'PENDING' } })
  console.log('🛡️  할인 승인 요청:', approvals, '건 (대기:', pendingApprovals, '건)')

  console.log('=' . repeat(60))
  console.log('\n✅ 데이터베이스가 정상적으로 작동하고 있습니다!')
  console.log('\n📍 Prisma Studio: http://localhost:5555')
  console.log('   (데이터베이스를 시각적으로 확인할 수 있습니다)')
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
