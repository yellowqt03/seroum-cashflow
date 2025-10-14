'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, required, children, ...props }, ref) => {
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
        <select
          id={id}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
            error && "border-red-300 focus:ring-red-600",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
