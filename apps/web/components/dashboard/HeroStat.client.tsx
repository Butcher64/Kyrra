'use client'

import { NumberTicker } from '@/components/ui/number-ticker'

interface HeroStatProps {
  value: number
  label: string
}

export function HeroStat({ value, label }: HeroStatProps) {
  return (
    <div aria-label={`${value} ${label}`}>
      <NumberTicker
        value={value}
        className="font-(family-name:--font-outfit) text-[72px] font-light leading-none tracking-[-0.04em] text-(--foreground)"
      />
      <div className="mt-1 text-sm text-(--muted-foreground) font-normal tracking-[0.01em]">
        {label}
      </div>
    </div>
  )
}
