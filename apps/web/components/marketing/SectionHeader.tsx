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
        'mb-12',
        align === 'center' && 'text-center',
      )}
    >
      {badge && (
        <span className="font-mono text-xs uppercase tracking-widest text-(--color-brand-accent)">
          {badge}
        </span>
      )}
      <h2 className="font-outfit text-3xl font-light mt-2 md:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'mt-4 text-(--muted-foreground)',
            align === 'center' && 'mx-auto max-w-[560px]',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
