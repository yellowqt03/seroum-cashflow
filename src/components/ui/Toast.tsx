'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, message, type, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    info: <Info className="h-5 w-5 text-slate-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />
  }

  const styles = {
    success: 'bg-white border-green-200',
    error: 'bg-white border-red-200',
    info: 'bg-white border-slate-200',
    warning: 'bg-white border-yellow-200'
  }

  return (
    <div
      className={`
        ${styles[type]}
        border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md
        animate-slide-in-right
        flex items-start space-x-3
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">
          {message}
        </p>
      </div>

      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 ml-4 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
