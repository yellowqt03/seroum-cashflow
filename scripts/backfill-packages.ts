/**
 * 기존 완료된 주문에 대해 누락된 패키지 구매 기록을 소급 생성하는 스크립트
 *
 * 실행 방법:
 * npx tsx scripts/backfill-packages.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfillPackages() {
  console.log('🔍 누락된 패키지 구매 기록을 찾는 중...\n')

  try {
    // 모든 완료된 주문 조회
    const completedOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        completedAt: 'asc'
      }
    })

    console.log(`총 ${completedOrders.length}개의 완료된 주문을 찾았습니다.\n`)

    let createdCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const order of completedOrders) {
      for (const orderItem of order.orderItems) {
        // 패키지 구매인 경우 체크
        const isPackagePurchase = orderItem.packageType &&
          (orderItem.packageType.toLowerCase().startsWith('package') &&
           orderItem.packageType !== 'single')

        if (!isPackagePurchase) {
          continue
        }

        // 패키지 횟수 추출
        let packageCount = 0
        if (orderItem.packageType!.includes('_')) {
          // PACKAGE_10 형식
          packageCount = parseInt(orderItem.packageType!.split('_')[1])
        } else {
          // package4, package8 형식
          packageCount = parseInt(orderItem.packageType!.replace(/\D/g, ''))
        }

        if (packageCount <= 0) {
          console.log(`⚠️  주문 ${order.id}: 유효하지 않은 packageCount (${orderItem.packageType})`)
          errorCount++
          continue
        }

        // 이미 패키지 구매 기록이 있는지 확인
        const existingPackages = await prisma.packagePurchase.findMany({
          where: {
            orderId: order.id,
            customerId: order.customerId,
            serviceId: orderItem.serviceId
          }
        })

        const expectedPackageCount = orderItem.quantity
        const actualPackageCount = existingPackages.length

        if (actualPackageCount >= expectedPackageCount) {
          // 이미 충분한 패키지가 있음
          skippedCount++
          continue
        }

        // 누락된 패키지 생성
        const missingCount = expectedPackageCount - actualPackageCount

        console.log(`✅ 주문 ${order.id} (고객: ${order.customer.name})`)
        console.log(`   서비스: ${orderItem.service.name}`)
        console.log(`   패키지 타입: ${orderItem.packageType}`)
        console.log(`   생성할 패키지 수: ${missingCount}개 (${packageCount}회 × ${missingCount})`)

        for (let i = 0; i < missingCount; i++) {
          try {
            await prisma.packagePurchase.create({
              data: {
                orderId: order.id,
                customerId: order.customerId,
                serviceId: orderItem.serviceId,
                packageType: orderItem.packageType,
                totalCount: packageCount,
                remainingCount: packageCount,
                purchasePrice: orderItem.totalPrice / orderItem.quantity,
                purchasedAt: order.completedAt || order.orderDate,
                status: 'ACTIVE'
              }
            })
            createdCount++
          } catch (error) {
            console.error(`   ❌ 패키지 생성 실패:`, error)
            errorCount++
          }
        }
        console.log('')
      }
    }

    console.log('\n========================================')
    console.log('📊 소급 생성 결과:')
    console.log(`   - 생성된 패키지: ${createdCount}개`)
    console.log(`   - 건너뛴 주문 항목: ${skippedCount}개`)
    console.log(`   - 오류: ${errorCount}개`)
    console.log('========================================\n')

    // 생성된 패키지 확인
    if (createdCount > 0) {
      console.log('📦 생성된 패키지 목록:\n')
      const allPackages = await prisma.packagePurchase.findMany({
        include: {
          customer: { select: { name: true } },
          service: { select: { name: true } }
        },
        orderBy: {
          purchasedAt: 'desc'
        }
      })

      allPackages.forEach(pkg => {
        console.log(`- ${pkg.customer.name}: ${pkg.service.name} ${pkg.packageType} (${pkg.remainingCount}/${pkg.totalCount}회)`)
      })
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
backfillPackages()
  .then(() => {
    console.log('\n✅ 소급 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 소급 생성 실패:', error)
    process.exit(1)
  })
