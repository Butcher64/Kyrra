'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SectionHeader } from './SectionHeader'
import { cn } from '@/lib/utils'

const testimonials = [
  {
    quote: "Kyrra m'a fait gagner 45 minutes par jour. Je ne vois plus que les emails qui comptent.",
    name: 'Thomas B.',
    role: 'CEO, TechStartup',
    initials: 'TB',
  },
  {
    quote: 'En 3 jours, ma boîte était transformée. Le silence est enfin revenu.',
    name: 'Marie L.',
    role: 'Directrice Generale',
    initials: 'ML',
  },
  {
    quote: "La précision est bluffante. Aucun email important n'a été mal classé en 2 mois.",
    name: 'Pierre D.',
    role: 'Fondateur, SaaS',
    initials: 'PD',
  },
  {
    quote: 'Le setup a pris 2 minutes. Littéralement. Et ça marche depuis sans intervention.',
    name: 'Sophie R.',
    role: 'Directrice Operations',
    initials: 'SR',
  },
]

export function TestimonialsSection() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setIndex((i) => (i + 1) % testimonials.length), [])
  const prev = useCallback(() => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length), [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [paused, next])

  const t = testimonials[index]!

  return (
    <section
      data-section="testimonials"
      className="py-24 md:py-32"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-[800px] px-6">
        <SectionHeader badge="Témoignages" title="Ils nous font confiance" align="center" />

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center"
            >
              <p className="text-lg italic leading-relaxed text-[var(--foreground)]">"{t.quote}"</p>
              <footer className="mt-6 flex items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-start)]/20 text-sm font-semibold text-[var(--color-accent-start)]">
                  {t.initials}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{t.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{t.role}</p>
                </div>
              </footer>
            </motion.blockquote>
          </AnimatePresence>

          {/* Nav arrows */}
          <button
            onClick={prev}
            className="absolute left-[-48px] top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--card)] p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors hidden md:block cursor-pointer"
            aria-label="Précédent"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            className="absolute right-[-48px] top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--card)] p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors hidden md:block cursor-pointer"
            aria-label="Suivant"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Dots */}
        <div className="mt-6 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors cursor-pointer border-none p-0',
                i === index ? 'bg-[var(--color-accent-start)]' : 'bg-[var(--border)]'
              )}
              aria-label={`Témoignage ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
