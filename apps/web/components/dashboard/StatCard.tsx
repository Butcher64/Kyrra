import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  sublabel?: string
  accent?: 'brand' | 'attention' | 'protected' | 'default' | 'cyan'
}

const iconStyles: Record<string, string> = {
  brand: 'bg-[var(--color-accent-start)]/10 text-[var(--color-accent-start)]',
  attention: 'bg-[var(--color-attention)]/10 text-[var(--color-attention)]',
  protected: 'bg-[var(--color-protected)]/10 text-[var(--color-protected)]',
  default: 'bg-white/5 text-slate-400',
  cyan: 'bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]',
}

const labelStyles: Record<string, string> = {
  brand: 'group-hover:text-[var(--color-accent-start)]',
  attention: 'group-hover:text-[var(--color-attention)]',
  protected: 'group-hover:text-[var(--color-protected)]',
  default: 'group-hover:text-slate-300',
  cyan: 'group-hover:text-[var(--color-accent-cyan)]',
}

export function StatCard({ icon: Icon, value, label, sublabel, accent = 'default' }: StatCardProps) {
  const showPulse = accent === 'attention' && typeof value === 'number' && value > 0

  return (
    <div className="glass rounded-xl p-6 hover:bg-white/[0.05] transition-all group">
      <div className="flex justify-between items-start mb-4">
        <span className={cn('p-2 rounded-lg', iconStyles[accent])}>
          <Icon size={20} strokeWidth={1.5} />
        </span>
        <span className={cn('text-[10px] font-label text-slate-500 uppercase tracking-widest transition-colors', labelStyles[accent])}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <h3 className="text-2xl font-headline font-bold text-slate-100">
          {value}
        </h3>
        {showPulse && (
          <span className="size-1.5 rounded-full bg-[var(--color-attention)] animate-pulse" />
        )}
      </div>
      {sublabel && (
        <p className="text-xs text-slate-500 mt-1">{sublabel}</p>
      )}
    </div>
  )
}
