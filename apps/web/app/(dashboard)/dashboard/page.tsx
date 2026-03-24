import { Mail, ShieldCheck, Eye, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProtectedStatusBadge } from '@/components/dashboard/ProtectedStatusBadge'
import { HeroStat } from '@/components/dashboard/HeroStat.client'
import { StatCard } from '@/components/dashboard/StatCard'
import { AlertEmailCard } from '@/components/dashboard/AlertEmailCard.client'
import { HelpKyrraLearnBanner } from '@/components/dashboard/HelpKyrraLearnBanner.client'
import { Card, CardContent } from '@/components/ui/card'

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

  // Fetch user settings for real exposure mode
  const { data: settings } = await supabase
    .from('user_settings')
    .select('exposure_mode')
    .eq('user_id', user!.id)
    .single()

  // Compute real trust score: (1 - reclassification_rate) * 100 over last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const { count: totalClassified7d } = await supabase
    .from('email_classifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .gte('created_at', sevenDaysAgo)

  const { count: reclassified7d } = await supabase
    .from('email_classifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .gte('created_at', sevenDaysAgo)
    .not('reclassified_to', 'is', null)

  // Fetch unacknowledged label change signals for learn banner (B3.2)
  const { data: labelSignals } = await supabase
    .from('label_change_signals')
    .select('gmail_message_id')
    .eq('user_id', user!.id)
    .eq('acknowledged', false)
    .order('detected_at', { ascending: false })
    .limit(1)

  const labelSignalCount = labelSignals?.length ?? 0
  const firstSignalMessageId = labelSignals?.[0]?.gmail_message_id ?? null

  const total7d = totalClassified7d ?? 0
  const reclass7d = reclassified7d ?? 0
  const trustScore = total7d > 0
    ? `${Math.round((1 - reclass7d / total7d) * 100)}%`
    : '—'

  const exposureMode = settings?.exposure_mode ?? 'normal'
  const modeLabel = exposureMode === 'strict' ? 'Strict'
    : exposureMode === 'permissive' ? 'Permissif'
    : 'Normal'

  const alertCount = alerts?.length ?? 0
  const filtered = filteredToday ?? 0
  const hasClassifications = filtered > 0 || alertCount > 0
  const status = health?.mode === 'paused' ? 'paused' as const
    : alertCount > 0 ? 'alert' as const
    : 'protected' as const

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-outfit text-2xl font-semibold text-[var(--foreground)]">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)] capitalize">
            {todayFormatted}
          </p>
        </div>
        <ProtectedStatusBadge status={status} alertCount={alertCount} />
      </div>

      {/* Learn banner — B3.2 label change detection */}
      <HelpKyrraLearnBanner signalCount={labelSignalCount} gmailMessageId={firstSignalMessageId} />

      {/* Hero stat — NumberTicker roll-up */}
      <div className="mb-8">
        <HeroStat value={filtered} label="distractions supprimées" />
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Eye} value={alertCount} label="À voir" accent="attention" />
        <StatCard icon={Mail} value={filtered} label="Filtrés" accent="brand" />
        <StatCard icon={ShieldCheck} value={modeLabel} label="Mode" accent="default" />
        <StatCard icon={TrendingUp} value={trustScore} label="Trust" accent="protected" />
      </div>

      {/* Empty state: no classifications today */}
      {!hasClassifications && (
        <div className="mt-10 flex flex-col items-center text-center">
          <Mail size={32} strokeWidth={1} className="text-[var(--muted-foreground)]/40 mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Kyrra surveille votre boîte. Le premier rapport arrive bientôt.
          </p>
        </div>
      )}

      {/* Alert email cards */}
      {alerts && alerts.length > 0 && (
        <Card variant="glass" className="mb-6">
          <CardContent className="divide-y divide-[var(--border)] p-0">
            {alerts.map((alert) => (
              <div key={alert.gmail_message_id} className="px-4">
                <AlertEmailCard
                  summary={alert.summary ?? 'Email nécessitant votre attention'}
                  gmailMessageId={alert.gmail_message_id}
                  confidenceScore={alert.confidence_score}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state: classifications exist but zero "À voir" */}
      {hasClassifications && alertCount === 0 && (
        <div className="mt-10 flex flex-col items-center text-center">
          <ShieldCheck size={32} strokeWidth={1} className="text-[var(--color-protected)]/40 mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Rien à signaler. Votre boîte est calme.
          </p>
        </div>
      )}

      {/* Filtered link — Gmail is the destination (Principle 3) */}
      {filtered > 0 && (
        <div className="mt-6 text-center">
          <a
            href="https://mail.google.com/mail/u/0/#label/Kyrra+%E2%80%94+Filtr%C3%A9"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--muted-foreground)] no-underline transition-opacity duration-200 hover:opacity-70"
          >
            Voir les {filtered} filtrés dans Gmail &rarr;
          </a>
        </div>
      )}
    </>
  )
}
