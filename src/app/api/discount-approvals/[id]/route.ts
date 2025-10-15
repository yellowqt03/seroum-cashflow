import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const { status, approvedBy, adminNote } = data

    if (!status || !approvedBy) {
      return NextResponse.json(
        { error: '승인 상태와 승인자는 필수입니다.' },
        { status: 400 }
      )
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 승인 상태입니다.' },
        { status: 400 }
      )
    }

    // 승인 요청 조회
    const approvalRequest = await prisma.discountApprovalRequest.findUnique({
      where: { id },
      include: {
        customer: true
      }
    })

    if (!approvalRequest) {
      return NextResponse.json(
        { error: '승인 요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 트랜잭션으로 승인 처리 및 주문 생성
    const result = await prisma.$transaction(async (tx) => {
      // 승인 요청 상태 업데이트
      const updated = await tx.discountApprovalRequest.update({
        where: { id },
        data: {
          status,
          approvedBy,
          adminNote,
          approvedAt: new Date()
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              discountType: true
            }
          }
        }
      })

      // 승인된 경우 실제 주문 생성
      if (status === 'APPROVED') {
        const serviceDetails = JSON.parse(approvalRequest.serviceDetails)
        const appliedDiscounts = JSON.parse(approvalRequest.appliedDiscounts)

        // 서비스 정보 조회
        const service = await tx.service.findFirst({
          where: { name: serviceDetails.serviceName }
        })

        if (!service) {
          throw new Error('서비스를 찾을 수 없습니다.')
        }

        // 주문 생성
        const order = await tx.order.create({
          data: {
            customerId: approvalRequest.customerId,
            status: 'PENDING',
            paymentMethod: 'CARD', // 기본값, 실제로는 요청에서 받아야 함
            subtotal: approvalRequest.originalAmount,
            discountAmount: approvalRequest.discountAmount,
            finalAmount: approvalRequest.finalAmount,
            appliedDiscountType: approvalRequest.discountType,
            discountRate: approvalRequest.originalAmount > 0
              ? approvalRequest.discountAmount / approvalRequest.originalAmount
              : 0,
            notes: `중복할인 승인됨 (승인자: ${approvedBy})`
          }
        })

        // 주문 항목 생성
        const unitPrice = Math.floor(approvalRequest.finalAmount / serviceDetails.quantity)
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            serviceId: service.id,
            quantity: serviceDetails.quantity,
            packageType: serviceDetails.packageType || 'single',
            unitPrice: unitPrice,
            totalPrice: approvalRequest.finalAmount
          }
        })

        // 추가구성 옵션 생성 (있는 경우)
        if (serviceDetails.addOns && serviceDetails.addOns.length > 0) {
          for (const addOn of serviceDetails.addOns) {
            const addOnOption = await tx.addOnOption.findFirst({
              where: { name: addOn.name }
            })

            if (addOnOption) {
              await tx.orderAddOn.create({
                data: {
                  orderId: order.id,
                  addOnId: addOnOption.id,
                  quantity: addOn.quantity || 1,
                  unitPrice: addOnOption.price,
                  totalPrice: addOnOption.price * (addOn.quantity || 1)
                }
              })
            }
          }
        }

        // 생일자 할인 사용 횟수 업데이트
        if (approvalRequest.customer.discountType === 'BIRTHDAY' &&
            appliedDiscounts.birthdayDiscount > 0 &&
            ['프리미엄회복', '프리미엄면역'].includes(serviceDetails.serviceName)) {

          const currentYear = new Date().getFullYear()
          const currentCount = approvalRequest.customer.birthdayDiscountYear === currentYear
            ? approvalRequest.customer.birthdayUsedCount
            : 0

          await tx.customer.update({
            where: { id: approvalRequest.customerId },
            data: {
              birthdayDiscountYear: currentYear,
              birthdayUsedCount: currentCount + serviceDetails.quantity
            }
          })
        }

        // 승인 요청에 주문 ID 연결
        await tx.discountApprovalRequest.update({
          where: { id },
          data: { orderId: order.id }
        })

        return { approval: updated, order }
      }

      return { approval: updated, order: null }
    })

    return NextResponse.json({
      ...result.approval,
      appliedDiscounts: JSON.parse(result.approval.appliedDiscounts),
      serviceDetails: JSON.parse(result.approval.serviceDetails),
      order: result.order
    })
  } catch {
    console.error('할인 승인 처리 오류:', error)
    return NextResponse.json(
      { error: '할인 승인을 처리하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.discountApprovalRequest.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch {
    console.error('할인 승인 요청 삭제 오류:', error)
    return NextResponse.json(
      { error: '할인 승인 요청을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}