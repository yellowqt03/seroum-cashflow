/**
 * Excel 내보내기 유틸리티
 *
 * 간단한 CSV 형식으로 내보내기
 * 실제 Excel 파일(.xlsx)이 필요한 경우 xlsx 라이브러리 사용 권장
 */

export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
}

/**
 * CSV 형식으로 데이터 내보내기
 */
export function exportToCSV(data: ExportData, filename: string) {
  // CSV 데이터 생성
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row => row.map(cell => {
      // 쉼표나 줄바꿈이 있는 경우 따옴표로 감싸기
      const cellStr = String(cell)
      if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(','))
  ].join('\n')

  // BOM 추가 (Excel에서 한글 깨짐 방지)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // 다운로드
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 매출 리포트를 CSV로 내보내기
 */
export function exportSalesReport(reportData: any, filename: string) {
  const { salesByPeriod, totalStats } = reportData

  const data: ExportData = {
    headers: ['기간', '총 매출', '할인 금액', '순 매출', '주문 수', '고객 수', '평균 주문액'],
    rows: salesByPeriod.map((item: any) => [
      item.period,
      item.totalSales,
      item.totalDiscount,
      item.netSales,
      item.orderCount,
      item.customerCount,
      item.avgOrderAmount
    ])
  }

  // 합계 행 추가
  data.rows.push([
    '전체',
    totalStats.totalSales,
    totalStats.totalDiscount,
    totalStats.netSales,
    totalStats.orderCount,
    totalStats.customerCount,
    totalStats.avgOrderAmount
  ])

  exportToCSV(data, filename)
}

/**
 * 서비스 판매 순위를 CSV로 내보내기
 */
export function exportServiceRanking(servicesData: any[], filename: string) {
  const data: ExportData = {
    headers: ['순위', '서비스명', '카테고리', '총 매출', '판매량', '주문 수', '고객 수', '평균 주문액'],
    rows: servicesData.map((service: any, index: number) => [
      index + 1,
      service.serviceName,
      service.category,
      service.totalSales,
      service.totalQuantity,
      service.orderCount,
      service.uniqueCustomers,
      service.avgSalesPerOrder
    ])
  }

  exportToCSV(data, filename)
}

/**
 * 할인 통계를 CSV로 내보내기
 */
export function exportDiscountStats(discountStats: any, filename: string) {
  const data: ExportData = {
    headers: ['할인 유형', '건수', '총 할인 금액', '평균 할인 금액'],
    rows: [
      ['VIP 할인', discountStats.vip.count, discountStats.vip.totalDiscount, discountStats.vip.avgDiscount],
      ['생일자 할인', discountStats.birthday.count, discountStats.birthday.totalDiscount, discountStats.birthday.avgDiscount],
      ['직원 할인', discountStats.employee.count, discountStats.employee.totalDiscount, discountStats.employee.avgDiscount],
      ['패키지 할인', discountStats.package.count, discountStats.package.totalDiscount, discountStats.package.avgDiscount],
      ['일반 (할인 없음)', discountStats.regular.count, 0, 0]
    ]
  }

  exportToCSV(data, filename)
}
