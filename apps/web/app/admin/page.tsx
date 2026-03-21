
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Admin Dashboard — Founders only (ADMIN_USER_IDS middleware check)
 * Displays: system-wide stats, LLM costs, reclassification rates, circuit breaker status
 * UX spec: COMPACT spacing (12px tables, 8px cells) — functional, not premium
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
    <main className="p-8 max-w-[1200px] mx-auto">
      <h1 className="text-xl font-semibold mb-8 text-(--foreground)">
        Kyrra Admin
      </h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent>
            <div className="font-(family-name:--font-outfit) text-2xl font-semibold text-(--foreground)">{totalUsers ?? 0}</div>
            <div className="text-xs text-(--muted-foreground)">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="font-(family-name:--font-outfit) text-2xl font-semibold text-(--foreground)">{totalClassifications ?? 0}</div>
            <div className="text-xs text-(--muted-foreground)">Total Classifications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="font-(family-name:--font-outfit) text-2xl font-semibold text-(--foreground)">
              {latestMetrics?.bypass_rate ? `${Math.round(latestMetrics.bypass_rate * 100)}%` : 'N/A'}
            </div>
            <div className="text-xs text-(--muted-foreground)">LLM Bypass Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="font-(family-name:--font-outfit) text-2xl font-semibold text-(--foreground)">
              {latestMetrics?.total_cost_eur ? `\u20AC${latestMetrics.total_cost_eur}` : '\u20AC0'}
            </div>
            <div className="text-xs text-(--muted-foreground)">LLM Cost (hour)</div>
          </CardContent>
        </Card>
      </div>

      <a href="/" className="text-xs text-[var(--color-a-voir)] no-underline transition-opacity duration-150 hover:opacity-70">
        &larr; Retour au tableau de bord
      </a>
    </main>
  )
}
