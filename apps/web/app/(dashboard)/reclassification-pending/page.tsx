'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

export default function ReclassificationPendingPage() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get('request_id')
  const [status, setStatus] = useState<'pending' | 'processing' | 'done' | 'failed'>('pending')

  useEffect(() => {
    if (!requestId) return

    const supabase = createClient()
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('reclassification_requests')
        .select('status')
        .eq('token_id', requestId)
        .single()

      if (data?.status) {
        setStatus(data.status as typeof status)
        if (data.status === 'done' || data.status === 'failed') {
          clearInterval(interval)
          if (data.status === 'done') {
            setTimeout(() => { window.location.href = '/' }, 2000)
          }
        }
      }
    }, 2000) // Poll every 2s

    return () => clearInterval(interval)
  }, [requestId])

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
    }}>
      {status === 'done' ? (
        <>
          <div style={{ fontSize: '2rem', color: '#22c55e' }}>✓</div>
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>Email reclassifié. Kyrra a appris.</p>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Redirection vers le tableau de bord...</p>
        </>
      ) : status === 'failed' ? (
        <>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>La reclassification a échoué.</p>
          <a href="/" style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}>
            Ouvrir le tableau de bord →
          </a>
        </>
      ) : (
        <>
          <div style={{
            width: '24px', height: '24px',
            border: '2px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Reclassification en cours...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </main>
  )
}
