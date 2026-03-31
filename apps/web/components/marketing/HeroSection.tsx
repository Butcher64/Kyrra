'use client'

import Link from 'next/link'
import { m } from 'motion/react'

export function HeroSection() {
  return (
    <section data-section="hero" className="min-h-screen flex flex-col justify-center px-8 lg:px-16 xl:px-24 relative">
      {/* Dot grid background — subtle, right side only */}
      <div className="absolute inset-y-0 right-0 w-1/3 bg-dot-grid pointer-events-none hidden lg:block" />

      <div className="max-w-[720px] relative z-10">
        {/* Mono label */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 mb-10"
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
          className="font-serif text-[56px] lg:text-[72px] text-[#0c1a32] leading-[0.95] tracking-tight mb-3"
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
          className="font-serif text-[56px] lg:text-[72px] italic text-[#c4c7d4] leading-[0.95] tracking-tight mb-12"
        >
          Gardez l&apos;essentiel.
        </m.p>

        {/* Body */}
        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[17px] text-[#4a5068] leading-relaxed max-w-[480px] mb-10"
        >
          Kyrra filtre la prospection B2B de votre boite mail grace a un double moteur IA. Vous ne gardez que ce qui compte.
        </m.p>

        {/* Buttons */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex gap-4 mb-6"
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
    </section>
  )
}
