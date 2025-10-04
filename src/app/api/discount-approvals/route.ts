import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const requestedBy = searchParams.get('requestedBy')

    let where: any = {}
    if (status) {
      where.status = status
    }
    if (requestedBy) {
      where.requestedBy = requestedBy
    }

    const requests = await prisma.discountApprovalRequest.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            discountType: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    })

    // JSON 파싱
    const formattedRequests = requests.map(request => ({
      ...request,
      appliedDiscounts: JSON.parse(request.appliedDiscounts),
      serviceDetails: JSON.parse(request.serviceDetails)
    }))

    return NextResponse.json(formattedRequests)
  } catch (error) {
    console.error('할인 승인 요청 조회 오류:', error)
    return NextResponse.json(
      { error: '할인 승인 요청을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const {
      customerId,
      serviceDetails,
      appliedDiscounts,
      originalAmount,
      discountAmount,
      finalAmount,
      conflictReason,
      staffNote,
      requestedBy
    } = data

    if (!customerId || !conflictReason || !requestedBy) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const approvalRequest = await prisma.discountApprovalRequest.create({
      data: {
        customerId,
        serviceDetails: JSON.stringify(serviceDetails),
        appliedDiscounts: JSON.stringify(appliedDiscounts),
        originalAmount,
        discountAmount,
        finalAmount,
        conflictReason,
        staffNote,
        requestedBy,
        discountType: 'MULTIPLE', // 기본값
        status: 'PENDING'
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

    return NextResponse.json({
      ...approvalRequest,
      appliedDiscounts: JSON.parse(approvalRequest.appliedDiscounts),
      serviceDetails: JSON.parse(approvalRequest.serviceDetails)
    })
  } catch (error) {
    console.error('할인 승인 요청 생성 오류:', error)
    return NextResponse.json(
      { error: '할인 승인 요청을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}