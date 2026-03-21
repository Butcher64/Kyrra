import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        'a-voir': 'bg-[oklch(0.588_0.158_241.966/0.12)] text-[var(--color-a-voir)]',
        'filtre': 'bg-[oklch(0.551_0.027_264.364/0.12)] text-(--muted-foreground)',
        'bloque': 'bg-[oklch(0.577_0.245_27.325/0.12)] text-[var(--color-bloque)]',
        'protected': 'bg-[oklch(0.627_0.194_149.214/0.12)] text-[var(--color-protected)]',
        'attention': 'bg-[oklch(0.666_0.179_58.318/0.12)] text-[var(--color-attention)]',
        'muted': 'bg-(--muted) text-(--muted-foreground)',
      },
    },
    defaultVariants: {
      variant: 'muted',
    },
  },
)

interface BadgeProps extends React.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
