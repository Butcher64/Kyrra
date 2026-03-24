import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  accent?: 'brand' | 'attention' | 'protected' | 'default'
}

const accentStyles: Record<string, string> = {
  brand: 'bg-[var(--color-brand-accent)]/10 text-[var(--color-brand-accent)]',
  attention: 'bg-[var(--color-attention)]/10 text-[var(--color-attention)]',
  protected: 'bg-[var(--color-protected)]/10 text-[var(--color-protected)]',
  default: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
}

export function StatCard({ icon: Icon, value, label, accent = 'default' }: StatCardProps) {
  const showPulse = accent === 'attention' && typeof value === 'number' && value > 0

  return (
    <div className="glass rounded-xl px-4 py-3.5 transition-colors duration-150 hover:border-[var(--color-brand-start)]/20">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex size-9 items-center justify-center rounded-full shrink-0',
          accentStyles[accent],
        )}>
          <Icon size={16} strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-outfit text-2xl font-medium text-[var(--foreground)]">
              {value}
            </span>
            {showPulse && (
              <span className="size-1.5 rounded-full bg-[var(--color-attention)] animate-pulse" />
            )}
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}
