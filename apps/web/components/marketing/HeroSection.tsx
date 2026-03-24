'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-brand-gradient animate-gradient">
      {/* Dot overlay */}
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-30" />

      {/* Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.12 }}
        className="relative z-10 mx-auto max-w-[800px] px-6 text-center"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <span className="glass inline-block rounded-full px-4 py-1.5 font-mono text-xs text-white/80">
            Pare-feu cognitif pour dirigeants
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-8 font-outfit text-5xl font-light leading-tight text-white md:text-7xl"
        >
          Faites taire le bruit.
          <br />
          <span className="font-mono text-(--color-brand-accent)">
            Gardez l&apos;essentiel.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-6 max-w-[560px] text-lg text-white/70"
        >
          L&apos;IA qui filtre les emails de prospection pour les dirigeants.
          Aucun email important n&apos;est perdu. Jamais.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Button variant="brand" size="lg" className="glow-brand" asChild>
            <Link href="/login">Essai gratuit 14 jours →</Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="border border-white/20 text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <a href="#features">Voir comment ca marche</a>
          </Button>
        </motion.div>

        {/* Micro-text */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-6 font-mono text-xs text-white/40"
        >
          Pas de carte bancaire requise · Gmail uniquement
        </motion.p>
      </motion.div>

      {/* Bottom gradient fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[200px]"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--background))',
        }}
      />
    </section>
  )
}
