'use client'

import { ScrollReveal } from './ScrollReveal'

const steps = [
  {
    number: '1',
    title: 'Connectez Gmail',
    description: "OAuth en 1 clic, scan automatique de vos 6 derniers mois d'envois.",
  },
  {
    number: '2',
    title: 'Kyrra classe',
    description: 'Dual-engine IA : fingerprint rapide + LLM pour les cas ambigus, en moins de 2 minutes.',
  },
  {
    number: '3',
    title: '3 labels Gmail',
    description: 'À voir, Filtré, Bloqué. Plus un Recap quotidien par email chaque matin.',
  },
]

export function HowItWorks() {
  return (
    <section
      data-section="how-it-works"
      id="how-it-works"
      className="py-24 bg-[var(--surface-container)] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-headline font-bold text-slate-100 mb-4">
            Une intégration, trois étapes.
          </h2>
          <p className="text-slate-500 font-label uppercase tracking-widest text-xs">
            Simplicité. Puissance. Souveraineté.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          {/* Dashed connector line */}
          <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 border-t-2 border-dashed border-white/10 -z-10" />
          {steps.map((step, i) => (
            <ScrollReveal key={i}>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent-start)] to-[var(--primary)] flex items-center justify-center text-[var(--on-primary)] text-2xl font-bold mb-8 shadow-lg shadow-[var(--color-accent-start)]/20">
                  {step.number}
                </div>
                <h4 className="text-xl font-bold text-slate-100 mb-4">{step.title}</h4>
                <p className="text-slate-400">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
