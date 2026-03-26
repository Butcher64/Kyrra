'use client'

import { ScrollReveal } from './ScrollReveal'

const bullets = [
  {
    title: 'Analyse Contextuelle IA',
    description: 'Comprend le sens profond des messages, pas seulement les mots-clés.',
  },
  {
    title: 'Priorisation Dynamique',
    description: 'Adapte le niveau de filtrage selon l\'urgence de vos dossiers actuels.',
  },
  {
    title: 'Interface Zéro-Bruit',
    description: 'Un tableau de bord épuré conçu pour la concentration profonde.',
  },
]

const emailItems = [
  {
    label: 'À voir',
    labelColor: 'text-[var(--color-a-voir)]',
    borderColor: 'border-l-[var(--color-a-voir)]',
    time: "À l'instant",
    content: 'Rapport de fusion trimestriel : Action requise avant 18h.',
    opacity: '',
  },
  {
    label: 'Filtré',
    labelColor: 'text-[var(--color-filtre)]',
    borderColor: 'border-l-[var(--color-filtre)]',
    time: 'Il y a 5 min',
    content: 'Mise à jour hebdomadaire de la newsletter interne...',
    opacity: 'opacity-40',
  },
  {
    label: 'Bloqué',
    labelColor: 'text-[var(--color-bloque)]',
    borderColor: 'border-l-[var(--color-bloque)]',
    time: 'Il y a 12 min',
    content: 'Promotion exceptionnelle sur les fournitures...',
    opacity: 'opacity-20',
  },
]

export function FeaturesSection() {
  return (
    <section
      data-section="features"
      id="features"
      className="py-32 px-6 md:px-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
    >
      {/* Left: text */}
      <ScrollReveal>
        <div>
          <span className="font-label text-[var(--color-accent-cyan)] text-xs uppercase tracking-widest mb-6 block">
            Technologie Exclusive
          </span>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-slate-100 mb-8 leading-tight">
            Le filtrage sémantique nouvelle génération.
          </h2>
          <ul className="space-y-6">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-4">
                <div
                  className="mt-1 w-2 h-2 rounded-full bg-[var(--color-accent-cyan)] shrink-0"
                  style={{ boxShadow: '0 0 10px oklch(0.72 0.19 195 / 0.8)' }}
                />
                <div>
                  <h5 className="font-bold text-slate-100 mb-1">{b.title}</h5>
                  <p className="text-slate-400 text-sm">{b.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ScrollReveal>

      {/* Right: classifier mock */}
      <ScrollReveal>
        <div className="relative">
          <div className="absolute -inset-4 bg-[var(--color-accent-start)]/5 rounded-3xl blur-2xl" />
          <div className="relative glass rounded-2xl overflow-hidden p-6 aspect-video flex flex-col gap-4">
            {/* Window chrome */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/40" />
                <div className="w-3 h-3 rounded-full bg-[var(--color-accent-cyan)]/40" />
                <div className="w-3 h-3 rounded-full bg-[var(--color-accent-start)]/40" />
              </div>
              <div className="font-label text-[10px] text-slate-500">KYRRA_CLASSIFIER_V4.0</div>
            </div>
            {/* Email items */}
            <div className="space-y-4">
              {emailItems.map((item, i) => (
                <div
                  key={i}
                  className={`p-3 bg-white/5 rounded border-l-2 ${item.borderColor} ${item.opacity}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-bold uppercase font-label ${item.labelColor}`}>
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.time}</span>
                  </div>
                  <div className={`text-xs ${i === 0 ? 'text-slate-300' : i === 1 ? 'text-slate-500' : 'text-slate-600'}`}>
                    {item.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
