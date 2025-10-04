'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Save, X } from 'lucide-react'

interface MonthlyNote {
  id: string
  year: number
  month: number
  content: string
  createdAt: string
  updatedAt: string
}

interface MonthlyNoteFormProps {
  note?: MonthlyNote | null
  onSave: (data: { year: number; month: number; content: string }) => void
  onCancel: () => void
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => currentYear - i)
const months = Array.from({ length: 12 }, (_, i) => i + 1)

export function MonthlyNoteForm({ note, onSave, onCancel }: MonthlyNoteFormProps) {
  const [formData, setFormData] = useState({
    year: note?.year || currentYear,
    month: note?.month || new Date().getMonth() + 1,
    content: note?.content || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (note) {
      setFormData({
        year: note.year,
        month: note.month,
        content: note.content
      })
    }
  }, [note])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.content.trim()) {
      newErrors.content = '특이사항 내용을 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    onSave(formData)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {note ? '특이사항 수정' : '새 특이사항 작성'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연도
            </label>
            <Select
              value={formData.year.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              disabled={!!note}
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              월
            </label>
            <Select
              value={formData.month.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
              disabled={!!note}
            >
              {months.map(month => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            특이사항 내용 *
          </label>
          <textarea
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
              errors.content ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={8}
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="해당 월의 특이사항을 자세히 작성해주세요..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            취소
          </Button>
          <Button
            type="submit"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            저장
          </Button>
        </div>
      </form>
    </Card>
  )
}