import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-xl text-(--card-foreground)',
  {
    variants: {
      variant: {
        default: 'border border-(--border) bg-transparent',
        glass: 'glass rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface CardProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof cardVariants> {}

function Card({ className, variant, ...props }: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant }), className)}
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

export { Card, CardContent, cardVariants }
