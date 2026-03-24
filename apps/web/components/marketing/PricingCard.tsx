import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PricingCardProps {
  tier: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
}

export function PricingCard({
  tier,
  price,
  period,
  description,
  features,
  cta,
  highlighted = false,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'glass relative rounded-lg p-8',
        highlighted &&
          'border-(--color-brand-start) glow-brand',
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-0.5 text-xs font-medium text-white">
          Populaire
        </span>
      )}

      <p className="text-sm font-medium uppercase tracking-wider">{tier}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-outfit text-4xl font-light">{price}</span>
        {period && (
          <span className="text-sm text-(--muted-foreground)">{period}</span>
        )}
      </div>

      <p className="mt-2 text-sm text-(--muted-foreground)">{description}</p>

      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-(--color-protected)" />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          variant={highlighted ? 'brand' : 'outline'}
          className="w-full"
        >
          {cta}
        </Button>
      </div>
    </div>
  )
}
