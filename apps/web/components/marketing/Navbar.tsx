'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const navLinks = [
  { href: '#product', label: 'Produit' },
  { href: '#security', label: 'Securite' },
  { href: '#pricing', label: 'Tarifs' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header
        data-section="navbar"
        className="w-full bg-white border-b border-[#e4e6ed] px-12 py-3.5 flex items-center justify-between z-50 relative"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-5 h-5 bg-[#0c1a32] flex items-center justify-center">
            <div className="w-[9px] h-[9px] border-[1.5px] border-white" />
          </div>
          <span className="text-[15px] font-bold text-[#0c1a32] tracking-tighter">Kyrra</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] text-[#4a5068] font-medium no-underline hover:text-[#0c1a32] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-5">
          <Link href="/login" className="text-[13px] text-[#8b90a0] no-underline hover:text-[#4a5068] transition-colors">
            Connexion
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 bg-[#0c1a32] text-white text-[13px] font-medium no-underline hover:bg-[#1a2a4a] transition-colors"
          >
            Essai gratuit →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="p-2 text-[#0c1a32] md:hidden bg-transparent border-none cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white md:hidden"
          >
            {/* Close button in top right */}
            <button
              className="absolute top-4 right-4 p-2 text-[#0c1a32] bg-transparent border-none cursor-pointer"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
            >
              <X size={24} />
            </button>

            <nav className="flex flex-col items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="text-2xl font-bold text-[#0c1a32] no-underline"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-12 flex flex-col items-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3 bg-[#0c1a32] text-white text-[14px] font-medium no-underline"
                onClick={() => setMobileOpen(false)}
              >
                Essai gratuit →
              </Link>
              <Link
                href="/login"
                className="text-[#8b90a0] text-[13px] no-underline"
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
