'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { transitions } from '@/lib/motion'
import { useToast } from '@/components/ui/toast'
import { deleteAccount } from '@/app/(dashboard)/actions/account'

/**
 * B6.2 — Delete account confirmation dialog
 * Destructive action with double confirmation
 */
export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const canConfirm = confirmText === 'SUPPRIMER'

  function handleDelete() {
    if (!canConfirm || isPending) return

    startTransition(async () => {
      const result = await deleteAccount(null)

      if (result?.error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le compte. Réessayez.',
          type: 'attention',
        })
      }
      // On success, the server action redirects to /login
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-red-500 bg-transparent border-none cursor-pointer font-medium transition-opacity duration-150 hover:opacity-70"
      >
        Supprimer mon compte
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitions.fast}
              className="fixed inset-0 bg-[oklch(0_0_0/0.4)] z-40"
              onClick={() => !isPending && setOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={transitions.normal}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-(--card) border border-(--border) p-6"
            >
              <h2 className="text-sm font-semibold text-(--foreground)">
                Supprimer votre compte
              </h2>
              <p className="mt-2 text-[13px] text-(--muted-foreground) leading-relaxed">
                Cette action est irréversible. Toutes vos données seront supprimées
                et les labels Kyrra retirés de votre Gmail.
              </p>

              <div className="mt-4">
                <label
                  htmlFor="confirm-delete"
                  className="block text-[11px] text-(--muted-foreground) mb-1.5"
                >
                  Tapez <span className="font-semibold text-(--foreground)">SUPPRIMER</span> pour confirmer
                </label>
                <input
                  id="confirm-delete"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isPending}
                  autoComplete="off"
                  className="w-full border border-(--border) bg-transparent px-3 py-2 text-[13px] font-mono text-(--foreground) outline-none focus:border-red-400 transition-colors"
                />
              </div>

              <div className="mt-5 flex gap-3 justify-end">
                <button
                  onClick={() => { setOpen(false); setConfirmText('') }}
                  disabled={isPending}
                  className="px-3 py-1.5 text-[12px] font-mono font-medium text-(--muted-foreground) bg-transparent border border-(--border) cursor-pointer transition-colors hover:bg-(--muted)"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canConfirm || isPending}
                  className="px-3 py-1.5 text-[12px] font-mono font-medium text-white bg-red-600 border-none cursor-pointer transition-colors hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Suppression...' : 'Supprimer définitivement'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
