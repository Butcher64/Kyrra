import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90',
        secondary: 'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]',
        inverse: 'bg-white text-[var(--primary)] font-semibold hover:opacity-90',
        ghost: 'hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
        destructive: 'bg-[var(--destructive)] text-white hover:opacity-90',
        link: 'bg-transparent text-[var(--color-accent)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-7 py-3 text-sm',
        sm: 'px-4 py-2 text-xs',
        lg: 'px-9 py-4 text-base',
        icon: 'h-9 w-9',
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
