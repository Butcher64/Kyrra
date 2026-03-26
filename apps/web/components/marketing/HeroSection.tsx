'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { TextReveal } from '@/components/animation/TextReveal'
import { MagneticButton } from '@/components/animation/MagneticButton'
import { HeroGradient } from './HeroGradient'

export function HeroSection() {
  return (
    <section
      data-section="hero"
      className="relative min-h-[716px] flex flex-col items-center justify-center text-center px-6 bg-grid overflow-hidden"
    >
      {/* Background orbs */}
      <HeroGradient />

      {/* Content */}
      <div className="max-w-4xl relative z-10">
        {/* Badge */}
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-label text-[var(--color-accent-cyan)] tracking-[0.2em] text-xs uppercase mb-6 block"
        >
          Pare-feu cognitif IA
        </motion.span>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold font-headline tracking-tighter mb-8 leading-[1.1]">
          <TextReveal
            tag="span"
            className="block text-slate-100"
          >
            Faites taire le bruit.
          </TextReveal>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
            className="block text-gradient"
          >
            Gardez l&apos;essentiel.
          </motion.span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed text-[var(--muted-foreground)]"
        >
          Kyrra filtre les emails de prospection par IA. Votre boîte ne garde que ce qui compte. Classification intelligente, zéro données stockées.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <MagneticButton>
            <Link
              href="/login"
              className="inline-block bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--primary)] text-white px-8 py-4 rounded-lg font-bold text-base hover:shadow-[var(--shadow-accent-md)] transition-all no-underline"
            >
              Commencer l'essai gratuit
            </Link>
          </MagneticButton>
          <a
            href="#how-it-works"
            className="inline-block px-8 py-4 rounded-lg border border-white/10 backdrop-blur-sm hover:bg-white/5 transition-all font-medium text-slate-100 no-underline"
          >
            Voir comment ça marche
          </a>
        </motion.div>
      </div>
    </section>
  )
}
