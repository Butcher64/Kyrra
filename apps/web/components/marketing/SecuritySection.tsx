const statusItems = [
  'RGPD conforme',
  'Hebergement UE',
  'Zero retention',
  'E2E chiffrement',
]

export function SecuritySection() {
  return (
    <section
      data-section="security"
      id="security"
      className="bg-[#0c1a32] section-navy bg-noise relative px-8 lg:px-12 py-12"
    >
      <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-start">
        {/* Left */}
        <div className="flex-1">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40 mb-4">
            Souverainete
          </div>
          <h2 className="font-serif text-[30px] text-white leading-tight mb-4">
            Vos donnees
            <br />
            restent en Europe.
          </h2>
          <p className="text-[14px] text-white/40 leading-relaxed max-w-[400px]">
            Aucune donnee email n&apos;est stockee sur nos serveurs. Le traitement est ephemere, chiffre, et conforme aux normes europeennes les plus strictes.
          </p>
        </div>

        {/* Right — status items */}
        <div className="flex flex-col gap-3">
          {statusItems.map((item, i) => (
            <div
              key={i}
              className="border border-white/[0.08] px-4 py-2 flex items-center gap-3"
            >
              <div className="w-1 h-1 bg-[#2dd881] rounded-full shadow-[0_0_4px_#2dd881]" />
              <span className="font-mono text-[9px] text-white/50 uppercase tracking-wider">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
