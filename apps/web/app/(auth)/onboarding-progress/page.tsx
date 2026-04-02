'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

type ScanStatus = {
  status: 'pending' | 'scanning' | 'completed' | 'failed'
  total_sent: number
  emails_processed: number
  contacts_found: number
  prospecting_found: number
}

export default function OnboardingProgressPage() {
  const [scan, setScan] = useState<ScanStatus | null>(null)
  const [showCloseMessage, setShowCloseMessage] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Poll scan progress every 3 seconds (NFR-PERF-09)
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('onboarding_scans')
        .select('status, total_sent, emails_processed, contacts_found, prospecting_found')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setScan(data as ScanStatus)
      }
    }, 3000)

    // Show "close safely" message after 15 seconds (MI-3)
    const closeTimer = setTimeout(() => setShowCloseMessage(true), 15000)

    return () => {
      clearInterval(interval)
      clearTimeout(closeTimer)
    }
  }, [])

  const isComplete = scan?.status === 'completed'
  const progress = scan?.total_sent
    ? Math.round((scan.emails_processed / scan.total_sent) * 100)
    : 0

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-[#0c1a32]"
    >
      {/* Grid pattern overlay */}
      <div className="bg-grid absolute inset-0 opacity-[0.06]" />

      {/* Header */}
      <header className="relative z-10 flex flex-col items-center pt-12 pb-4">
        <span className="font-mono text-2xl font-bold tracking-tight text-white">
          Kyrra
        </span>
        <span className="mt-1 font-mono text-[10px] tracking-[0.25em] uppercase text-white/30">
          Souverainet&eacute; Num&eacute;rique
        </span>
      </header>

      {/* Center: glass card */}
      <div className="relative z-10 w-full max-w-[600px] mx-4">
        {!isComplete ? (
          <div
            className="p-10 text-center border border-white/10 bg-white/[0.04]"
          >
            {/* Shield icon */}
            <div
              className="mx-auto mb-8 flex size-16 items-center justify-center bg-white/[0.08]"
            >
              <svg
                className="size-7 text-white/80 animate-pulse"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="font-mono text-2xl font-bold text-white mb-2">
              Kyrra analyse votre bo&icirc;te...
            </h1>
            <p className="text-sm text-white/45 mb-8">
              S&eacute;curisation de vos flux de donn&eacute;es en temps r&eacute;el
            </p>

            {/* Progress section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/40">
                  Indexation IA
                </span>
                <span className="font-mono text-sm font-semibold text-white/70 tabular-nums">
                  {Math.max(progress, 0)}%
                </span>
              </div>
              <div
                className="w-full h-1.5 overflow-hidden bg-white/[0.08]"
              >
                <div
                  className="h-full bg-white transition-[width] duration-700 ease-out"
                  style={{
                    width: `${Math.max(progress, 3)}%`,
                  }}
                />
              </div>
            </div>

            {/* Counters row — 3 inner glass cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {/* Emails analysés */}
              <div
                className="py-4 px-3 flex flex-col items-center border border-white/10 bg-white/[0.05]"
              >
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {(scan?.emails_processed ?? 0).toLocaleString('fr-FR')}
                </span>
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-white/35 mt-1">
                  Emails analys&eacute;s
                </span>
              </div>

              {/* Contacts */}
              <div
                className="py-4 px-3 flex flex-col items-center border border-white/10 bg-white/[0.05]"
              >
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {(scan?.contacts_found ?? 0).toLocaleString('fr-FR')}
                </span>
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-white/35 mt-1">
                  Contacts
                </span>
              </div>

              {/* Prospections */}
              <div
                className="py-4 px-3 flex flex-col items-center border border-white/20 bg-white/[0.08]"
              >
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {(scan?.prospecting_found ?? 0).toLocaleString('fr-FR')}
                </span>
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-white/40 mt-1">
                  Prospections
                </span>
              </div>
            </div>

            {/* Close safely message (T+15s — MI-3) */}
            {showCloseMessage && (
              <p className="text-xs text-white/35 mt-2 leading-relaxed">
                Fermez sans souci. Le scan continue en arri&egrave;re-plan.
                <br />
                Vous recevrez un email quand c&apos;est pr&ecirc;t.
                <br />
                <a
                  href="/configure-profile"
                  className="inline-block mt-2 text-white/50 underline underline-offset-4 hover:text-white/70 transition-colors"
                >
                  Aller au tableau de bord &rarr;
                </a>
              </p>
            )}
          </div>
        ) : (
          /* Completed state */
          <div
            className="p-10 text-center border border-white/10 bg-white/[0.04]"
          >
            <div
              className="mx-auto mb-6 flex size-16 items-center justify-center bg-[var(--color-protected)]/15"
            >
              <svg
                className="size-8"
                style={{ color: 'oklch(0.627 0.194 149.214)' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h1 className="font-mono text-2xl font-bold text-white mb-2">
              Scan termin&eacute;
            </h1>
            <p className="text-sm text-white/50 leading-relaxed mb-8">
              {scan.total_sent} emails analys&eacute;s. {scan.prospecting_found} &eacute;taient du bruit.
              <br />
              {scan.contacts_found} contacts whitelistés automatiquement.
            </p>

            <a
              href="/configure-profile"
              className="inline-flex items-center justify-center h-11 px-8 bg-white text-[#0c1a32] font-mono font-medium text-sm transition-opacity hover:opacity-90"
            >
              Configurer votre profil &rarr;
            </a>
          </div>
        )}
      </div>

      {/* Trust badges below card */}
      <div className="relative z-10 flex flex-col items-center gap-4 pb-6 pt-8">
        {/* AES-256 */}
        <div className="flex items-center gap-2">
          <svg
            className="size-3.5 text-white/30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/30">
            Chiffrement AES-256 Actif
          </span>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-2">
          {/* Stacked avatar circles */}
          <div className="flex -space-x-1.5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex size-6 items-center justify-center border border-white/10 text-[9px] font-mono font-semibold text-white bg-white/10"
              >
                {i === 1 ? 'M' : 'A'}
              </div>
            ))}
          </div>
          <span className="text-xs text-white/40">
            Rejoint par <span className="text-white/60">+2&nbsp;400</span> entreprises cette semaine
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 px-8 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-mono text-xs font-semibold text-white/40">
            Kyrra AI
          </span>
          <nav className="hidden sm:flex items-center gap-4">
            {['Confidentialite', 'CGU', 'Contact', 'Statut Systeme'].map((item) => (
              <span key={item} className="text-[11px] text-white/25 cursor-default">
                {item}
              </span>
            ))}
          </nav>
          <span className="text-[11px] text-white/25">
            &copy; 2024 Kyrra AI. Souverainet&eacute; Num&eacute;rique.
          </span>
        </div>
      </footer>
    </main>
  )
}
