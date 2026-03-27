'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PricingCard } from './PricingCard'

const plans = [
  {
    tier: 'Gratuit',
    tierKey: 'free',
    monthly: 0,
    yearly: 0,
    features: [
      '30 emails/jour',
      'Classification de base',
      '1 compte Gmail',
      'Dashboard simple',
    ],
    cta: 'Commencer gratuitement',
    highlighted: false,
  },
  {
    tier: 'Pro',
    tierKey: 'pro',
    monthly: 15,
    yearly: 12,
    features: [
      'Emails illimités',
      'Kyrra Recap quotidien',
      'Scores de confiance',
      'Résumé 1 ligne par email',
      "3 modes d'exposition",
    ],
    cta: 'Essai gratuit 14 jours',
    highlighted: true,
  },
  {
    tier: 'Team',
    tierKey: 'team',
    monthly: 19,
    yearly: 15,
    features: [
      'Tout Pro inclus',
      'Multi-utilisateurs',
      'Tableau admin équipe',
      'Whitelist partagée',
      'Support prioritaire (SLA 4h)',
    ],
    cta: 'Essai gratuit 14 jours',
    highlighted: false,
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(true)

  return (
    <section
      data-section="pricing"
      id="pricing"
      className="py-32 px-6 md:px-10 max-w-7xl mx-auto"
    >
      <div className="text-center mb-20">
        <h2 className="text-4xl font-headline font-bold text-slate-100 mb-6">
          Un investissement pour votre esprit.
        </h2>
        <div className="flex items-center justify-center gap-4 font-label text-sm">
          <span className={cn(annual ? 'text-slate-400' : 'text-white')}>Mensuel</span>
          <button
            onClick={() => setAnnual(!annual)}
            className="w-12 h-6 rounded-full bg-[var(--surface-highest)] relative p-1 flex items-center cursor-pointer border-none"
            aria-label="Toggle billing period"
          >
            <div className={cn(
              'w-4 h-4 bg-[var(--color-accent-start)] rounded-full transition-transform',
              annual ? 'translate-x-6' : 'translate-x-0'
            )} />
          </button>
          <span className={cn(annual ? 'text-white' : 'text-slate-400')}>
            Annuel{' '}
            <span className="text-[var(--color-accent-cyan)] text-xs ml-1">(-20%)</span>
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {plans.map((plan) => (
          <PricingCard key={plan.tierKey} plan={plan} annual={annual} />
        ))}
      </div>
    </section>
  )
}
