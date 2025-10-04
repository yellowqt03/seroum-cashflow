'use client'

import { MonthlyNoteCard } from './MonthlyNoteCard'

interface MonthlyNote {
  id: string
  year: number
  month: number
  content: string
  createdAt: string
  updatedAt: string
}

interface NotesGridProps {
  notes: MonthlyNote[]
  onEdit: (note: MonthlyNote) => void
  onDelete: (id: string) => void
}

export function NotesGrid({ notes, onEdit, onDelete }: NotesGridProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">📝</div>
        <p className="text-gray-500">등록된 특이사항이 없습니다.</p>
        <p className="text-gray-400 text-sm mt-1">새 특이사항을 추가해보세요.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {notes.map((note) => (
        <MonthlyNoteCard
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}