import { createClient } from '@/lib/supabase/server'
import { ProtectedStatusBadge } from '@/components/dashboard/ProtectedStatusBadge'
import { HeroStat } from '@/components/dashboard/HeroStat.client'
import { StatCard } from '@/components/dashboard/StatCard'
import { ClassificationCard } from '@/components/dashboard/ClassificationCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch today's classification stats
  const today = new Date().toISOString().split('T')[0]
  const { count: filteredToday } = await supabase
    .from('email_classifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .gte('created_at', `${today}T00:00:00Z`)

  // Fetch "À voir" emails (low confidence alerts)
  const { data: alerts } = await supabase
    .from('email_classifications')
    .select('gmail_message_id, summary, confidence_score, created_at')
    .eq('user_id', user!.id)
    .eq('classification_result', 'A_VOIR')
    .gte('created_at', `${today}T00:00:00Z`)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch pipeline health for trust score
  const { data: health } = await supabase
    .from('user_pipeline_health')
    .select('mode')
    .eq('user_id', user!.id)
    .single()

  const alertCount = alerts?.length ?? 0
  const status = health?.mode === 'paused' ? 'paused' as const
    : alertCount > 0 ? 'alert' as const
    : 'protected' as const

  return (
    <main style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '64px 24px 48px',
      minHeight: '100vh',
      background: '#fafaf9',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Status badge */}
        <ProtectedStatusBadge status={status} alertCount={alertCount} />

        {/* Hero stat */}
        <div style={{ marginTop: '40px' }}>
          <HeroStat value={filteredToday ?? 0} label="distractions supprimées" />
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
          <StatCard value={alertCount} label="À voir" accent />
          <StatCard value="Normal" label="Mode" />
          <StatCard value="94%" label="Trust" />
        </div>

        {/* Alert email cards */}
        {alerts && alerts.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            {alerts.map((alert) => (
              <ClassificationCard
                key={alert.gmail_message_id}
                summary={alert.summary ?? 'Email nécessitant votre attention'}
                gmailMessageId={alert.gmail_message_id}
                confidenceScore={alert.confidence_score}
              />
            ))}
          </div>
        )}

        {/* Filtered link */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <a
            href="https://mail.google.com/mail/u/0/#label/Kyrra+%E2%80%94+Filtr%C3%A9"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: '#9ca3af',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
          >
            Voir les {filteredToday ?? 0} filtrés dans Gmail →
          </a>
        </div>

        {/* Detail toggle */}
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <button
            style={{
              fontSize: '12px',
              color: '#3b82f6',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Voir les détails
          </button>
        </div>
      </div>
    </main>
  )
}
