'use client'

import { useState } from 'react'
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
      'Emails illimites',
      'Kyrra Recap quotidien',
      'Scores de confiance',
      'Resume 1 ligne par email',
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
      'Tableau admin equipe',
      'Whitelist partagee',
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
      className="px-8 lg:px-12 py-20 border-t border-[#e4e6ed]"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8b90a0] mb-3">
          Tarifs
        </div>
        <h2 className="text-[22px] font-bold text-[#0c1a32] mb-4">
          Un prix simple.
        </h2>

        {/* Toggle */}
        <div className="flex items-center gap-0">
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-2 text-[12px] font-medium cursor-pointer transition-colors ${
              annual
                ? 'bg-[#0c1a32] text-white border border-[#0c1a32]'
                : 'bg-transparent text-[#4a5068] border border-[#e4e6ed]'
            }`}
          >
            Annuel
          </button>
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-2 text-[12px] font-medium cursor-pointer transition-colors ${
              !annual
                ? 'bg-[#0c1a32] text-white border border-[#0c1a32]'
                : 'bg-transparent text-[#4a5068] border border-[#e4e6ed]'
            }`}
          >
            Mensuel
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {plans.map((plan) => (
          <PricingCard key={plan.tierKey} plan={plan} annual={annual} />
        ))}
      </div>
    </section>
  )
}
