'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '#features', label: 'Solutions' },
  { href: '#security', label: 'Sécurité' },
  { href: '#pricing', label: 'Tarifs' },
  { href: '#how-it-works', label: 'Comment ça marche' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        data-section="navbar"
        className={cn(
          'fixed top-0 w-full h-[72px] z-50 flex items-center px-10 transition-all duration-300',
          scrolled
            ? 'bg-[var(--background)]/80 backdrop-blur-xl border-b border-white/5'
            : 'bg-[var(--background)]/60 backdrop-blur-xl'
        )}
      >
        <nav className="w-full max-w-[1920px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-extrabold tracking-tighter text-slate-100 font-headline shrink-0 no-underline">
            Kyrra.
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 font-label text-[13px] tracking-wide">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-slate-400 hover:text-slate-100 transition-colors no-underline"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4 font-label text-[12px]">
            <Link href="/login" className="text-slate-400 hover:text-slate-100 transition-colors no-underline">
              Connexion
            </Link>
            <Link
              href="/login"
              className="bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--primary)] text-[var(--on-primary)] px-6 py-2.5 rounded-lg font-bold hover:scale-105 transition-all no-underline inline-block"
            >
              Démonstration
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="rounded-md p-2 text-slate-100 md:hidden bg-transparent border-none cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </header>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[var(--background)]/95 backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="font-headline text-2xl text-slate-100 no-underline"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-12 flex flex-col items-center gap-4">
              <Link
                href="/login"
                className="bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--primary)] text-[var(--on-primary)] px-8 py-3 rounded-lg font-bold no-underline"
                onClick={() => setMobileOpen(false)}
              >
                Démonstration
              </Link>
              <Link
                href="/login"
                className="text-slate-400 no-underline"
                onClick={() => setMobileOpen(false)}
              >
                Connexion
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
