/**
 * Excel 파일 처리 유틸리티 (XLSX 라이브러리 사용)
 */
import * as XLSX from 'xlsx'

/**
 * Excel 파일을 읽어서 JSON 데이터로 변환
 */
export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })

        // 첫 번째 시트 읽기
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        resolve(jsonData)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsBinaryString(file)
  })
}

/**
 * JSON 데이터를 Excel 파일로 다운로드
 */
export function downloadExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  // 워크북 생성
  const workbook = XLSX.utils.book_new()

  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(data)

  // 워크북에 워크시트 추가
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // 파일 다운로드
  XLSX.writeFile(workbook, filename)
}

/**
 * 매출 리포트를 Excel로 다운로드
 */
export function exportSalesReportToExcel(reportData: any, filename: string) {
  const { salesByPeriod, totalStats, salesByCategory, discountStats } = reportData

  // 워크북 생성
  const workbook = XLSX.utils.book_new()

  // 1. 기간별 매출 시트
  const salesSheet = XLSX.utils.json_to_sheet(
    salesByPeriod.map((item: any) => ({
      '기간': item.period,
      '총 매출': item.totalSales,
      '할인 금액': item.totalDiscount,
      '순 매출': item.netSales,
      '주문 수': item.orderCount,
      '고객 수': item.customerCount,
      '평균 주문액': item.avgOrderAmount
    }))
  )
  XLSX.utils.book_append_sheet(workbook, salesSheet, '기간별 매출')

  // 2. 전체 통계 시트
  const statsSheet = XLSX.utils.json_to_sheet([
    {
      '항목': '총 매출',
      '값': totalStats.totalSales
    },
    {
      '항목': '총 할인',
      '값': totalStats.totalDiscount
    },
    {
      '항목': '순 매출',
      '값': totalStats.netSales
    },
    {
      '항목': '주문 수',
      '값': totalStats.orderCount
    },
    {
      '항목': '고객 수',
      '값': totalStats.customerCount
    },
    {
      '항목': '평균 주문액',
      '값': totalStats.avgOrderAmount
    },
    {
      '항목': '할인율',
      '값': (totalStats.discountRate * 100).toFixed(2) + '%'
    }
  ])
  XLSX.utils.book_append_sheet(workbook, statsSheet, '전체 통계')

  // 3. 카테고리별 매출 시트
  if (salesByCategory && salesByCategory.length > 0) {
    const categorySheet = XLSX.utils.json_to_sheet(
      salesByCategory.map((item: any) => ({
        '카테고리': item.category,
        '총 매출': item.totalSales,
        '주문 수': item.orderCount,
        '판매량': item.itemCount
      }))
    )
    XLSX.utils.book_append_sheet(workbook, categorySheet, '카테고리별 매출')
  }

  // 4. 할인 통계 시트
  const discountSheet = XLSX.utils.json_to_sheet([
    {
      '할인 유형': 'VIP 할인',
      '건수': discountStats.vip.count,
      '총 할인 금액': discountStats.vip.totalDiscount,
      '평균 할인 금액': discountStats.vip.avgDiscount
    },
    {
      '할인 유형': '생일자 할인',
      '건수': discountStats.birthday.count,
      '총 할인 금액': discountStats.birthday.totalDiscount,
      '평균 할인 금액': discountStats.birthday.avgDiscount
    },
    {
      '할인 유형': '직원 할인',
      '건수': discountStats.employee.count,
      '총 할인 금액': discountStats.employee.totalDiscount,
      '평균 할인 금액': discountStats.employee.avgDiscount
    },
    {
      '할인 유형': '패키지 할인',
      '건수': discountStats.package.count,
      '총 할인 금액': discountStats.package.totalDiscount,
      '평균 할인 금액': discountStats.package.avgDiscount
    },
    {
      '할인 유형': '일반 (할인 없음)',
      '건수': discountStats.regular.count,
      '총 할인 금액': 0,
      '평균 할인 금액': 0
    }
  ])
  XLSX.utils.book_append_sheet(workbook, discountSheet, '할인 통계')

  // 파일 다운로드
  XLSX.writeFile(workbook, filename)
}

/**
 * 서비스 판매 순위를 Excel로 다운로드
 */
export function exportServiceRankingToExcel(servicesData: any[], filename: string) {
  const data = servicesData.map((service: any, index: number) => ({
    '순위': index + 1,
    '서비스명': service.serviceName,
    '카테고리': service.category,
    '총 매출': service.totalSales,
    '판매량': service.totalQuantity,
    '주문 수': service.orderCount,
    '고객 수': service.uniqueCustomers,
    '평균 주문액': service.avgSalesPerOrder,
    '단품': service.packageBreakdown?.single || 0,
    '4회 패키지': service.packageBreakdown?.package4 || 0,
    '8회 패키지': service.packageBreakdown?.package8 || 0,
    '10회 패키지': service.packageBreakdown?.package10 || 0
  }))

  downloadExcel(data, filename, '서비스 판매 순위')
}

/**
 * 업로드된 Excel 파일에서 매출 데이터 추출 및 검증
 */
export interface UploadedSalesData {
  date: string
  serviceName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  customerName?: string
  paymentMethod?: string
  notes?: string
}

export function validateUploadedSalesData(data: any[]): UploadedSalesData[] {
  const validatedData: UploadedSalesData[] = []

  data.forEach((row, index) => {
    try {
      // 필수 필드 검증
      if (!row['날짜'] && !row['date']) {
        throw new Error(`${index + 2}행: 날짜가 누락되었습니다.`)
      }
      if (!row['서비스명'] && !row['serviceName']) {
        throw new Error(`${index + 2}행: 서비스명이 누락되었습니다.`)
      }
      if (!row['수량'] && !row['quantity']) {
        throw new Error(`${index + 2}행: 수량이 누락되었습니다.`)
      }
      if (!row['단가'] && !row['unitPrice']) {
        throw new Error(`${index + 2}행: 단가가 누락되었습니다.`)
      }

      const salesData: UploadedSalesData = {
        date: row['날짜'] || row['date'],
        serviceName: row['서비스명'] || row['serviceName'],
        quantity: Number(row['수량'] || row['quantity']),
        unitPrice: Number(row['단가'] || row['unitPrice']),
        totalPrice: Number(row['총액'] || row['totalPrice']) ||
                    (Number(row['수량'] || row['quantity']) * Number(row['단가'] || row['unitPrice'])),
        customerName: row['고객명'] || row['customerName'],
        paymentMethod: row['결제방법'] || row['paymentMethod'] || 'CARD',
        notes: row['비고'] || row['notes']
      }

      // 날짜 형식 검증 (간단한 검증)
      if (isNaN(Date.parse(salesData.date))) {
        throw new Error(`${index + 2}행: 날짜 형식이 올바르지 않습니다. (${salesData.date})`)
      }

      // 숫자 필드 검증
      if (isNaN(salesData.quantity) || salesData.quantity <= 0) {
        throw new Error(`${index + 2}행: 수량이 올바르지 않습니다.`)
      }
      if (isNaN(salesData.unitPrice) || salesData.unitPrice < 0) {
        throw new Error(`${index + 2}행: 단가가 올바르지 않습니다.`)
      }

      validatedData.push(salesData)
    } catch (error: any) {
      console.error(`데이터 검증 오류: ${error.message}`)
      throw error
    }
  })

  return validatedData
}
