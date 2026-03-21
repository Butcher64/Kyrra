import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-(--border) bg-transparent text-(--card-foreground)',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('px-4 py-3.5', className)}
      {...props}
    />
  )
}

export { Card, CardContent }
