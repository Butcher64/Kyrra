'use client'

import { useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    tier: 'Gratuit',
    price: { monthly: 0, yearly: 0 },
    period: 'pour toujours',
    features: ['30 emails/jour', 'Classification de base', '1 compte Gmail', 'Dashboard simple'],
    cta: 'Commencer',
    highlighted: false,
  },
  {
    tier: 'Pro',
    price: { monthly: 15, yearly: 12 },
    period: '/mois',
    features: ['Emails illimites', 'Kyrra Recap quotidien', 'Scores de confiance', 'Resume par email', 'Labels personnalisables', '3 modes d\'exposition'],
    cta: 'Essai gratuit 14 jours',
    highlighted: true,
  },
  {
    tier: 'Team',
    price: { monthly: 19, yearly: 15 },
    period: '/user/mois',
    features: ['Tout Pro inclus', 'Multi-utilisateurs', 'Admin equipe', 'Whitelist partagee', 'Support SLA 4h'],
    cta: 'Essai gratuit 14 jours',
    highlighted: false,
  },
]

const trustBadges = ['RGPD conforme', 'Hebergement UE', 'Zero data retention', 'Chiffrement E2E']

export function PricingSection() {
  const [annual, setAnnual] = useState(true)

  return (
    <section data-section="pricing" id="pricing" className="bg-[#f5f6f9] py-24 lg:py-32">
      <div className="max-w-5xl mx-auto px-8 lg:px-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="font-mono text-[11px] text-[#8b90a0] uppercase tracking-[0.14em] mb-3">
            Tarifs
          </div>
          <h2 className="text-[24px] font-bold text-[#0c1a32] mb-2">
            Un prix simple, transparent.
          </h2>
          <p className="text-[14px] text-[#4a5068]">
            Commencez gratuitement. Evoluez quand vous etes pret.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex">
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2.5 text-[12px] font-medium cursor-pointer transition-colors ${
                annual
                  ? 'bg-[#0c1a32] text-white border border-[#0c1a32]'
                  : 'bg-white text-[#4a5068] border border-[#e4e6ed]'
              }`}
            >
              Annuel
            </button>
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2.5 text-[12px] font-medium cursor-pointer transition-colors ${
                !annual
                  ? 'bg-[#0c1a32] text-white border border-[#0c1a32]'
                  : 'bg-white text-[#4a5068] border border-[#e4e6ed]'
              }`}
            >
              Mensuel
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {plans.map((plan) => {
            const price = annual ? plan.price.yearly : plan.price.monthly
            return (
              <div
                key={plan.tier}
                className={`bg-white border flex flex-col ${
                  plan.highlighted
                    ? 'border-[#0c1a32] border-t-[3px]'
                    : 'border-[#e4e6ed]'
                } relative`}
              >
                {/* Populaire badge */}
                {plan.highlighted && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-[#0c1a32] text-white font-mono text-[8px] px-3 py-1 uppercase tracking-wider">
                    Populaire
                  </div>
                )}

                <div className="p-8 flex flex-col flex-1">
                  {/* Tier */}
                  <div className="font-mono text-[10px] text-[#8b90a0] uppercase tracking-wider mb-4">
                    {plan.tier}
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <span className="text-[36px] font-bold text-[#0c1a32] tracking-tight">
                      {price === 0 ? 'Gratuit' : `${price}€`}
                    </span>
                    {price > 0 && (
                      <span className="text-[14px] text-[#8b90a0]">{plan.period}</span>
                    )}
                  </div>
                  {price > 0 && annual && (
                    <div className="text-[11px] text-[#8b90a0] mb-6">
                      soit {plan.price.monthly}€/mois en mensuel
                    </div>
                  )}
                  {price === 0 && <div className="text-[11px] text-[#8b90a0] mb-6">{plan.period}</div>}

                  {/* Features */}
                  <div className="flex flex-col gap-3 flex-1 mb-8">
                    {plan.features.map((f, i) => (
                      <div key={i} className="text-[13px] text-[#4a5068] flex items-start gap-2">
                        <span className="text-[#0c1a32] mt-0.5">✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    href="/login"
                    className={`block text-center py-3 text-[13px] font-medium no-underline transition-colors ${
                      plan.highlighted
                        ? 'bg-[#0c1a32] text-white hover:bg-[#1a2a4a]'
                        : 'border border-[#e4e6ed] text-[#0c1a32] hover:bg-[#f5f6f9]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 flex-wrap">
          {trustBadges.map((badge, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1 h-1 bg-[#2dd881] rounded-full" />
              <span className="font-mono text-[9px] text-[#8b90a0] uppercase tracking-wider">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
