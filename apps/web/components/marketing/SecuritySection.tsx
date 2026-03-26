import { ShieldCheck, Globe, KeyRound } from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

const items = [
  {
    icon: ShieldCheck,
    title: 'Chiffrement de bout en bout',
    description: 'Vos données ne sont jamais lues par des humains.',
  },
  {
    icon: Globe,
    title: 'Hébergement Souverain',
    description: 'Données stockées exclusivement sur serveurs européens.',
  },
  {
    icon: KeyRound,
    title: 'Contrôle Total',
    description: 'Audit de sécurité régulier et transparence algorithmique.',
  },
]

const badges = ['RGPD Conforme', 'Hébergement EU', 'Zéro Data Retention']

export function SecuritySection() {
  return (
    <section
      data-section="security"
      id="security"
      className="py-24 bg-[var(--surface-low)]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 text-center">
        <h2 className="text-3xl font-headline font-bold text-slate-100 mb-16">
          La sécurité au cœur de notre architecture.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {items.map((item, i) => (
            <ScrollReveal key={i}>
              <div className="flex flex-col items-center">
                <item.icon className="w-12 h-12 text-[var(--color-accent-start)] mb-6" strokeWidth={1.5} />
                <h4 className="font-bold text-slate-100 mb-2">{item.title}</h4>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {badges.map((badge) => (
            <span
              key={badge}
              className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-label uppercase tracking-widest text-slate-400"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
