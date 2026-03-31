import Link from 'next/link'

export function CTASection() {
  return (
    <section
      data-section="cta-final"
      className="bg-[#0c1a32] section-navy bg-noise relative px-8 lg:px-12 py-12"
    >
      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
        {/* Left */}
        <div>
          <h2 className="font-serif text-[30px] text-white leading-tight mb-2">
            Pret pour le calme ?
          </h2>
          <p className="font-mono text-[12px] text-white/30">
            14 jours gratuits · sans carte bancaire · setup &lt; 2min
          </p>
        </div>

        {/* Right — CTA button */}
        <Link
          href="/login"
          className="bg-white text-[#0c1a32] px-9 py-3.5 text-[14px] font-semibold no-underline hover:bg-[#f5f6f9] transition-colors shrink-0"
        >
          Essayer Kyrra →
        </Link>
      </div>
    </section>
  )
}
