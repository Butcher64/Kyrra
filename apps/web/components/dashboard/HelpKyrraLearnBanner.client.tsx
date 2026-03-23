'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { transitions } from '@/lib/motion'
import { acknowledgeLabelSignals } from '@/app/(dashboard)/actions/feedback'

/**
 * B3.2 — "Help Kyrra Learn" banner
 * Shown when unacknowledged label_change_signals exist
 * Amber-50 dismissible banner with CTA to open FeedbackSheet
 */
export function HelpKyrraLearnBanner({
  signalCount,
  gmailMessageId,
}: {
  signalCount: number
  gmailMessageId: string | null
}) {
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (dismissed || signalCount === 0) return null

  function handleExplain() {
    // Open the FeedbackSheet via custom event
    window.dispatchEvent(
      new CustomEvent('kyrra:open-feedback', {
        detail: { gmailMessageId },
      }),
    )
  }

  function handleDismiss() {
    startTransition(async () => {
      await acknowledgeLabelSignals(null)
      setDismissed(true)
    })
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={transitions.fast}
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-[13px] font-medium text-amber-900 dark:text-amber-200">
                Vous avez modifié un label dans Gmail.
              </p>
              <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                Aidez Kyrra à comprendre pour mieux filtrer à l&#39;avenir.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              disabled={isPending}
              className="text-amber-400 bg-transparent border-none cursor-pointer text-lg leading-none hover:text-amber-600 dark:hover:text-amber-300"
              aria-label="Fermer"
            >
              &times;
            </button>
          </div>
          <button
            onClick={handleExplain}
            className="mt-3 rounded-md bg-amber-600 px-3 py-1.5 text-[12px] font-medium text-white border-none cursor-pointer transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            Expliquer
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
