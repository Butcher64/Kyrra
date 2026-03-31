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
    <section data-section="stats" className="border-t border-b border-[#e4e6ed] flex flex-col md:flex-row">
      {stats.map((s, i) => (
        <div
          key={i}
          className={`flex-1 px-12 py-10 ${i < stats.length - 1 ? 'md:border-r md:border-[#e4e6ed]' : ''} ${i > 0 ? 'border-t md:border-t-0 border-[#e4e6ed]' : ''}`}
        >
          <div className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-1">
            {s.label}
          </div>
          <div className="text-[40px] font-bold text-[#0c1a32] tracking-tight leading-none mb-1">
            {s.value}
          </div>
          <div className="font-mono text-[11px] text-[#c4c7d4]">
            {s.sublabel}
          </div>
        </div>
      ))}
    </section>
  )
}
