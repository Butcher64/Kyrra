'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useInView } from 'motion/react'
import { Mail } from 'lucide-react'

interface Email {
  id: number
  label: string
  category: 'a-voir' | 'filtre' | 'bloque'
  delay: number
}

interface Category {
  key: 'a-voir' | 'filtre' | 'bloque'
  label: string
  color: string
}

const emails: Email[] = [
  { id: 1, label: 'Reunion equipe lundi', category: 'a-voir', delay: 0 },
  { id: 2, label: 'Offre exceptionnelle -50%', category: 'filtre', delay: 0.4 },
  { id: 3, label: 'Facture N°2847', category: 'a-voir', delay: 0.8 },
  { id: 4, label: 'Decouvrez notre solution IA', category: 'bloque', delay: 1.2 },
  { id: 5, label: 'Votre partenaire growth', category: 'filtre', delay: 1.6 },
]

const categories: Category[] = [
  { key: 'a-voir', label: 'A voir', color: 'var(--color-a-voir)' },
  { key: 'filtre', label: 'Filtre', color: 'var(--color-filtre)' },
  { key: 'bloque', label: 'Bloque', color: 'var(--color-bloque)' },
]

const rotations: Record<number, number> = {
  1: -1.5,
  2: 1,
  3: -0.5,
  4: 2,
  5: -1,
}

export function EmailSortAnimation() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [sorted, setSorted] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isInView) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSorted(new Set(emails.map((e) => e.id)))
      return
    }

    const timeouts: ReturnType<typeof setTimeout>[] = []

    emails.forEach((email) => {
      const t = setTimeout(() => {
        setSorted((prev) => new Set([...prev, email.id]))
      }, email.delay * 1000)
      timeouts.push(t)
    })

    return () => timeouts.forEach(clearTimeout)
  }, [isInView])

  return (
    <section
      ref={ref}
      data-section="email-sort"
      className="py-16 overflow-hidden"
    >
      <div className="mx-auto max-w-[800px] px-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <div key={cat.key} className="flex flex-col items-center">
              <span
                className="mb-4 rounded-full px-2 py-1 text-[10px] font-medium sm:px-3 sm:text-xs"
                style={{
                  backgroundColor: `color-mix(in oklch, ${cat.color} 15%, transparent)`,
                  color: cat.color,
                }}
              >
                {cat.label}
              </span>

              <div className="flex w-full flex-col gap-2">
                <AnimatePresence>
                  {emails
                    .filter(
                      (e) =>
                        e.category === cat.key && sorted.has(e.id)
                    )
                    .map((email) => (
                      <motion.div
                        key={email.id}
                        initial={{
                          opacity: 0,
                          y: -40,
                          rotate: rotations[email.id] ?? 0,
                        }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          damping: 20,
                        }}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-2 sm:px-3 sm:py-2.5"
                      >
                        <Mail
                          size={12}
                          className="shrink-0 text-[var(--muted-foreground)] sm:w-3.5"
                        />
                        <span className="truncate text-[10px] text-[var(--foreground)] sm:text-xs">
                          {email.label}
                        </span>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
