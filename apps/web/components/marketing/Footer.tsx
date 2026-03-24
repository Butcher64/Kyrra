import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'

export function Footer() {
  return (
    <footer className="bg-(--sidebar-bg) py-8 text-sm text-white/50">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <Logo variant="white" />
          <span>&copy; 2026 Kyrra. Tous droits reserves.</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/legal/cgu" className="hover:text-white/70 transition-colors">
            CGU
          </Link>
          <span className="text-white/20">|</span>
          <Link href="/legal/confidentialite" className="hover:text-white/70 transition-colors">
            Confidentialite
          </Link>
          <span className="text-white/20">|</span>
          <a href="mailto:legal@kyrra.io" className="hover:text-white/70 transition-colors">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  )
}
