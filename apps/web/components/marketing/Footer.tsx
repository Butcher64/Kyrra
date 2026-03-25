import Link from 'next/link'
import { Share2, AtSign } from 'lucide-react'

const productLinks = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Intégrations', href: '#' },
  { label: 'Sécurité', href: '#security' },
  { label: 'Roadmap', href: '#' },
]

const resourceLinks = [
  { label: 'Blog', href: '#' },
  { label: "Centre d'aide", href: '#' },
  { label: 'API Docs', href: '#' },
  { label: 'Statut Système', href: '#' },
]

const legalLinks = [
  { label: 'Confidentialité', href: '/legal/privacy' },
  { label: 'CGU', href: '/legal/cgu' },
  { label: 'Cookies', href: '#' },
  { label: 'Mentions Légales', href: '#' },
]

export function Footer() {
  return (
    <footer
      data-section="footer"
      className="bg-[var(--surface-darkest)] py-24 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto px-12 grid grid-cols-1 md:grid-cols-4 gap-16">
        {/* Brand column */}
        <div className="col-span-1">
          <div className="text-2xl font-extrabold font-headline tracking-tighter text-white mb-6">
            Kyrra.
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            La plateforme de filtrage intelligent pour une souveraineté numérique retrouvée.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-colors no-underline"
              aria-label="Partager"
            >
              <Share2 className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-colors no-underline"
              aria-label="Email"
            >
              <AtSign className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Produit */}
        <div>
          <h5 className="font-label text-xs uppercase tracking-[0.2em] text-white mb-8">Produit</h5>
          <ul className="space-y-4 text-sm text-slate-500">
            {productLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-[var(--color-accent-start)] transition-colors no-underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Ressources */}
        <div>
          <h5 className="font-label text-xs uppercase tracking-[0.2em] text-white mb-8">Ressources</h5>
          <ul className="space-y-4 text-sm text-slate-500">
            {resourceLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-[var(--color-accent-start)] transition-colors no-underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Légal */}
        <div>
          <h5 className="font-label text-xs uppercase tracking-[0.2em] text-white mb-8">Légal</h5>
          <ul className="space-y-4 text-sm text-slate-500">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-[var(--color-accent-start)] transition-colors no-underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-12 mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="font-label text-[10px] text-slate-600 uppercase tracking-widest">
          © 2026 Kyrra AI. Souveraineté Numérique.
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-accent-cyan)] animate-pulse" />
          <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest">
            Systèmes Opérationnels
          </span>
        </div>
      </div>
    </footer>
  )
}
