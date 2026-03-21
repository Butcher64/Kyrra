'use client'

import { ToastProvider } from '@/components/ui/toast'
import { FeedbackSheet } from './FeedbackSheet.client'

/**
 * Client-side providers for the dashboard
 * Wraps children with ToastProvider + mounts FeedbackSheet
 * Used in (dashboard)/layout.tsx
 */
export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <FeedbackSheet />
    </ToastProvider>
  )
}
