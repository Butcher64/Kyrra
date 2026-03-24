import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'dark' | 'white'
  className?: string
}

export function Logo({ variant = 'dark', className }: LogoProps) {
  return (
    <span
      className={cn(
        'font-outfit text-xl font-semibold tracking-tight',
        variant === 'dark' ? 'text-(--foreground)' : 'text-white',
        className,
      )}
    >
      Kyrra
      <span className="text-(--color-brand-accent)">.</span>
    </span>
  )
}
