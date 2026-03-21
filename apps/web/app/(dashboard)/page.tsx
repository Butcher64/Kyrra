
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
    <main className="flex justify-center px-6 pt-16 pb-12 min-h-screen">
      <div className="w-full max-w-[440px]">
        {/* Status badge — MI-6 */}
        <ProtectedStatusBadge status={status} alertCount={alertCount} />

        {/* Hero stat — NumberTicker roll-up */}
        <div className="mt-10">
          <HeroStat value={filteredToday ?? 0} label="distractions supprimées" />
        </div>

        {/* Stat cards */}
        <div className="flex gap-3 mt-10">
          <StatCard value={alertCount} label="À voir" accent />
          <StatCard value="Normal" label="Mode" />
          <StatCard value="94%" label="Trust" />
        </div>

        {/* Alert email cards */}
        {alerts && alerts.length > 0 && (
          <div className="mt-8">
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

        {/* Filtered link — Gmail is the destination (Principle 3) */}
        <div className="mt-8 text-center">
          <a
            href="https://mail.google.com/mail/u/0/#label/Kyrra+%E2%80%94+Filtr%C3%A9"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-(--muted-foreground) no-underline transition-opacity duration-200 hover:opacity-70"
          >
            Voir les {filteredToday ?? 0} filtrés dans Gmail &rarr;
          </a>
        </div>

        {/* Detail toggle — MI-4 */}
        <div className="mt-3 text-center">
          <button className="text-xs text-[var(--color-a-voir)] bg-transparent border-none cursor-pointer font-medium transition-opacity duration-150 hover:opacity-70">
            Voir les détails
          </button>
        </div>
      </div>
    </main>
  )
}
