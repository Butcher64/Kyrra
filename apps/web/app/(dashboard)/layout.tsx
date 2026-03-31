import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary.client'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: health } = await supabase
    .from('user_pipeline_health')
    .select('mode')
    .eq('user_id', user.id)
    .maybeSingle()

  console.log('[DASHBOARD LAYOUT] Rendering for user:', user.id.slice(0, 8))

  return (
    <DashboardErrorBoundary>
      <DashboardShell
        user={{ email: user.email!, name: user.user_metadata?.full_name }}
        pipelineStatus={(health?.mode as 'active' | 'paused') ?? 'active'}
      >
        {children}
      </DashboardShell>
    </DashboardErrorBoundary>
  )
}
