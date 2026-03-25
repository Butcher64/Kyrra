'use client'

import { CountUp } from '@/components/animation'

export function SocialProof() {
  return (
    <section
      data-section="social-proof"
      className="py-20 border-y border-white/5 bg-[var(--surface-lowest)]"
    >
      <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div>
          <div className="text-4xl font-headline font-bold text-white mb-2">
            <CountUp value={25} suffix="+" /> dirigeants
          </div>
          <div className="font-label text-xs text-slate-500 uppercase tracking-widest">
            Utilisent Kyrra au quotidien
          </div>
        </div>
        <div className="md:border-x md:border-white/5">
          <div className="text-4xl font-headline font-bold text-[var(--color-accent-start)] mb-2">
            <CountUp value={99.2} suffix="%" /> précision
          </div>
          <div className="font-label text-xs text-slate-500 uppercase tracking-widest">
            De filtrage IA certifié
          </div>
        </div>
        <div>
          <div className="text-4xl font-headline font-bold text-white mb-2">
            0 faux positifs
          </div>
          <div className="font-label text-xs text-slate-500 uppercase tracking-widest">
            Garanti par nos algorithmes
          </div>
        </div>
      </div>
    </section>
  )
}
