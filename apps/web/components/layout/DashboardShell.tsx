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

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-[260px]">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          pipelineStatus={pipelineStatus}
        />

        <main className="flex-1 overflow-y-auto bg-[#f5f6f9] pb-24">
          <div className="px-9 py-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
