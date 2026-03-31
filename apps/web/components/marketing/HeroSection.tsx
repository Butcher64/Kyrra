'use client'

import Link from 'next/link'
import { m } from 'motion/react'

const emailRows = [
  {
    bar: 'bar-a-voir',
    from: 'Marc Dupont',
    subject: 'Re: Contrat Q2 — signature requise',
    tag: 'A voir',
    tagBg: 'bg-[#e8edf8]',
    tagText: 'text-[#2d4a8a]',
    confidence: '99.4%',
    time: '09:12',
  },
  {
    bar: 'bar-filtre',
    from: 'Sales Navigator',
    subject: 'Decouvrez nos solutions enterprise...',
    tag: 'Filtre',
    tagBg: 'bg-[#edeef2]',
    tagText: 'text-[#5c6070]',
    confidence: '94.1%',
    time: '09:08',
  },
  {
    bar: 'bar-bloque',
    from: 'GrowthHack Pro',
    subject: 'Boostez votre pipeline en 48h',
    tag: 'Bloque',
    tagBg: 'bg-[#f8e8e8]',
    tagText: 'text-[#8a2d2d]',
    confidence: '98.7%',
    time: '08:55',
  },
]

export function HeroSection() {
  return (
    <section data-section="hero" className="flex flex-col lg:flex-row min-h-[600px]">
      {/* Left column */}
      <div className="flex-1 pt-14 pb-12 px-8 lg:px-12 flex flex-col justify-center">
        {/* Mono label */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="w-1.5 h-1.5 bg-[#2dd881] rounded-full shadow-[0_0_4px_#2dd881]" />
          <span className="font-mono text-[11px] text-[#3a5bc7] uppercase tracking-widest">
            Classification IA en temps reel
          </span>
        </m.div>

        {/* Title */}
        <m.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-serif text-[52px] text-[#0c1a32] leading-none tracking-tight mb-1"
        >
          Faites taire
          <br />
          le bruit.
        </m.h1>

        {/* Subtitle */}
        <m.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-serif text-[52px] italic text-[#c4c7d4] leading-none tracking-tight mb-8"
        >
          Gardez l&apos;essentiel.
        </m.p>

        {/* Body */}
        <m.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[15px] text-[#4a5068] leading-relaxed max-w-[420px] mb-8"
        >
          Kyrra filtre la prospection B2B de votre boite mail grace a un double moteur IA. Vous ne gardez que ce qui compte.
        </m.p>

        {/* Buttons */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex gap-3 mb-4"
        >
          <Link
            href="/login"
            className="bg-[#0c1a32] text-white px-7 py-3 text-[13px] font-medium no-underline hover:bg-[#1a2a4a] transition-colors"
          >
            Commencer l&apos;essai gratuit
          </Link>
          <a
            href="#how-it-works"
            className="border border-[#e4e6ed] text-[#0c1a32] px-7 py-3 text-[13px] no-underline hover:bg-[#f5f6f9] transition-colors"
          >
            Voir comment ca marche
          </a>
        </m.div>

        {/* Footnote */}
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="font-mono text-[11px] text-[#8b90a0] mt-4"
        >
          14 jours gratuits · Sans carte bancaire · Setup &lt; 2min
        </m.p>
      </div>

      {/* Right column — email preview mockup */}
      <div className="flex-1 bg-[#f5f6f9] bg-dot-grid flex items-center justify-center p-8">
        <div className="w-full max-w-[480px] bg-white border border-[#e4e6ed]">
          {/* Header bar */}
          <div className="bg-[#f5f6f9] border-b border-[#e4e6ed] px-4 py-2.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#0c1a32]">Boite de reception</span>
            <span className="font-mono text-[9px] text-[#8b90a0] uppercase tracking-wider">trie par kyrra</span>
          </div>

          {/* Email rows */}
          <div>
            {emailRows.map((email, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b border-[#e4e6ed] last:border-b-0"
              >
                {/* Color bar */}
                <div className={`${email.bar} h-8 shrink-0`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[#0c1a32] truncate">{email.from}</div>
                  <div className="text-[11px] text-[#8b90a0] truncate">{email.subject}</div>
                </div>

                {/* Tag */}
                <span className={`${email.tagBg} ${email.tagText} font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider shrink-0`}>
                  {email.tag}
                </span>

                {/* Confidence + time */}
                <div className="text-right shrink-0">
                  <div className="font-mono text-[9px] text-[#4a5068]">{email.confidence}</div>
                  <div className="font-mono text-[9px] text-[#c4c7d4]">{email.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom status bar */}
          <div className="bg-[#f5f6f9] border-t border-[#e4e6ed] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-[#2dd881] rounded-full shadow-[0_0_4px_#2dd881]" />
              <span className="font-mono text-[9px] text-[#8b90a0]">pipeline actif</span>
            </div>
            <span className="font-mono text-[9px] text-[#c4c7d4]">47 emails traites aujourd&apos;hui</span>
          </div>
        </div>
      </div>
    </section>
  )
}
