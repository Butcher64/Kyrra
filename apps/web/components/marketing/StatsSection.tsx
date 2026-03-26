import { CountUp } from '@/components/animation'

const stats = [
  { value: 312, suffix: '', prefix: '', label: 'Emails filtrés par semaine en moyenne' },
  { value: 45, suffix: ' min', prefix: '', label: 'Gagnées par jour par dirigeant' },
  { value: 2, suffix: ' min', prefix: '<', label: 'Setup complet avec Gmail' },
]

export function StatsSection() {
  return (
    <section data-section="stats" className="py-24 md:py-32">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-12 px-6 md:px-10 md:flex-row md:gap-24">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="font-headline text-[clamp(3rem,6vw,5rem)] font-bold text-[var(--foreground)]">
              <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
            </div>
            <div className="mt-2 text-sm uppercase tracking-wider text-[var(--muted-foreground)]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
