import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Excel 파일 업로드 및 매출 데이터 저장 API
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { salesData } = data

    if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
      return NextResponse.json(
        { error: '업로드할 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    const results = {
      total: salesData.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // 트랜잭션으로 모든 데이터 저장
    for (const item of salesData) {
      try {
        // 1. 서비스 찾기 (이름으로)
        let service = await prisma.service.findFirst({
          where: { name: item.serviceName }
        })

        if (!service) {
          // 서비스가 없으면 건너뛰고 에러 기록
          results.failed++
          results.errors.push(`서비스를 찾을 수 없습니다: ${item.serviceName}`)
          continue
        }

        // 2. 고객 찾기 또는 생성 (이름이 있는 경우)
        let customer
        if (item.customerName) {
          customer = await prisma.customer.findFirst({
            where: { name: item.customerName }
          })

          if (!customer) {
            // 고객이 없으면 생성
            customer = await prisma.customer.create({
              data: {
                name: item.customerName,
                discountType: 'REGULAR',
                source: 'SEARCH' // 기본값
              }
            })
          }
        } else {
          // 고객 정보가 없으면 "업로드 고객" 생성
          customer = await prisma.customer.upsert({
            where: { phone: 'EXCEL_UPLOAD' },
            update: {},
            create: {
              name: '엑셀 업로드',
              phone: 'EXCEL_UPLOAD',
              discountType: 'REGULAR',
              source: 'SEARCH'
            }
          })
        }

        // 3. 날짜 파싱
        const orderDate = new Date(item.date)
        if (isNaN(orderDate.getTime())) {
          results.failed++
          results.errors.push(`날짜 형식 오류: ${item.date}`)
          continue
        }

        // 4. 주문 생성
        const order = await prisma.order.create({
          data: {
            customerId: customer.id,
            status: 'COMPLETED', // 업로드된 데이터는 완료된 주문으로 간주
            paymentMethod: item.paymentMethod || 'CARD',
            subtotal: item.totalPrice,
            discountAmount: 0,
            finalAmount: item.totalPrice,
            notes: item.notes || '엑셀 업로드',
            orderDate: orderDate,
            completedAt: orderDate
          }
        })

        // 5. 주문 항목 생성
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            serviceId: service.id,
            quantity: item.quantity,
            packageType: 'single',
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }
        })

        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`${item.serviceName}: ${error.message}`)
        console.error('데이터 저장 오류:', error)
      }
    }

    return NextResponse.json({
      message: '업로드 완료',
      results
    })
  } catch (error) {
    console.error('매출 데이터 업로드 오류:', error)
    return NextResponse.json(
      { error: '매출 데이터 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
