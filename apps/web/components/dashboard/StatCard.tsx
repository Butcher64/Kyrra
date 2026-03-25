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
  brand: 'bg-blue-500/10 text-blue-400',
  attention: 'bg-amber-500/10 text-amber-400',
  protected: 'bg-emerald-500/10 text-emerald-400',
  default: 'bg-white/5 text-slate-400',
  cyan: 'bg-cyan-500/10 text-cyan-400',
}

const labelStyles: Record<string, string> = {
  brand: 'group-hover:text-blue-400',
  attention: 'group-hover:text-amber-400',
  protected: 'group-hover:text-emerald-400',
  default: 'group-hover:text-slate-300',
  cyan: 'group-hover:text-cyan-400',
}

export function StatCard({ icon: Icon, value, label, sublabel, accent = 'default' }: StatCardProps) {
  const showPulse = accent === 'attention' && typeof value === 'number' && value > 0

  return (
    <div className="glass rounded-xl p-6 hover:bg-white/[0.05] transition-all group">
      <div className="flex justify-between items-start mb-4">
        <span className={cn('p-2 rounded-lg', iconStyles[accent])}>
          <Icon size={20} strokeWidth={1.5} />
        </span>
        <span className={cn('text-[10px] font-mono text-slate-500 uppercase tracking-widest transition-colors', labelStyles[accent])}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <h3 className="text-2xl font-outfit font-bold text-slate-100">
          {value}
        </h3>
        {showPulse && (
          <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
        )}
      </div>
      {sublabel && (
        <p className="text-xs text-slate-500 mt-1 font-inter">{sublabel}</p>
      )}
    </div>
  )
}
