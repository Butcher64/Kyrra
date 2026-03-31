const metrics = [
  { label: 'emails/sem', value: 847, barWidth: '85%', barColor: 'bg-[#0c1a32]' },
  { label: 'filtres', value: 312, barWidth: '37%', barColor: 'bg-[#8a2d2d]' },
  { label: 'precision', value: '99.2%', barWidth: '99%', barColor: 'bg-[#2dd881]' },
]

export function TestimonialsSection() {
  return (
    <section
      data-section="testimonials"
      className="px-8 lg:px-12 py-12 flex flex-col lg:flex-row gap-12"
    >
      {/* Left — quote */}
      <div className="flex-1 border-l-2 border-[#0c1a32] pl-6 flex flex-col justify-center">
        <p className="font-serif text-[24px] italic text-[#1a1f36] leading-relaxed mb-6">
          &ldquo;Kyrra m&apos;a fait gagner 45 minutes par jour. Je ne vois plus que les emails qui comptent vraiment.&rdquo;
        </p>
        <div>
          <div className="text-[13px] font-semibold text-[#0c1a32]">Marc Lefevre</div>
          <div className="font-mono text-[11px] text-[#8b90a0]">CEO, TechVentures · 847 emails/semaine</div>
        </div>
      </div>

      {/* Right — metrics box */}
      <div className="w-full lg:w-[220px] border border-[#e4e6ed] p-4">
        <div className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-4">
          Resultats Marc
        </div>
        <div className="flex flex-col gap-4">
          {metrics.map((m, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[9px] text-[#8b90a0]">{m.label}</span>
                <span className="font-mono text-[11px] font-semibold text-[#0c1a32]">{m.value}</span>
              </div>
              <div className="h-[2px] bg-[#e4e6ed] w-full">
                <div className={`h-full ${m.barColor}`} style={{ width: m.barWidth }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
