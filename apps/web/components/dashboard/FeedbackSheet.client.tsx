'use client'

import { useEffect, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useToast } from '@/components/ui/toast'
import { transitions } from '@/lib/motion'
import { submitFeedback } from '@/app/(dashboard)/actions/feedback'

/**
 * FR46 — Feedback Sheet (post-reclassification)
 * Slide-in from right (shadcn/ui Sheet pattern)
 * 3 options: false positive / wrong category / whitelist sender
 * Triggered via custom event 'kyrra:open-feedback'
 */

type FeedbackReason = 'false_positive' | 'wrong_category' | 'whitelist_sender'

const FEEDBACK_OPTIONS: { id: FeedbackReason; label: string; description: string }[] = [
  {
    id: 'false_positive',
    label: 'Faux positif',
    description: 'Ce n\'est pas de la prospection',
  },
  {
    id: 'wrong_category',
    label: 'Mauvaise catégorie',
    description: 'C\'est de la prospection, mais mal classée',
  },
  {
    id: 'whitelist_sender',
    label: 'Whitelister l\'expéditeur',
    description: 'Toujours laisser passer cet expéditeur',
  },
]

export function FeedbackSheet() {
  const [open, setOpen] = useState(false)
  const [gmailMessageId, setGmailMessageId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    function handleOpen(e: Event) {
      const detail = (e as CustomEvent).detail
      setGmailMessageId(detail.gmailMessageId)
      setSubmitted(false)
      setOpen(true)
    }

    window.addEventListener('kyrra:open-feedback', handleOpen)
    return () => window.removeEventListener('kyrra:open-feedback', handleOpen)
  }, [])

  function handleSelect(reason: FeedbackReason) {
    if (!gmailMessageId || isPending) return

    startTransition(async () => {
      const result = await submitFeedback({
        gmail_message_id: gmailMessageId,
        reason,
      })

      if (result.error) {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'envoyer votre retour. Réessayez.',
          type: 'attention',
        })
        return
      }

      setSubmitted(true)
      toast({
        title: 'Merci pour votre retour.',
        description: reason === 'whitelist_sender'
          ? 'L\'expéditeur sera whitelisté.'
          : 'Kyrra s\'améliore grâce à vous.',
        type: 'success',
      })
      setTimeout(() => setOpen(false), 1500)
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.fast}
            className="fixed inset-0 bg-[oklch(0_0_0/0.3)] z-40"
            onClick={() => setOpen(false)}
          />

          {/* Sheet — slide from right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={transitions.spring}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-(--card) z-50 border-l border-(--border) p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-(--foreground)">Aidez Kyrra à apprendre</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-(--muted-foreground) bg-transparent border-none cursor-pointer text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {!submitted ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] text-(--muted-foreground) mb-2">
                  Pourquoi cet email a-t-il été mal classé ?
                </p>
                {FEEDBACK_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    disabled={isPending}
                    className="text-left p-3 border border-(--border) bg-transparent cursor-pointer transition-colors hover:bg-(--muted) disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-[13px] font-mono font-medium text-(--foreground)">{option.label}</div>
                    <div className="text-[11px] font-mono text-(--muted-foreground) mt-0.5">{option.description}</div>
                  </button>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitions.fast}
                className="flex flex-col items-center justify-center flex-1 gap-2"
              >
                <span className="text-2xl text-[var(--color-protected)]">&#x2713;</span>
                <span className="text-[13px] text-(--muted-foreground)">Merci pour votre retour.</span>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
