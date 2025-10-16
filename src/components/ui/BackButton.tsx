'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface BackButtonProps {
  label?: string
  fallbackHref?: string
}

export function BackButton({ label = '뒤로', fallbackHref = '/dashboard' }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    // 브라우저 히스토리가 있으면 뒤로 가기, 없으면 fallback URL로 이동
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleBack}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}
