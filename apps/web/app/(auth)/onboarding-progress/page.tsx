'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'

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
    <main className="flex flex-col items-center justify-center min-h-screen px-8 max-w-[480px] mx-auto gap-6">
      {!isComplete ? (
        <>
          <h1 className="text-xl font-medium text-(--foreground)">
            Analyse en cours...
          </h1>

          {/* Progress bar — MI-3 */}
          <div className="w-full h-1 bg-(--muted) rounded-sm overflow-hidden">
            <div
              className="h-full bg-[var(--color-a-voir)] rounded-sm transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>

          {/* Real-time counters — slot machine style (MI-3) */}
          <div className="flex gap-8 mt-4">
            <div className="text-center">
              <div className="font-(family-name:--font-outfit) text-2xl font-semibold text-(--foreground)">
                {scan?.emails_processed ?? 0}
              </div>
              <div className="text-xs text-(--muted-foreground)">
                emails analysés
              </div>
            </div>
            <div className="text-center">
              <div className="font-(family-name:--font-outfit) text-2xl font-semibold text-(--foreground)">
                {scan?.contacts_found ?? 0}
              </div>
              <div className="text-xs text-(--muted-foreground)">
                contacts identifiés
              </div>
            </div>
            <div className="text-center">
              <div className="font-(family-name:--font-outfit) text-2xl font-semibold text-(--foreground)">
                {scan?.prospecting_found ?? 0}
              </div>
              <div className="text-xs text-(--muted-foreground)">
                prospections détectées
              </div>
            </div>
          </div>

          {/* Close safely message (appears at T+15s — MI-3) */}
          {showCloseMessage && (
            <p className="text-xs text-(--muted-foreground) text-center mt-4 opacity-80">
              Fermez sans souci. Le scan continue en arrière-plan.
              <br />
              Vous recevrez un email quand c&apos;est prêt.
            </p>
          )}
        </>
      ) : (
        <>
          {/* Scan complete — "wow moment" (MI-3) */}
          <span className="text-3xl text-[var(--color-protected)]">&#x2713;</span>
          <h1 className="text-xl font-medium text-(--foreground)">
            Scan terminé
          </h1>
          <p className="text-sm text-(--muted-foreground) text-center">
            {scan.total_sent} emails analysés. {scan.prospecting_found} étaient du bruit.
            <br />
            {scan.contacts_found} contacts whitelistés automatiquement.
          </p>
          <Button asChild size="lg" className="mt-4 bg-[var(--color-a-voir)] text-white hover:opacity-80">
            <a href="/">
              Voir votre tableau de bord &rarr;
            </a>
          </Button>
        </>
      )}
    </main>
  )
}
