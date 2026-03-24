'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface DashboardShellProps {
  user: { email: string; name?: string }
  pipelineStatus: 'active' | 'paused' | 'degraded'
  children: React.ReactNode
}

export function DashboardShell({ user, pipelineStatus, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen">
      <Sidebar
        user={user}
        pipelineStatus={pipelineStatus}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          pipelineStatus={pipelineStatus}
        />

        <main className="flex-1 overflow-y-auto bg-[var(--background)]">
          <div className="mx-auto max-w-[1000px] px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
