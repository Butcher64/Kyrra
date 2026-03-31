const steps = [
  {
    number: '01',
    heading: 'Connectez Gmail',
    body: 'OAuth en 1 clic. Kyrra scanne vos 6 derniers mois d\'envois pour construire votre whitelist automatiquement.',
    specs: ['oauth 2.0 · scopes readonly', 'sha-256 hashed contacts', 'scan < 45 secondes'],
  },
  {
    number: '02',
    heading: 'Double moteur IA',
    body: 'Le fingerprinting traite 65-70% des emails instantanement. Le LLM analyse les cas ambigus avec precision metier.',
    specs: ['fingerprint : < 50ms', 'llm : gpt-4o-mini / haiku', 'cout : ~0.001\u20ac/email'],
  },
  {
    number: '03',
    heading: '3 labels Gmail',
    body: 'Chaque email recoit un label gradue dans votre boite. Plus un Recap quotidien chaque matin.',
    specs: ['latence totale < 2 sec', 'reconciliation adaptive', 'gmail = source de verite'],
    labels: [
      { name: 'A voir', bar: 'bar-a-voir' },
      { name: 'Filtre', bar: 'bar-filtre' },
      { name: 'Bloque', bar: 'bar-bloque' },
    ],
  },
]

export function HowItWorks() {
  return (
    <section
      data-section="how-it-works"
      id="how-it-works"
      className="bg-[#f5f6f9] bg-dot-grid px-8 lg:px-12 py-12"
    >
      {/* Section label */}
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8b90a0] mb-8">
        Architecture du pipeline
      </div>

      {/* 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`py-4 ${i === 0 ? 'md:pr-8' : i === 1 ? 'md:px-8 md:border-x md:border-[#e4e6ed]' : 'md:pl-8'} ${i > 0 ? 'border-t md:border-t-0 border-[#e4e6ed] pt-6 md:pt-4' : ''}`}
          >
            {/* Number */}
            <div className="font-mono text-[12px] text-[#c4c7d4] font-medium mb-3">
              {step.number}
            </div>

            {/* Heading */}
            <h3 className="text-[17px] font-semibold text-[#0c1a32] mb-2">
              {step.heading}
            </h3>

            {/* Body */}
            <p className="text-[13px] text-[#4a5068] leading-relaxed mb-4">
              {step.body}
            </p>

            {/* Tech specs */}
            <div className="font-mono text-[9px] text-[#8b90a0] leading-loose">
              {step.specs.map((spec, j) => (
                <div key={j}>{spec}</div>
              ))}
            </div>

            {/* Label previews (step 3 only) */}
            {step.labels && (
              <div className="flex gap-3 mt-4">
                {step.labels.map((label, j) => (
                  <div key={j} className="flex items-center gap-1.5">
                    <div className={`${label.bar} h-3`} />
                    <span className="font-mono text-[9px] text-[#8b90a0]">{label.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
