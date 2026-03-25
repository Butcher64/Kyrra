import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-opacity hover:opacity-70 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-(--primary) text-(--primary-foreground) rounded-lg',
        brand: 'bg-brand-gradient text-white hover:shadow-[var(--shadow-glow-lg)] transition-shadow duration-300 glow-brand rounded-lg',
        'brand-outline': 'border border-[var(--color-accent-start)]/30 bg-transparent text-[var(--foreground)] hover:border-[var(--color-accent-start)]/60 hover:bg-[var(--color-accent-start)]/5 rounded-lg',
        outline: 'border border-(--border) bg-transparent hover:bg-(--muted)/50 rounded-lg',
        ghost: 'bg-transparent text-(--muted-foreground) hover:text-(--foreground)',
        link: 'bg-transparent text-[var(--color-a-voir)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
