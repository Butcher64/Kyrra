'use client'

import { useState, useCallback, createContext, useContext, useId } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { transitions } from '@/lib/motion'

/**
 * Toast system — MI-5 pattern
 * Slide-in from bottom, 1 line, auto-dismiss 3s
 * Colors: green=success, blue=info, amber=attention
 * NEVER red (calm principle)
 */

type ToastType = 'success' | 'info' | 'attention'

interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
}

interface ToastContextValue {
  toast: (opts: { title: string; description?: string; type?: ToastType }) => void
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-[oklch(0.627_0.194_149.214/0.12)] text-[var(--color-protected)] border-[oklch(0.627_0.194_149.214/0.25)]',
  info: 'bg-[oklch(0.588_0.158_241.966/0.12)] text-[var(--color-info)] border-[oklch(0.588_0.158_241.966/0.25)]',
  attention: 'bg-[oklch(0.666_0.179_58.318/0.12)] text-[var(--color-attention)] border-[oklch(0.666_0.179_58.318/0.25)]',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const prefix = useId()

  const addToast = useCallback(
    (opts: { title: string; description?: string; type?: ToastType }) => {
      const id = `${prefix}-${Date.now()}`
      const newToast: Toast = { id, title: opts.title, description: opts.description, type: opts.type ?? 'success' }
      setToasts((prev) => [...prev, newToast])

      // Auto-dismiss after 3s (MI-5)
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    },
    [prefix],
  )

  return (
    <ToastContext value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={transitions.fast}
              className={`pointer-events-auto px-4 py-2.5 rounded-xl border text-[13px] font-medium shadow-sm ${typeStyles[t.type]}`}
            >
              <div>{t.title}</div>
              {t.description && (
                <div className="text-[11px] opacity-70 mt-0.5 font-normal">{t.description}</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  )
}
