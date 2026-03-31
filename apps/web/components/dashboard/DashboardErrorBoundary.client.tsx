'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('[DASHBOARD ERROR BOUNDARY]', error.message, error.stack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
          <div className="text-center space-y-4 max-w-md px-6">
            <h1 className="text-2xl font-bold">Une erreur est survenue</h1>
            <p className="text-sm text-slate-400">{this.state.error?.message}</p>
            <a href="/dashboard" className="inline-block px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors">
              Recharger
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
