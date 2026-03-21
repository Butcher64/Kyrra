'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { reclassifyEmail } from '@/app/(dashboard)/actions/classification'
import { addToWhitelist } from '@/app/(dashboard)/actions/whitelist'
import { transitions } from '@/lib/motion'

/**
 * MI-1 — Reclassification button
 * T+50ms press → T+150ms green pulse → T+200ms "Compris" →
 * T+500ms toast "Kyrra a appris" + whitelist sub-line → T+3s toast fade
 * Post-toast: opt-in feedback link (FR46)
 */

interface ReclassifyButtonProps {
  gmailMessageId: string
  senderEmail?: string
  onReclassified?: () => void
}

type ButtonState = 'idle' | 'pulsing' | 'confirmed' | 'done'

export function ReclassifyButton({ gmailMessageId, senderEmail, onReclassified }: ReclassifyButtonProps) {
  const [state, setState] = useState<ButtonState>('idle')
  const [showFeedbackLink, setShowFeedbackLink] = useState(false)
  const { toast } = useToast()

  async function handleReclassify() {
    if (state !== 'idle') return

    // T+50ms: Green pulse
    setState('pulsing')

    // T+200ms: "Compris"
    setTimeout(() => setState('confirmed'), 150)

    // Execute reclassification + whitelist in parallel
    const idempotencyKey = `reclass-${gmailMessageId}-${Date.now()}`

    const [reclassResult] = await Promise.all([
      reclassifyEmail({
        email_id: gmailMessageId,
        gmail_message_id: gmailMessageId,
        idempotency_key: idempotencyKey,
      }),
      // Auto-whitelist sender if email known (MI-7)
      senderEmail ? addToWhitelist({ email_address: senderEmail }) : Promise.resolve(),
    ])

    // T+500ms: Toast "Kyrra a appris"
    setTimeout(() => {
      if (reclassResult.error) {
        toast({
          title: 'Reclassification échouée',
          description: reclassResult.error.message,
          type: 'attention',
        })
        setState('idle')
      } else {
        toast({
          title: 'Kyrra a appris.',
          description: senderEmail
            ? `${senderEmail} ajouté à la whitelist`
            : 'Cet expéditeur sera reconnu.',
          type: 'success',
        })
        setState('done')
        onReclassified?.()

        // T+3s: Show feedback link (FR46)
        setTimeout(() => setShowFeedbackLink(true), 2500)
      }
    }, 300)
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={transitions.fast}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReclassify}
              className="text-[11px] text-(--muted-foreground)"
            >
              Ce n&apos;est pas de la prospection
            </Button>
          </motion.div>
        )}

        {state === 'pulsing' && (
          <motion.div
            key="pulsing"
            initial={{ scale: 0.95 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.15 }}
            className="h-8 px-3 flex items-center text-[11px] font-medium text-[var(--color-protected)]"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-block size-2 rounded-full bg-[var(--color-protected)] mr-1.5"
            />
          </motion.div>
        )}

        {(state === 'confirmed' || state === 'done') && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.fast}
            className="h-8 px-3 flex items-center text-[11px] font-medium text-[var(--color-protected)]"
          >
            &#x2713; Compris
          </motion.div>
        )}
      </AnimatePresence>

      {/* FR46 — Post-toast feedback link */}
      <AnimatePresence>
        {showFeedbackLink && (
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={transitions.fast}
            className="text-[10px] text-(--muted-foreground) bg-transparent border-none cursor-pointer px-3 transition-opacity hover:opacity-70"
            onClick={() => {
              // Will open FeedbackSheet — dispatches custom event
              window.dispatchEvent(new CustomEvent('kyrra:open-feedback', {
                detail: { gmailMessageId },
              }))
            }}
          >
            Pourquoi mal classé ? Aidez-nous.
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
