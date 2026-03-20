
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Admin Dashboard — Founders only (ADMIN_USER_IDS middleware check)
 * Displays: system-wide stats, LLM costs, reclassification rates, circuit breaker status
 *
 * Source: [architecture.md — FR76-FR80, admin access model]
 */

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check admin access
  const adminIds = (process.env.ADMIN_USER_IDS ?? '').split(',').map((id) => id.trim())
  if (!adminIds.includes(user.id)) {
    redirect('/')
  }

  // Fetch system-wide stats
  const { count: totalClassifications } = await supabase
    .from('email_classifications')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsers } = await supabase
    .from('user_integrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Fetch latest LLM metrics
  const { data: latestMetrics } = await supabase
    .from('llm_metrics_hourly')
    .select('bypass_rate, total_cost_eur')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <main style={{
      padding: '32px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '2rem' }}>
        Kyrra Admin
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '2rem' }}>
        <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{totalUsers ?? 0}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Active Users</div>
        </div>
        <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{totalClassifications ?? 0}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Classifications</div>
        </div>
        <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>
            {latestMetrics?.bypass_rate ? `${Math.round(latestMetrics.bypass_rate * 100)}%` : 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>LLM Bypass Rate</div>
        </div>
        <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>
            {latestMetrics?.total_cost_eur ? `€${latestMetrics.total_cost_eur}` : '€0'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>LLM Cost (hour)</div>
        </div>
      </div>

      <a href="/" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>
        ← Retour au tableau de bord
      </a>
    </main>
  )
}
