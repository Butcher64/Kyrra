import { cn } from '@/lib/utils'

interface NoiseOverlayProps {
  className?: string
}

export function NoiseOverlay({ className }: NoiseOverlayProps) {
  return (
    <div
      className={cn('pointer-events-none fixed inset-0 z-50 bg-noise opacity-[0.03] mix-blend-overlay', className)}
      aria-hidden
    />
  )
}
