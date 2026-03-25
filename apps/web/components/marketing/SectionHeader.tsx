import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  badge?: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  id?: string
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  align = 'center',
  id,
}: SectionHeaderProps) {
  return (
    <div
      id={id}
      className={cn(
        'mb-16',
        align === 'center' && 'text-center',
      )}
    >
      {badge && (
        <span className="font-label text-[var(--color-accent-cyan)] text-xs uppercase tracking-[0.2em] mb-6 block">
          {badge}
        </span>
      )}
      <h2 className="font-headline text-3xl md:text-4xl font-bold text-slate-100 mb-4">
        {title}
      </h2>
      {align === 'left' && <div className="h-1 w-20 bg-[var(--color-accent-start)]" />}
      {subtitle && (
        <p
          className={cn(
            'text-slate-500 font-label uppercase tracking-widest text-xs mt-4',
            align === 'center' ? 'mx-auto max-w-[560px]' : 'max-w-[560px]',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
