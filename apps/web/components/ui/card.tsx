import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('px-6 py-5', className)}
      {...props}
    />
  )
}

export { Card, CardContent }
