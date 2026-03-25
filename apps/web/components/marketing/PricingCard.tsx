'use client'

import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

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
      className={cn(
        'p-8 rounded-2xl flex flex-col transition-all',
        plan.highlighted
          ? 'bg-[var(--card)] border border-[var(--color-accent-start)]/30 shadow-[0_0_50px_rgba(77,142,255,0.15)] scale-105 z-10 relative'
          : 'bg-[var(--surface-low)] border border-white/5'
      )}
    >
      {plan.highlighted && (
        <div className="absolute top-0 right-0 bg-[var(--color-accent-start)] px-4 py-1 text-[10px] font-bold text-[var(--on-primary)] rounded-bl-lg font-label uppercase">
          Recommandé
        </div>
      )}

      <div className="mb-8">
        <h4
          className={cn(
            'font-label text-xs uppercase tracking-widest mb-2',
            plan.highlighted ? 'text-[var(--color-accent-start)]' : 'text-slate-500'
          )}
        >
          {plan.tier}
        </h4>
        <div className="flex items-baseline gap-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={String(price)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="text-4xl font-headline font-bold text-white"
            >
              {price === 0 ? (
                'Gratuit'
              ) : price !== null ? (
                <>
                  {price}€
                  <span className="text-sm text-slate-500 font-normal">/mois</span>
                </>
              ) : (
                'Sur Mesure'
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ul className="space-y-4 mb-12 flex-grow">
        {plan.features.map((f) => (
          <li
            key={f}
            className={cn(
              'flex items-center gap-3 text-sm',
              plan.highlighted ? 'text-slate-200' : 'text-slate-400'
            )}
          >
            <CheckCircle className="w-4 h-4 text-[var(--color-accent-start)]" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/login"
        className={cn(
          'w-full py-3 rounded-lg text-sm font-bold text-center transition-all no-underline block',
          plan.highlighted
            ? 'bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--primary)] text-[var(--on-primary)] py-4 hover:scale-[1.02]'
            : 'border border-white/10 hover:bg-white/5 text-white'
        )}
      >
        {plan.cta}
      </Link>
    </div>
  )
}
