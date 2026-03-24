import { SectionHeader } from './SectionHeader'
import { ScrollReveal } from './ScrollReveal'

const steps = [
  {
    number: '01',
    title: 'Connectez Gmail',
    description:
      '2 clics, zero configuration. Kyrra scanne 6 mois d\'historique.',
  },
  {
    number: '02',
    title: 'Kyrra analyse',
    description:
      'IA double-moteur : empreintes et LLM identifient la prospection avec precision.',
  },
  {
    number: '03',
    title: 'Boite protegee',
    description:
      'Vos emails importants restent visibles. Le bruit disparait dans vos labels.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <SectionHeader
          badge="Comment ca marche"
          title="Protege en 2 minutes"
        />
        <div className="relative grid gap-12 md:grid-cols-3 md:gap-6">
          {/* Dashed connection line (desktop) */}
          <div className="pointer-events-none absolute top-10 left-[16.66%] right-[16.66%] hidden border-t border-dashed border-(--border) md:block" />

          {steps.map((s) => (
            <ScrollReveal key={s.number}>
              <div className="relative text-center">
                <span className="font-mono text-5xl font-light text-(--color-brand-accent)/20">
                  {s.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-(--muted-foreground)">
                  {s.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
