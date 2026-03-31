import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
  {
    variants: {
      variant: {
        'a-voir': 'bg-[var(--color-tag-blue-bg)] text-[var(--color-tag-blue)]',
        'filtre': 'bg-[var(--color-tag-gray-bg)] text-[var(--color-tag-gray)]',
        'bloque': 'bg-[var(--color-tag-red-bg)] text-[var(--color-tag-red)]',
        'protected': 'bg-emerald-50 text-[var(--color-green)]',
        'attention': 'bg-amber-50 text-[var(--color-attention)]',
        'muted': 'bg-[var(--muted)] text-[var(--muted-foreground)]',
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
