const steps = [
  {
    number: '01',
    heading: 'Connectez Gmail',
    body: 'OAuth en 1 clic. Kyrra scanne vos 6 derniers mois d\'envois pour construire votre whitelist automatiquement.',
    detail: 'scan < 45 secondes',
  },
  {
    number: '02',
    heading: 'Double moteur IA',
    body: 'Le fingerprinting traite 65-70% des emails instantanement. Le LLM analyse les cas ambigus avec precision metier.',
    detail: 'latence < 2 secondes',
  },
  {
    number: '03',
    heading: '3 labels Gmail',
    body: 'Chaque email recoit un label gradue directement dans votre boite. Rien a installer, rien a apprendre.',
    detail: 'a voir · filtre · bloque',
  },
]

export function HowItWorks() {
  return (
    <section
      data-section="how-it-works"
      id="how-it-works"
      className="py-24 lg:py-32"
    >
      <div className="max-w-6xl mx-auto px-8 lg:px-16">
        {/* Section label */}
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8b90a0] mb-16">
          Comment ca marche
        </div>

        {/* Steps — vertical on mobile, horizontal with generous spacing on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-20">
          {steps.map((step, i) => (
            <div key={i}>
              {/* Number */}
              <div className="font-mono text-[13px] text-[#c4c7d4] font-medium mb-4">
                {step.number}
              </div>

              {/* Heading */}
              <h3 className="text-[20px] font-semibold text-[#0c1a32] mb-3">
                {step.heading}
              </h3>

              {/* Body */}
              <p className="text-[14px] text-[#4a5068] leading-relaxed mb-5">
                {step.body}
              </p>

              {/* Single detail line */}
              <div className="font-mono text-[10px] text-[#8b90a0] uppercase tracking-wider">
                {step.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
