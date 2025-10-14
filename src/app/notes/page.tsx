'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { NotesGrid } from '@/components/notes/NotesGrid'
import { MonthlyNoteForm } from '@/components/notes/MonthlyNoteForm'
import { Plus, FileText, Calendar } from 'lucide-react'

interface MonthlyNote {
  id: string
  year: number
  month: number
  content: string
  createdAt: string
  updatedAt: string
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

export default function NotesPage() {
  const [notes, setNotes] = useState<MonthlyNote[]>([])
  const [filteredNotes, setFilteredNotes] = useState<MonthlyNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState<MonthlyNote | null>(null)
  const [filterYear, setFilterYear] = useState<string>('all')

  useEffect(() => {
    fetchNotes()
  }, [])

  useEffect(() => {
    if (filterYear === 'all') {
      setFilteredNotes(notes)
    } else {
      setFilteredNotes(notes.filter(note => note.year === parseInt(filterYear)))
    }
  }, [notes, filterYear])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/monthly-notes')
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      } else {
        console.error('특이사항 조회 실패')
      }
    } catch (error) {
      console.error('특이사항 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: { year: number; month: number; content: string }) => {
    try {
      if (editingNote) {
        const response = await fetch(`/api/monthly-notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: data.content })
        })

        if (response.ok) {
          await fetchNotes()
          setShowForm(false)
          setEditingNote(null)
        } else {
          alert('특이사항 수정에 실패했습니다.')
        }
      } else {
        const response = await fetch('/api/monthly-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        if (response.ok) {
          await fetchNotes()
          setShowForm(false)
        } else {
          const error = await response.json()
          alert(error.error || '특이사항 저장에 실패했습니다.')
        }
      }
    } catch (error) {
      console.error('특이사항 저장 오류:', error)
      alert('특이사항 저장 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = (note: MonthlyNote) => {
    setEditingNote(note)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 특이사항을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/monthly-notes/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchNotes()
      } else {
        alert('특이사항 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('특이사항 삭제 오류:', error)
      alert('특이사항 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingNote(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">특이사항을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-slate-900" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">월별 특이사항 관리</h1>
            <p className="text-gray-600 mt-1">매월 발생한 특이사항을 기록하고 관리합니다</p>
          </div>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            새 특이사항 추가
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="mb-8">
          <MonthlyNoteForm
            note={editingNote}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">연도 필터:</span>
              </div>
              <Select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-32"
              >
                <option value="all">전체</option>
                {years.map(year => (
                  <option key={year} value={year.toString()}>
                    {year}년
                  </option>
                ))}
              </Select>
            </div>
            <div className="text-sm text-gray-500">
              총 {filteredNotes.length}개의 특이사항
            </div>
          </div>

          <NotesGrid
            notes={filteredNotes}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  )
}