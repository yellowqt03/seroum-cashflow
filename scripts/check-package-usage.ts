import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPackageUsage() {
  console.log('=== 패키지 사용 이력 확인 ===\n')

  // 모든 패키지 사용 이력 조회
  const usages = await prisma.packageUsage.findMany({
    include: {
      packagePurchase: {
        include: {
          customer: { select: { name: true } },
          service: { select: { name: true } }
        }
      },
      order: { select: { id: true, status: true } }
    },
    orderBy: { usedAt: 'desc' }
  })

  console.log(`총 ${usages.length}개의 패키지 사용 이력\n`)

  if (usages.length === 0) {
    console.log('⚠️  패키지 사용 이력이 없습니다!\n')
  } else {
    usages.forEach(usage => {
      console.log(`- 고객: ${usage.packagePurchase.customer.name}`)
      console.log(`  서비스: ${usage.packagePurchase.service.name}`)
      console.log(`  사용 횟수: ${usage.usedCount}회`)
      console.log(`  주문 상태: ${usage.order.status}`)
      console.log(`  사용일: ${usage.usedAt.toLocaleDateString('ko-KR')}`)
      console.log('')
    })
  }

  console.log('\n=== 고객별 패키지 현황 ===\n')

  const packages = await prisma.packagePurchase.findMany({
    include: {
      customer: { select: { name: true } },
      service: { select: { name: true } },
      packageUsages: true
    },
    orderBy: [
      { customer: { name: 'asc' } },
      { service: { name: 'asc' } }
    ]
  })

  let currentCustomer = ''
  packages.forEach(pkg => {
    if (currentCustomer !== pkg.customer.name) {
      currentCustomer = pkg.customer.name
      console.log(`\n📋 ${currentCustomer}`)
      console.log('─'.repeat(50))
    }
    console.log(`  • ${pkg.service.name} (${pkg.packageType})`)
    console.log(`    남은: ${pkg.remainingCount}회 / 총: ${pkg.totalCount}회`)
    console.log(`    사용 이력: ${pkg.packageUsages.length}건`)
    console.log(`    상태: ${pkg.status}`)
  })

  console.log('\n\n=== 최근 완료된 주문 ===\n')

  const recentOrders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED'
    },
    include: {
      customer: { select: { name: true } },
      orderItems: {
        include: { service: { select: { name: true } } }
      }
    },
    orderBy: { completedAt: 'desc' },
    take: 5
  })

  recentOrders.forEach(order => {
    console.log(`주문 ID: ${order.id}`)
    console.log(`고객: ${order.customer.name}`)
    console.log(`완료일: ${order.completedAt?.toLocaleString('ko-KR')}`)
    order.orderItems.forEach(item => {
      const isPackage = item.packageType && item.packageType !== 'single'
      console.log(`  - ${item.service.name} (packageType: ${item.packageType || 'null'}) ${isPackage ? '📦 패키지 구매' : '일반 주문'}`)
    })
    console.log('')
  })

  await prisma.$disconnect()
}

checkPackageUsage()
  .catch(console.error)
  .finally(() => process.exit(0))
