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
      const { data } = await supabase
        .from('onboarding_scans')
        .select('status, total_sent, emails_processed, contacts_found, prospecting_found')
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
    <main className="flex items-center justify-center min-h-screen bg-brand-gradient relative overflow-hidden">
      {/* Grid overlay */}
      <div className="bg-grid absolute inset-0 opacity-10" />

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-[500px] mx-4 glass rounded-2xl p-10 text-center">
        {!isComplete ? (
          <>
            {/* Shield icon with pulse animation */}
            <div className="mx-auto mb-8 size-16 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
              <svg className="size-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>

            <h1 className="text-2xl font-outfit font-medium text-white mb-2">
              Kyrra analyse votre boite...
            </h1>
            <p className="text-sm text-white/50 mb-8">
              Construction de votre whitelist en cours
            </p>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-8">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${Math.max(progress, 5)}%`,
                  background: `linear-gradient(90deg, var(--color-brand-start), var(--color-brand-accent))`,
                }}
              />
            </div>

            {/* Real-time counters */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="font-outfit text-3xl font-semibold text-white tabular-nums">
                  {scan?.emails_processed ?? 0}
                </div>
                <div className="text-xs text-white/40 mt-1">
                  emails analyses
                </div>
              </div>
              <div>
                <div className="font-outfit text-3xl font-semibold text-white tabular-nums">
                  {scan?.contacts_found ?? 0}
                </div>
                <div className="text-xs text-white/40 mt-1">
                  contacts
                </div>
              </div>
              <div>
                <div className="font-outfit text-3xl font-semibold text-white tabular-nums">
                  {scan?.prospecting_found ?? 0}
                </div>
                <div className="text-xs text-white/40 mt-1">
                  prospections
                </div>
              </div>
            </div>

            {/* Close safely message (appears at T+15s — MI-3) */}
            {showCloseMessage && (
              <p className="text-xs text-white/40 mt-8 leading-relaxed">
                Fermez sans souci. Le scan continue en arriere-plan.
                <br />
                Vous recevrez un email quand c&apos;est pret.
              </p>
            )}
          </>
        ) : (
          <>
            {/* Scan complete — "wow moment" */}
            <div className="mx-auto mb-6 size-16 rounded-full bg-[var(--color-protected)]/20 flex items-center justify-center">
              <svg className="size-8 text-[var(--color-protected)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h1 className="text-2xl font-outfit font-medium text-white mb-2">
              Scan termine
            </h1>
            <p className="text-sm text-white/60 leading-relaxed mb-8">
              {scan.total_sent} emails analyses. {scan.prospecting_found} etaient du bruit.
              <br />
              {scan.contacts_found} contacts whitelistes automatiquement.
            </p>

            <a
              href="/dashboard"
              className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-white text-[var(--color-brand-start)] font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Voir votre tableau de bord &rarr;
            </a>
          </>
        )}
      </div>
    </main>
  )
}
