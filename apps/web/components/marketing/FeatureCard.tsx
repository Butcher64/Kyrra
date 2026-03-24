import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  className?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'glass rounded-lg p-6 transition-colors hover:border-(--color-brand-start)/20',
        className,
      )}
    >
      <div className="bg-brand-gradient flex h-10 w-10 items-center justify-center rounded-full">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-(--muted-foreground)">{description}</p>
    </div>
  )
}
