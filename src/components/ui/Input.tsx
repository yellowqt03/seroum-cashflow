'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string
  error?: string
  required?: boolean
  as?: 'input' | 'textarea'
}

const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ className, label, error, required, as = 'input', ...props }, ref) => {
    const id = props.id || props.name

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "block text-xs font-medium text-slate-700",
              required && "after:content-['*'] after:ml-0.5 after:text-red-600"
            )}
          >
            {label}
          </label>
        )}
        {as === 'textarea' ? (
          <textarea
            id={id}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={cn(
              "flex min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 resize-vertical",
              error && "border-red-300 focus:ring-red-600",
              className
            )}
            {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
          />
        ) : (
          <input
            id={id}
            ref={ref as React.Ref<HTMLInputElement>}
            className={cn(
              "flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
              error && "border-red-300 focus:ring-red-600",
              className
            )}
            {...props as React.InputHTMLAttributes<HTMLInputElement>}
          />
        )}
        {error && (
          <p className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
