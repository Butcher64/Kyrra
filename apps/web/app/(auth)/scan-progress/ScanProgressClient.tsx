'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

interface ClassifiedEmail {
  id: string
  sender_display: string
  subject_snippet: string
  label_name: string
  label_color: string
  created_at: string
}

export default function ScanProgressClient({ totalQueued }: { totalQueued: number }) {
  const router = useRouter()
  const [emails, setEmails] = useState<ClassifiedEmail[]>([])
  const [processedCount, setProcessedCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showCloseLink, setShowCloseLink] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const supabaseRef = useRef(createClient())
  const userIdRef = useRef<string | null>(null)

  // [M4 fix] Fetch user ID once on mount, store in ref
  useEffect(() => {
    supabaseRef.current.auth.getUser().then(({ data: { user } }) => {
      if (user) userIdRef.current = user.id
    })
  }, [])

  // Poll every 2 seconds for new classifications
  useEffect(() => {
    const supabase = supabaseRef.current

    async function poll() {
      const userId = userIdRef.current
      if (!userId) return

      // [M2 fix] Count only COMPLETED queue items (not failed) for progress
      const { count } = await supabase
        .from('email_queue_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('gmail_history_id', 'initial_scan')
        .eq('status', 'completed')

      const newProcessed = count ?? 0
      setProcessedCount(newProcessed)

      // [H2 fix] Always fetch the 50 most recent classifications — no lastFetchedAt filter.
      // Deduplication happens in setEmails via existingIds Set.
      // This ensures page refresh mid-scan correctly shows the latest state.
      const { data: classifications } = await supabase
        .from('email_classifications')
        .select(`
          id,
          sender_display,
          subject_snippet,
          created_at,
          label_id,
          user_labels!inner (name, color)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (classifications && classifications.length > 0) {
        // [L1 fix] Properly type the Supabase FK join result
        const mapped: ClassifiedEmail[] = classifications.map((c) => {
          const label = c.user_labels as unknown as { name: string; color: string } | null
          return {
            id: c.id,
            sender_display: c.sender_display || 'Expéditeur inconnu',
            subject_snippet: c.subject_snippet || '(sans objet)',
            label_name: label?.name ?? 'Non classifié',
            label_color: label?.color ?? '#666',
            created_at: c.created_at,
          }
        })

        setEmails((prev) => {
          const existingIds = new Set(prev.map((e) => e.id))
          const fresh = mapped.filter((e) => !existingIds.has(e.id))
          if (fresh.length === 0) return prev
          return [...fresh, ...prev]
        })
      }

      // Check completion — only successful classifications count
      if (newProcessed >= totalQueued) {
        setIsComplete(true)
      }
    }

    // Initial poll immediately
    poll()
    const interval = setInterval(poll, 2000)

    // Show "close" link after 15 seconds
    const closeTimer = setTimeout(() => setShowCloseLink(true), 15000)

    return () => {
      clearInterval(interval)
      clearTimeout(closeTimer)
    }
  }, [totalQueued])

  // Auto-redirect countdown when complete
  useEffect(() => {
    if (!isComplete) return

    setRedirectCountdown(3)
    let remaining = 3
    const countdown = setInterval(() => {
      remaining--
      if (remaining <= 0) {
        clearInterval(countdown)
        router.push('/dashboard')
      } else {
        setRedirectCountdown(remaining)
      }
    }, 1000)

    return () => clearInterval(countdown)
  }, [isComplete, router])

  const progress = totalQueued > 0
    ? Math.round((processedCount / totalQueued) * 100)
    : 0

  // Group emails by label for the completion summary
  const labelCounts = emails.reduce<Record<string, { count: number; color: string }>>((acc, e) => {
    if (!acc[e.label_name]) acc[e.label_name] = { count: 0, color: e.label_color }
    acc[e.label_name]!.count++
    return acc
  }, {})

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#0c1a32]">
      {/* [H3 fix] CSS keyframe for fade-in animation — no external dependency needed */}
      <style jsx global>{`
        @keyframes scan-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scan-row-enter {
          animation: scan-fade-in 0.3s ease-out forwards;
        }
      `}</style>

      {/* Grid pattern */}
      <div className="bg-grid absolute inset-0 opacity-[0.06]" />

      {/* Header */}
      <header className="relative z-10 flex flex-col items-center pt-12 pb-4">
        <span className="font-mono text-2xl font-bold tracking-tight text-white">
          Kyrra
        </span>
        <span className="mt-1 font-mono text-[10px] tracking-[0.25em] uppercase text-white/30">
          Classification en cours
        </span>
      </header>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[700px] mx-4 mt-4">
        <div className="p-8 border border-white/10 bg-white/[0.04]">

          {/* Title + Progress */}
          <div className="mb-6">
            <h1 className="font-mono text-xl font-bold text-white mb-1">
              {isComplete ? 'Analyse terminée' : 'Kyrra trie vos emails...'}
            </h1>
            <p className="text-sm text-white/45">
              {isComplete
                ? `${processedCount} emails classifiés avec succès.`
                : `${processedCount} / ${totalQueued} emails analysés`
              }
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="w-full h-1.5 overflow-hidden bg-white/[0.08]">
              <div
                className="h-full bg-white transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(progress, 2)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/30">
                {isComplete ? 'Terminé' : 'Classification IA'}
              </span>
              <span className="font-mono text-xs text-white/50 tabular-nums">
                {progress}%
              </span>
            </div>
          </div>

          {/* Completion summary */}
          {isComplete && Object.keys(labelCounts).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(labelCounts)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([name, { count, color }]) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-white/70 border border-white/10 bg-white/[0.05]"
                  >
                    <span
                      className="inline-block w-2 h-2"
                      style={{ backgroundColor: color }}
                    />
                    {name}: {count}
                  </span>
                ))
              }
            </div>
          )}

          {/* Redirect countdown */}
          {isComplete && redirectCountdown !== null && (
            <p className="text-xs text-white/40 mb-4">
              Redirection vers le tableau de bord dans {redirectCountdown}s...
            </p>
          )}

          {/* Email list */}
          <div className="space-y-0 max-h-[400px] overflow-y-auto">
            {emails.map((email) => (
              <div
                key={email.id}
                className="flex items-center gap-3 px-3 py-2.5 border-b border-white/5 scan-row-enter"
              >
                {/* Label color bar */}
                <span
                  className="w-[3px] h-8 shrink-0"
                  style={{ backgroundColor: email.label_color }}
                />

                {/* Email info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">
                    {email.sender_display}
                  </p>
                  <p className="text-xs text-white/35 truncate">
                    {email.subject_snippet}
                  </p>
                </div>

                {/* Label badge */}
                <span
                  className="shrink-0 px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase border"
                  style={{
                    borderColor: `${email.label_color}40`,
                    color: email.label_color,
                    backgroundColor: `${email.label_color}10`,
                  }}
                >
                  {email.label_name}
                </span>
              </div>
            ))}

            {/* Empty state while waiting for first classification */}
            {emails.length === 0 && !isComplete && (
              <div className="py-8 text-center">
                <p className="text-sm text-white/30">
                  En attente des premiers résultats...
                </p>
              </div>
            )}
          </div>

          {/* Close safely link (after 15s) */}
          {showCloseLink && !isComplete && (
            <p className="text-xs text-white/35 mt-4 text-center">
              Le tri continue en arrière-plan.{' '}
              <button
                onClick={() => router.push('/dashboard')}
                className="text-white/50 underline underline-offset-4 hover:text-white/70 transition-colors"
              >
                Aller au tableau de bord
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Trust badge */}
      <div className="relative z-10 flex items-center gap-2 pt-6 pb-8">
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
    </main>
  )
}
