'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    const variants = {
      primary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-500',
      outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-slate-500',
      ghost: 'text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
      success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600'
    }

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-6 text-sm'
    }

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
