import Link from 'next/link'

export function Footer() {
  return (
    <footer
      data-section="footer"
      className="border-t border-[#e4e6ed] px-12 py-5 flex flex-col sm:flex-row justify-between items-center gap-3"
    >
      {/* Left: copyright + links */}
      <div className="flex items-center gap-6">
        <span className="font-mono text-[11px] text-[#8b90a0]">&copy; 2026 Kyrra</span>
        <Link href="/legal/privacy" className="font-mono text-[11px] text-[#8b90a0] no-underline hover:text-[#4a5068] transition-colors">
          Confidentialite
        </Link>
        <Link href="/legal/cgu" className="font-mono text-[11px] text-[#8b90a0] no-underline hover:text-[#4a5068] transition-colors">
          CGU
        </Link>
        <a href="mailto:support@kyrra.io" className="font-mono text-[11px] text-[#8b90a0] no-underline hover:text-[#4a5068] transition-colors">
          Support
        </a>
      </div>

      {/* Right: status */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 bg-[#2dd881] rounded-full shadow-[0_0_4px_#2dd881]" />
        <span className="font-mono text-[9px] text-[#8b90a0]">all systems operational</span>
      </div>
    </footer>
  )
}
