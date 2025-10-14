'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { parseExcelFile, validateUploadedSalesData } from '@/lib/excelUtils'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react'

interface ExcelUploadProps {
  onUploadComplete?: () => void
}

export function ExcelUpload({ onUploadComplete }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Excel 파일인지 확인
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]

      if (!validTypes.includes(selectedFile.type) &&
          !selectedFile.name.endsWith('.xls') &&
          !selectedFile.name.endsWith('.xlsx')) {
        setError('Excel 파일(.xls, .xlsx)만 업로드 가능합니다.')
        return
      }

      setFile(selectedFile)
      setError('')
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('파일을 선택해주세요.')
      return
    }

    setUploading(true)
    setError('')

    try {
      // 1. Excel 파일 파싱
      const rawData = await parseExcelFile(file)

      if (rawData.length === 0) {
        throw new Error('파일에 데이터가 없습니다.')
      }

      // 2. 데이터 검증
      const validatedData = validateUploadedSalesData(rawData)

      // 3. 서버로 전송
      const response = await fetch('/api/sales/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesData: validatedData })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '업로드 실패')
      }

      const uploadResult = await response.json()
      setResult(uploadResult.results)

      // 업로드 완료 후 파일 초기화
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // 부모 컴포넌트에 알림
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (err: any) {
      console.error('업로드 오류:', err)
      setError(err.message || '파일 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadTemplate = () => {
    // 템플릿 다운로드 (CSV 형식)
    const template = [
      '날짜,서비스명,수량,단가,총액,고객명,결제방법,비고',
      '2025-01-01,프리미엄회복,1,120000,120000,홍길동,CARD,',
      '2025-01-02,면역청소,2,80000,160000,김철수,CASH,패키지'
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', '매출_업로드_템플릿.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Button onClick={() => setShowModal(true)} variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        엑셀 업로드
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6 text-slate-900" />
                <h2 className="text-xl font-semibold text-gray-900">매출 데이터 업로드</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* 내용 */}
            <div className="p-6 space-y-6">
              {/* 안내 메시지 */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">📋 업로드 가이드</h3>
                <ul className="text-sm text-slate-900 space-y-1">
                  <li>• Excel 파일(.xls, .xlsx)을 업로드할 수 있습니다.</li>
                  <li>• 필수 항목: 날짜, 서비스명, 수량, 단가</li>
                  <li>• 선택 항목: 총액, 고객명, 결제방법, 비고</li>
                  <li>• 서비스명은 시스템에 등록된 이름과 정확히 일치해야 합니다.</li>
                </ul>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  템플릿 다운로드
                </Button>
              </div>

              {/* 파일 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excel 파일 선택
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileSelect}
                    className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-900 hover:file:bg-blue-100"
                  />
                  {file && (
                    <span className="text-sm text-slate-900 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {file.name}
                    </span>
                  )}
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">오류</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* 업로드 결과 */}
              {result && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">업로드 결과</h3>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{result.total}</p>
                      <p className="text-xs text-gray-600">전체</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{result.success}</p>
                      <p className="text-xs text-gray-600">성공</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                      <p className="text-xs text-gray-600">실패</p>
                    </div>
                  </div>

                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">오류 목록:</p>
                      <div className="max-h-40 overflow-y-auto bg-white rounded border p-2">
                        {result.errors.map((err: string, index: number) => (
                          <p key={index} className="text-xs text-red-600 mb-1">• {err}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 버튼 */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  disabled={uploading}
                >
                  닫기
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                >
                  {uploading ? '업로드 중...' : '업로드'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
