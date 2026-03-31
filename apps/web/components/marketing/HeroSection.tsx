'use client'

import Link from 'next/link'
import { m } from 'motion/react'
import { Shield } from 'lucide-react'

const emailRows = [
  {
    bar: 'bar-a-voir',
    from: 'Marc Dupont',
    subject: 'Re: Contrat Q2 — signature requise',
    tag: 'A voir',
    tagBg: 'bg-[#e8edf8]',
    tagText: 'text-[#2d4a8a]',
  },
  {
    bar: 'bar-filtre',
    from: 'Sales Navigator',
    subject: 'Decouvrez nos solutions enterprise...',
    tag: 'Filtre',
    tagBg: 'bg-[#edeef2]',
    tagText: 'text-[#5c6070]',
    opacity: 'opacity-50',
  },
  {
    bar: 'bar-bloque',
    from: 'GrowthHack Pro',
    subject: 'Boostez votre pipeline en 48h',
    tag: 'Bloque',
    tagBg: 'bg-[#f8e8e8]',
    tagText: 'text-[#8a2d2d]',
    opacity: 'opacity-25',
  },
]

export function HeroSection() {
  return (
    <section data-section="hero" className="min-h-screen flex flex-col lg:flex-row">
      {/* Left column */}
      <div className="flex-1 px-8 lg:px-16 flex flex-col justify-center py-20 lg:py-0">
        <div className="max-w-[520px]">
          {/* Badge */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2.5 mb-10"
          >
            <Shield size={14} className="text-[#3a5bc7]" />
            <span className="font-mono text-[11px] text-[#3a5bc7] uppercase tracking-widest">
              Pare-feu email intelligent
            </span>
          </m.div>

          {/* Title */}
          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-[52px] lg:text-[64px] text-[#0c1a32] leading-[0.95] tracking-tight mb-3"
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
            className="font-serif text-[52px] lg:text-[64px] italic text-[#c4c7d4] leading-[0.95] tracking-tight mb-10"
          >
            Gardez l&apos;essentiel.
          </m.p>

          {/* Body */}
          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-[16px] text-[#4a5068] leading-relaxed mb-10"
          >
            Kyrra filtre la prospection de votre boite mail et organise le reste avec des labels intelligents. Vous ne gardez que ce qui compte.
          </m.p>

          {/* Buttons */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex gap-4 mb-5"
          >
            <Link
              href="/login"
              className="bg-[#0c1a32] text-white px-8 py-3.5 text-[14px] font-medium no-underline hover:bg-[#1a2a4a] transition-colors"
            >
              Commencer — c&apos;est gratuit
            </Link>
            <a
              href="#how-it-works"
              className="border border-[#e4e6ed] text-[#0c1a32] px-8 py-3.5 text-[14px] no-underline hover:bg-[#f5f6f9] transition-colors"
            >
              Comment ca marche
            </a>
          </m.div>

          {/* Footnote */}
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="font-mono text-[11px] text-[#8b90a0]"
          >
            14 jours gratuits · Sans carte bancaire · Setup &lt; 2min
          </m.p>
        </div>
      </div>

      {/* Right column — product preview */}
      <div className="flex-1 bg-[#f5f6f9] bg-dot-grid flex items-center justify-center p-8 lg:p-12">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-[440px] bg-white border border-[#e4e6ed]"
        >
          {/* Header bar */}
          <div className="bg-[#f5f6f9] border-b border-[#e4e6ed] px-5 py-3 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#0c1a32]">Boite de reception</span>
            <span className="font-mono text-[9px] text-[#8b90a0] uppercase tracking-wider">trie par kyrra</span>
          </div>

          {/* Email rows */}
          {emailRows.map((email, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-5 py-3.5 border-b border-[#f5f6f9] last:border-b-0 ${email.opacity || ''}`}
            >
              <div className={`${email.bar} h-7 shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[#0c1a32] truncate">{email.from}</div>
                <div className="text-[11px] text-[#8b90a0] truncate">{email.subject}</div>
              </div>
              <span className={`${email.tagBg} ${email.tagText} font-mono text-[8px] px-2 py-0.5 uppercase tracking-wider shrink-0 font-semibold`}>
                {email.tag}
              </span>
            </div>
          ))}

          {/* Status bar */}
          <div className="bg-[#f5f6f9] border-t border-[#e4e6ed] px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="status-dot" style={{ width: 4, height: 4 }} />
              <span className="font-mono text-[9px] text-[#8b90a0]">pipeline actif</span>
            </div>
            <span className="font-mono text-[9px] text-[#c4c7d4]">47 traites aujourd&apos;hui</span>
          </div>
        </m.div>
      </div>
    </section>
  )
}
