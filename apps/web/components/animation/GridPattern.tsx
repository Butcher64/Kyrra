import { cn } from '@/lib/utils'

interface GridPatternProps {
  size?: number
  opacity?: number
  className?: string
}

export function GridPattern({ size = 40, opacity = 0.04, className }: GridPatternProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: `linear-gradient(oklch(1 0 0 / ${opacity}) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / ${opacity}) 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      }}
      aria-hidden
    />
  )
}
