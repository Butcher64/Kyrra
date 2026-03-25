import { Mail, ShieldCheck, Zap, ShieldAlert, ArrowRight, Bell, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/StatCard'
import { HelpKyrraLearnBanner } from '@/components/dashboard/HelpKyrraLearnBanner.client'

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
    .limit(10)

  // Fetch pipeline health
  const { data: health } = await supabase
    .from('user_pipeline_health')
    .select('mode')
    .eq('user_id', user!.id)
    .single()

  // Fetch user settings for exposure mode
  const { data: settings } = await supabase
    .from('user_settings')
    .select('exposure_mode')
    .eq('user_id', user!.id)
    .single()

  // Compute real trust score over last 7 days
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
    : '99.9%'

  const exposureMode = settings?.exposure_mode ?? 'normal'
  const modeLabel = exposureMode === 'strict' ? 'Strict'
    : exposureMode === 'permissive' ? 'Permissif'
    : 'Furtif'

  const alertCount = alerts?.length ?? 0
  const filtered = filteredToday ?? 0
  const isPaused = health?.mode === 'paused'

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()).toUpperCase()

  function getConfidenceColor(score: number | null | undefined) {
    if (!score) return { bar: 'bg-slate-500', text: 'text-slate-400', width: '50%' }
    if (score >= 0.8) return { bar: 'bg-cyan-400', text: 'text-cyan-400', width: `${Math.round(score * 100)}%` }
    if (score >= 0.5) return { bar: 'bg-amber-400/60', text: 'text-amber-400/60', width: `${Math.round(score * 100)}%` }
    return { bar: 'bg-red-400', text: 'text-red-400', width: `${Math.round(score * 100)}%` }
  }

  function formatTime(dateStr: string) {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
  }

  return (
    <>
      {/* Page header */}
      <header className="h-[100px] flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-outfit font-semibold tracking-tight text-slate-100">
            Tableau de bord
          </h2>
          <div className="flex items-center gap-4">
            <p className="text-xs font-mono text-slate-500 tracking-wider">{todayFormatted}</p>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPaused ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaused ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              </span>
              <span className={`text-[10px] font-mono tracking-[0.1em] uppercase ${isPaused ? 'text-amber-400' : 'text-emerald-400'}`}>
                Statut : {isPaused ? 'Pausé' : 'Protégé'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-10 px-4 glass rounded-lg flex items-center gap-3">
            <Search size={16} className="text-blue-400/70" strokeWidth={1.5} />
            <input
              className="bg-transparent border-none text-xs focus:ring-0 placeholder:text-slate-600 w-48 font-inter outline-none text-slate-200"
              placeholder="Rechercher un email..."
              type="text"
              readOnly
            />
          </div>
          <button className="h-10 w-10 glass rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-400 transition-colors">
            <Bell size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Learn banner */}
      <HelpKyrraLearnBanner signalCount={labelSignalCount} gmailMessageId={firstSignalMessageId} />

      {/* Stats grid */}
      <section className="grid grid-cols-4 gap-6 mb-10">
        <StatCard
          icon={Mail}
          value={alertCount}
          label="EN ATTENTE"
          sublabel="À voir ce matin"
          accent="attention"
        />
        <StatCard
          icon={ShieldAlert}
          value={filtered.toLocaleString('fr-FR')}
          label="CE MOIS"
          sublabel="Menaces filtrées"
          accent="cyan"
        />
        <StatCard
          icon={Zap}
          value={modeLabel}
          label="ACTIF"
          sublabel="Mode de filtrage IA"
          accent="brand"
        />
        <StatCard
          icon={ShieldCheck}
          value={trustScore}
          label="RÉSEAU"
          sublabel="Score de confiance"
          accent="protected"
        />
      </section>

      {/* Main content: alerts table + right panel */}
      <section className="grid grid-cols-12 gap-8">
        {/* Alerts table — col-span-8 */}
        <div className="col-span-8">
          <div className="glass rounded-2xl overflow-hidden border border-white/5">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
              <h4 className="text-sm font-outfit font-semibold text-slate-200 uppercase tracking-widest">
                Alertes de Sécurité
              </h4>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-mono text-slate-400 cursor-pointer hover:bg-white/10 transition-colors">
                  FILTRER
                </span>
                <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-mono text-slate-400 cursor-pointer hover:bg-white/10 transition-colors">
                  EXPORTER
                </span>
              </div>
            </div>

            {alerts && alerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.03]">
                      <th className="px-8 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        Expéditeur
                      </th>
                      <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        Confiance IA
                      </th>
                      <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        Temps
                      </th>
                      <th className="px-8 py-4 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {alerts.map((alert) => {
                      const confidence = getConfidenceColor(alert.confidence_score)
                      const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${alert.gmail_message_id}`
                      const score = alert.confidence_score
                        ? `${Math.round(alert.confidence_score * 100)}%`
                        : '—'

                      return (
                        <tr key={alert.gmail_message_id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                                <Mail size={16} strokeWidth={1.5} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate max-w-[220px]">
                                  {alert.gmail_message_id.slice(0, 16)}…
                                </p>
                                <p className="text-[10px] text-slate-500 truncate max-w-[220px]">
                                  {alert.summary ?? 'Email nécessitant votre attention'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${confidence.bar} rounded-full`}
                                  style={{ width: confidence.width }}
                                />
                              </div>
                              <span className={`text-xs font-mono ${confidence.text}`}>{score}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-xs font-mono text-slate-500">
                              {formatTime(alert.created_at)}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <a
                              href={gmailLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors ml-auto no-underline"
                            >
                              <ArrowRight size={16} strokeWidth={1.5} />
                            </a>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center text-center px-8">
                <ShieldCheck size={32} strokeWidth={1} className="text-emerald-400/30 mb-3" />
                <p className="text-sm text-slate-500">
                  Aucune alerte aujourd&apos;hui. Kyrra surveille en temps réel.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — col-span-4 */}
        <div className="col-span-4 space-y-6">
          {/* Surveillance card */}
          <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[320px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
            <div className="w-16 h-16 rounded-full bg-[var(--background)] flex items-center justify-center mb-5 border border-white/5 relative z-10">
              <ShieldCheck size={32} strokeWidth={1} className="text-blue-400 animate-pulse" />
            </div>
            <h5 className="text-base font-outfit font-semibold text-slate-100 relative z-10">
              Kyrra surveille votre boîte
            </h5>
            <p className="text-xs text-slate-500 mt-2 max-w-[180px] leading-relaxed relative z-10">
              Aucune activité suspecte détectée dans les 30 dernières minutes. Le filtrage en temps réel est actif.
            </p>
            <a
              href="https://mail.google.com/mail/u/0/#label/Kyrra"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 px-5 py-2 border border-white/10 rounded-full text-[10px] font-mono text-slate-400 hover:border-blue-400/40 hover:text-blue-400 transition-all relative z-10 uppercase tracking-widest no-underline"
            >
              Journal des logs
            </a>
          </div>

          {/* AI updates card */}
          <div className="glass rounded-2xl p-6">
            <h6 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">
              Mises à jour IA
            </h6>
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Nouveaux patterns de prospection identifiés et bloqués automatiquement.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Moteur de classification mis à jour. Précision accrue sur les emails B2B.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 py-10 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <span className="text-sm font-bold text-slate-400 font-outfit uppercase tracking-[0.2em]">KYRRA</span>
            <p className="text-[10px] font-mono text-slate-500">© 2024 Kyrra AI. Souveraineté Numérique.</p>
          </div>
          <div className="flex gap-6">
            <a href="/privacy" className="text-[10px] font-mono text-slate-600 hover:text-slate-300 transition-colors no-underline">Confidentialité</a>
            <a href="/terms" className="text-[10px] font-mono text-slate-600 hover:text-slate-300 transition-colors no-underline">CGU</a>
            <a href="mailto:support@kyrra.ai" className="text-[10px] font-mono text-slate-600 hover:text-slate-300 transition-colors no-underline">Contact</a>
          </div>
        </div>
      </footer>
    </>
  )
}
