'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { createClient } from '@/lib/supabase/browser'
import { transitions } from '@/lib/motion'

/**
 * MI-10 — Token redemption pending page
 * Spinner → poll 2s → checkmark morph (400ms) → "Email reclassifie. Kyrra a appris." → redirect dashboard
 * If expired: neutral message + "Ouvrir le dashboard" CTA
 */

type Status = 'pending' | 'processing' | 'done' | 'failed'

export default function ReclassificationPendingPage() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get('request_id')
  const [status, setStatus] = useState<Status>('pending')

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
        setStatus(data.status as Status)
        if (data.status === 'done' || data.status === 'failed') {
          clearInterval(interval)
          if (data.status === 'done') {
            setTimeout(() => { window.location.href = '/dashboard' }, 2000)
          }
        }
      }
    }, 2000) // Poll every 2s

    return () => clearInterval(interval)
  }, [requestId])

  return (
    <main className="flex justify-center items-center min-h-screen px-6">
      <div className="w-full max-w-[320px] text-center">
        <AnimatePresence mode="wait">
          {status === 'done' ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col items-center gap-3"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...transitions.spring, delay: 0.1 }}
                className="text-3xl text-[var(--color-protected)]"
              >
                &#x2713;
              </motion.span>
              <p className="text-[15px] font-mono font-medium text-(--foreground)">
                Email reclassifié. Kyrra a appris.
              </p>
              <p className="text-[11px] font-mono text-(--muted-foreground)">
                Redirection vers le tableau de bord...
              </p>
            </motion.div>
          ) : status === 'failed' ? (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transitions.fast}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-[15px] font-mono text-(--muted-foreground)">
                La reclassification a échoué.
              </p>
              <a
                href="/dashboard"
                className="text-[13px] font-mono text-[var(--color-a-voir)] no-underline font-medium transition-opacity hover:opacity-70"
              >
                Ouvrir le tableau de bord &rarr;
              </a>
            </motion.div>
          ) : (
            <motion.div
              key="pending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transitions.fast}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="size-6 border-2 border-(--border) border-t-[var(--color-a-voir)]"
              />
              <p className="text-[13px] font-mono text-(--muted-foreground)">
                Reclassification en cours...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
