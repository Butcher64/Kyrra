import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlowBorderProps {
  children: ReactNode
  className?: string
}

export function GlowBorder({ children, className }: GlowBorderProps) {
  return (
    <div className={cn('border-glow rounded-xl', className)}>
      {children}
    </div>
  )
}
