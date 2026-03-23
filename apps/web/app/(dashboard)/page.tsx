
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProtectedStatusBadge } from '@/components/dashboard/ProtectedStatusBadge'
import { HeroStat } from '@/components/dashboard/HeroStat.client'
import { StatCard } from '@/components/dashboard/StatCard'
import { AlertEmailCard } from '@/components/dashboard/AlertEmailCard.client'

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

  return (
    <main className="flex justify-center px-6 pt-16 pb-12 min-h-screen">
      <div className="relative w-full max-w-[440px]">
        {/* Gear icon — navigate to settings */}
        <Link
          href="/settings"
          aria-label="Paramètres"
          className="absolute top-0 right-0 text-(--muted-foreground) transition-opacity duration-150 hover:opacity-60"
        >
          <Settings size={20} strokeWidth={1.5} />
        </Link>

        {/* Status badge — MI-6 */}
        <ProtectedStatusBadge status={status} alertCount={alertCount} />

        {/* Hero stat — NumberTicker roll-up */}
        <div className="mt-10">
          <HeroStat value={filtered} label="distractions supprimées" />
        </div>

        {/* Stat cards */}
        <div className="flex gap-3 mt-10">
          <StatCard value={alertCount} label="À voir" accent />
          <StatCard value={modeLabel} label="Mode" />
          <StatCard value={trustScore} label="Trust" />
        </div>

        {/* Empty state: no classifications today */}
        {!hasClassifications && (
          <div className="mt-10 text-center">
            <p className="text-sm text-(--muted-foreground)">
              Kyrra surveille votre boîte. Le premier rapport arrive bientôt.
            </p>
          </div>
        )}

        {/* Alert email cards — with reclassification (MI-1) */}
        {alerts && alerts.length > 0 && (
          <div className="mt-8">
            {alerts.map((alert) => (
              <AlertEmailCard
                key={alert.gmail_message_id}
                summary={alert.summary ?? 'Email nécessitant votre attention'}
                gmailMessageId={alert.gmail_message_id}
                confidenceScore={alert.confidence_score}
              />
            ))}
          </div>
        )}

        {/* Empty state: classifications exist but zero "À voir" */}
        {hasClassifications && alertCount === 0 && (
          <div className="mt-10 text-center">
            <p className="text-sm text-(--muted-foreground)">
              Rien à signaler. Votre boîte est calme.
            </p>
            <button className="mt-2 text-xs text-[var(--color-a-voir)] bg-transparent border-none cursor-pointer font-medium transition-opacity duration-150 hover:opacity-70">
              Voir les tendances &rarr;
            </button>
          </div>
        )}

        {/* Filtered link — Gmail is the destination (Principle 3) */}
        {filtered > 0 && (
          <div className="mt-8 text-center">
            <a
              href="https://mail.google.com/mail/u/0/#label/Kyrra+%E2%80%94+Filtr%C3%A9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-(--muted-foreground) no-underline transition-opacity duration-200 hover:opacity-70"
            >
              Voir les {filtered} filtrés dans Gmail &rarr;
            </a>
          </div>
        )}

        {/* Detail toggle — MI-4 */}
        {hasClassifications && (
          <div className="mt-3 text-center">
            <button className="text-xs text-[var(--color-a-voir)] bg-transparent border-none cursor-pointer font-medium transition-opacity duration-150 hover:opacity-70">
              Voir les détails
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
