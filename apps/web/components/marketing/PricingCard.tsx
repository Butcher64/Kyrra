'use client'

import { AnimatePresence, m } from 'motion/react'
import Link from 'next/link'

interface Plan {
  tier: string
  tierKey: string
  monthly: number | null
  yearly: number | null
  features: string[]
  cta: string
  highlighted: boolean
}

export function PricingCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = annual ? plan.yearly : plan.monthly

  return (
    <div
      className={`border border-[#e4e6ed] p-6 flex flex-col ${
        plan.highlighted ? 'border-l-[3px] border-l-[#0c1a32]' : ''
      }`}
    >
      {/* Plan name */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-[#8b90a0] mb-3">
        {plan.tier}
      </div>

      {/* Price */}
      <div className="mb-6">
        <AnimatePresence mode="wait">
          <m.div
            key={String(price)}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="text-4xl font-bold text-[#0c1a32]"
          >
            {price === 0 ? (
              'Gratuit'
            ) : price !== null ? (
              <>
                {price}&euro;
                <span className="text-[13px] text-[#8b90a0] font-normal">/mois</span>
              </>
            ) : (
              'Sur Mesure'
            )}
          </m.div>
        </AnimatePresence>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-grow list-none p-0 m-0">
        {plan.features.map((f) => (
          <li
            key={f}
            className="flex items-center gap-2 text-[13px] text-[#4a5068]"
          >
            <span className="text-[#0c1a32] text-[12px]">&#10003;</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="/login"
        className={`w-full py-3 text-[13px] font-medium text-center no-underline block transition-colors ${
          plan.highlighted
            ? 'bg-[#0c1a32] text-white hover:bg-[#1a2a4a]'
            : 'border border-[#e4e6ed] text-[#0c1a32] hover:bg-[#f5f6f9]'
        }`}
      >
        {plan.cta}
      </Link>
    </div>
  )
}
