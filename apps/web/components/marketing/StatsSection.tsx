const stats = [
  {
    label: 'distractions supprimees',
    value: '312',
    sublabel: 'par semaine en moyenne',
  },
  {
    label: 'temps executif recupere',
    value: '45min',
    sublabel: 'chaque jour ouvre',
  },
  {
    label: 'latence de classification',
    value: '<2sec',
    sublabel: 'dual engine · rule + llm',
  },
]

export function StatsSection() {
  return (
    <section data-section="stats" className="border-t border-[#e4e6ed]">
      <div className="max-w-6xl mx-auto px-8 lg:px-16 py-20 flex flex-col md:flex-row gap-16 lg:gap-24">
        {stats.map((s, i) => (
          <div key={i} className="flex-1">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#8b90a0] mb-3">
              {s.label}
            </div>
            <div className="text-[48px] font-bold text-[#0c1a32] tracking-tight leading-none mb-2">
              {s.value}
            </div>
            <div className="font-mono text-[11px] text-[#c4c7d4]">
              {s.sublabel}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
