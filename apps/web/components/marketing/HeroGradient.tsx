'use client'
import { cn } from '@/lib/utils'

export function HeroGradient({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {/* Top-left primary orb */}
      <div
        className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-[120px]"
        style={{ background: 'rgba(173,198,255,0.10)' }}
      />
      {/* Bottom-right tertiary orb */}
      <div
        className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-[120px]"
        style={{ background: 'rgba(76,215,246,0.10)' }}
      />
      {/* Center secondary orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px]"
        style={{ background: 'rgba(192,193,255,0.05)' }}
      />
    </div>
  )
}
