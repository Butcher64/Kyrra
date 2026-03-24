import { SectionHeader } from './SectionHeader'
import { PricingCard } from './PricingCard'
import { ScrollReveal } from './ScrollReveal'

const plans = [
  {
    tier: 'Free',
    price: '0\u20AC',
    description: 'Pour decouvrir',
    features: ['30 emails/jour', '3 labels Gmail', 'Classification IA'],
    cta: 'Commencer gratuitement',
  },
  {
    tier: 'Pro',
    price: '15\u20AC',
    period: '/mois',
    description: 'Pour les dirigeants',
    features: [
      'Emails illimites',
      'Kyrra Recap quotidien',
      'Score de confiance',
      'Support prioritaire',
      'Resume 1 ligne',
    ],
    cta: 'Essai gratuit 14 jours',
    highlighted: true,
  },
  {
    tier: 'Team',
    price: '19\u20AC',
    period: '/user/mois',
    description: 'Pour les equipes',
    features: [
      'Tout Pro inclus',
      'Gestion multi-utilisateurs',
      'Tableau de bord equipe',
      'Admin centralisee',
    ],
    cta: 'Contacter l\'equipe',
  },
]

export function PricingSection() {
  return (
    <section className="py-24" id="pricing">
      <div className="mx-auto max-w-[960px] px-6">
        <SectionHeader badge="Tarifs" title="Simple et transparent" />
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <ScrollReveal key={p.tier}>
              <PricingCard {...p} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
