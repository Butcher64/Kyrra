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

    // Show "close safely" message after 15 seconds
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
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      maxWidth: '480px',
      margin: '0 auto',
      gap: '1.5rem',
    }}>
      {!isComplete ? (
        <>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 500 }}>
            Analyse en cours...
          </h1>

          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '4px',
            background: '#f3f4f6',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.max(progress, 5)}%`,
              background: '#2563eb',
              borderRadius: '2px',
              transition: 'width 0.5s ease',
            }} />
          </div>

          {/* Real-time counters */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {scan?.emails_processed ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                emails analysés
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {scan?.contacts_found ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                contacts identifiés
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {scan?.prospecting_found ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                prospections détectées
              </div>
            </div>
          </div>

          {/* Close safely message (appears at T+15s) */}
          {showCloseMessage && (
            <p style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              textAlign: 'center',
              marginTop: '1rem',
              opacity: 0.8,
            }}>
              Fermez sans souci. Le scan continue en arrière-plan.
              <br />
              Vous recevrez un email quand c&apos;est prêt.
            </p>
          )}
        </>
      ) : (
        <>
          {/* Scan complete — "wow moment" */}
          <div style={{ fontSize: '2rem' }}>✓</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 500 }}>
            Scan terminé
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
            {scan.total_sent} emails analysés. {scan.prospecting_found} étaient du bruit.
            <br />
            {scan.contacts_found} contacts whitelistés automatiquement.
          </p>
          <a
            href="/"
            style={{
              marginTop: '1rem',
              padding: '0.75rem 2rem',
              background: '#2563eb',
              color: 'white',
              borderRadius: '8px',
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            Voir votre tableau de bord →
          </a>
        </>
      )}
    </main>
  )
}
