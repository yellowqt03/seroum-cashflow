import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger'
  children: React.ReactNode
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-100 text-slate-700 border-slate-200',
      secondary: 'bg-slate-50 text-slate-600 border-slate-200',
      success: 'bg-green-50 text-green-700 border-green-200',
      warning: 'bg-amber-50 text-amber-700 border-amber-200',
      danger: 'bg-red-50 text-red-700 border-red-200'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
