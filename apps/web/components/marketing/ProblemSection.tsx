import { BellRing, TimerOff, ShieldAlert } from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

const painPoints = [
  {
    icon: BellRing,
    title: 'Fatigue Décisionnelle',
    description: '18 à 22 emails de prospection par jour saturent votre attention de dirigeant.',
  },
  {
    icon: TimerOff,
    title: 'Temps Perdu',
    description: '2,5h/jour perdues à trier prospection, spam et emails légitimes.',
  },
  {
    icon: ShieldAlert,
    title: 'Risque Critique',
    description: 'Un email client critique noyé dans 50 sollicitations = contrat perdu.',
  },
]

export function ProblemSection() {
  return (
    <section data-section="problem" className="py-24 px-10 max-w-7xl mx-auto">
      <div className="mb-16">
        <h2 className="text-3xl font-headline font-bold text-slate-100 mb-4">
          Le coût caché du bruit numérique.
        </h2>
        <div className="h-1 w-20 bg-[var(--color-accent-start)]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {painPoints.map((point, i) => (
          <ScrollReveal key={i}>
            <div className="p-8 rounded-xl bg-[var(--surface-low)] border border-white/5 hover:border-[var(--color-accent-start)]/20 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-[var(--surface-high)] flex items-center justify-center mb-6 text-[var(--color-accent-start)]">
                <point.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-4">{point.title}</h3>
              <p className="text-slate-400 leading-relaxed">{point.description}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
