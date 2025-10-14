'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Edit, Trash2, Calendar } from 'lucide-react'

interface MonthlyNote {
  id: string
  year: number
  month: number
  content: string
  createdAt: string
  updatedAt: string
}

interface MonthlyNoteCardProps {
  note: MonthlyNote
  onEdit: (note: MonthlyNote) => void
  onDelete: (id: string) => void
}

const monthNames = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월'
]

export function MonthlyNoteCard({ note, onEdit, onDelete }: MonthlyNoteCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-slate-900" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {note.year}년 {monthNames[note.month - 1]}
            </h3>
            <p className="text-sm text-gray-500">
              작성일: {formatDate(note.createdAt)}
              {note.updatedAt !== note.createdAt && (
                <span className="ml-2">
                  (수정일: {formatDate(note.updatedAt)})
                </span>
              )}
            </p>
          </div>
        </div>
        <Badge className="bg-slate-50 text-slate-900 border border-slate-200">
          {note.year}.{note.month.toString().padStart(2, '0')}
        </Badge>
      </div>

      <div className="mb-4">
        <div className="bg-slate-50 rounded-lg p-4 min-h-[100px]">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(note)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          수정
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(note.id)}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
        >
          <Trash2 className="h-4 w-4" />
          삭제
        </Button>
      </div>
    </Card>
  )
}