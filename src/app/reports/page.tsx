'use client'
import { useToast } from '@/components/providers/ToastProvider'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { SalesChart } from '@/components/reports/SalesChart'
import { TopServicesTable } from '@/components/reports/TopServicesTable'
import { DiscountStatsCard } from '@/components/reports/DiscountStatsCard'
import { ExcelUpload } from '@/components/reports/ExcelUpload'
import { exportSalesReport, exportServiceRanking, exportDiscountStats } from '@/lib/exportExcel'
import { exportSalesReportToExcel, exportServiceRankingToExcel } from '@/lib/excelUtils'
import { TrendingUp, Download, Calendar, BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  const { showToast } = useToast()
  const [period, setPeriod] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [salesData, setSalesData] = useState<any>(null)
  const [servicesData, setServicesData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // 초기 날짜 설정 (이번 달)
  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
  }, [])

  const fetchReports = async () => {
    if (!startDate || !endDate) {
      showToast('시작일과 종료일을 선택해주세요.', 'warning')
      return
    }

    setLoading(true)
    try {
      // 매출 리포트 조회
      const salesRes = await fetch(
        `/api/reports/sales?period=${period}&startDate=${startDate}&endDate=${endDate}`
      )
      if (salesRes.ok) {
        const salesData = await salesRes.json()
        setSalesData(salesData)
      }

      // 서비스 리포트 조회
      const servicesRes = await fetch(
        `/api/reports/services?startDate=${startDate}&endDate=${endDate}&limit=20`
      )
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServicesData(servicesData)
      }
    } catch (error) {
      console.error('리포트 조회 오류:', error)
      showToast('리포트를 불러오는 중 오류가 발생했습니다.', 'warning')
    } finally {
      setLoading(false)
    }
  }

  // 날짜 변경 시 자동 조회
  useEffect(() => {
    if (startDate && endDate) {
      fetchReports()
    }
  }, [startDate, endDate, period])

  const handleExportSales = () => {
    if (!salesData) {
      showToast('내보낼 데이터가 없습니다.', 'warning')
      return
    }
    const filename = `매출리포트_${startDate}_${endDate}.xlsx`
    exportSalesReportToExcel(salesData, filename)
  }

  const handleExportServices = () => {
    if (!servicesData) {
      showToast('내보낼 데이터가 없습니다.', 'warning')
      return
    }
    const filename = `서비스판매순위_${startDate}_${endDate}.xlsx`
    exportServiceRankingToExcel(servicesData.topServices, filename)
  }

  const handleExportDiscounts = () => {
    if (!salesData) {
      showToast('내보낼 데이터가 없습니다.', 'warning')
      return
    }
    const filename = `할인통계_${startDate}_${endDate}.csv`
    exportDiscountStats(salesData.discountStats, filename)
  }

  const handleUploadComplete = () => {
    // 업로드 완료 후 리포트 새로고침
    fetchReports()
  }

  const totalStats = salesData?.totalStats

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-slate-900" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">매출 리포트</h1>
            <p className="text-gray-600 mt-1">상세 매출 분석 및 통계</p>
          </div>
        </div>
        <ExcelUpload onUploadComplete={handleUploadComplete} />
      </div>

      {/* 필터 영역 */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기간 단위
            </label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="day">일별</option>
              <option value="week">주별</option>
              <option value="month">월별</option>
              <option value="year">년별</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작일
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료일
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={fetchReports}
              disabled={loading}
              className="w-full"
            >
              {loading ? '조회 중...' : '조회'}
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">리포트를 생성하는 중...</p>
          </div>
        </div>
      )}

      {!loading && totalStats && (
        <>
          {/* 전체 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">총 매출</p>
                <TrendingUp className="h-5 w-5 text-slate-900" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.totalSales.toLocaleString()}원
              </p>
              <p className="text-xs text-gray-500 mt-1">할인 전 금액</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">총 할인</p>
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">
                -{totalStats.totalDiscount.toLocaleString()}원
              </p>
              <p className="text-xs text-gray-500 mt-1">
                할인율: {(totalStats.discountRate * 100).toFixed(1)}%
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">순 매출</p>
                <TrendingUp className="h-5 w-5 text-slate-900" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {totalStats.netSales.toLocaleString()}원
              </p>
              <p className="text-xs text-gray-500 mt-1">실제 수익</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">평균 주문액</p>
                <TrendingUp className="h-5 w-5 text-slate-900" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.avgOrderAmount.toLocaleString()}원
              </p>
              <p className="text-xs text-gray-500 mt-1">
                총 {totalStats.orderCount}건 / {totalStats.customerCount}명
              </p>
            </div>
          </div>

          {/* 매출 차트 */}
          {salesData && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">기간별 매출 추이</h2>
                <Button onClick={handleExportSales} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  CSV 다운로드
                </Button>
              </div>
              <SalesChart data={salesData.salesByPeriod} period={period} />
            </div>
          )}

          {/* 할인 통계 */}
          {salesData?.discountStats && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">할인 사용 현황</h2>
                <Button onClick={handleExportDiscounts} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  CSV 다운로드
                </Button>
              </div>
              <DiscountStatsCard stats={salesData.discountStats} />
            </div>
          )}

          {/* 서비스 판매 순위 */}
          {servicesData && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">서비스별 판매 순위</h2>
                <Button onClick={handleExportServices} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  CSV 다운로드
                </Button>
              </div>
              <TopServicesTable
                services={servicesData.topServices}
                title="TOP 20 인기 서비스"
              />
            </div>
          )}
        </>
      )}

      {!loading && !totalStats && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">조회 기간을 선택하고 조회 버튼을 눌러주세요.</p>
        </div>
      )}
    </div>
  )
}
