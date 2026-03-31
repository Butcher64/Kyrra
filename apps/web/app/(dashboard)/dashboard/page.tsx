import { Mail, Clock, Filter, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const classificationStyles = {
  A_VOIR: { label: 'À voir', bg: 'bg-[var(--color-a-voir)]/10', text: 'text-[var(--color-a-voir)]', border: 'border-[var(--color-a-voir)]/20' },
  FILTRE: { label: 'Filtré', bg: 'bg-[var(--color-filtre)]/10', text: 'text-[var(--color-filtre)]', border: 'border-[var(--color-filtre)]/20' },
  BLOQUE: { label: 'Bloqué', bg: 'bg-[var(--color-bloque)]/10', text: 'text-[var(--color-bloque)]', border: 'border-[var(--color-bloque)]/20' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${Math.floor(hours / 24)}j`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-12 text-center text-slate-400">Session expirée. <a href="/login" className="text-[var(--primary)] underline">Reconnexion</a></div>
  }

  let filteredToday = 0
  let blockedToday = 0
  let recentEmails: Array<{ gmail_message_id: string; classification_result: string; summary: string | null; created_at: string }> = []

  try {
    const today = new Date().toISOString().split('T')[0]

    const [countRes, blockedRes, recentRes] = await Promise.all([
      supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', `${today}T00:00:00Z`),
      supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('classification_result', 'BLOQUE').gte('created_at', `${today}T00:00:00Z`),
      supabase.from('email_classifications').select('gmail_message_id, classification_result, summary, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ])

    filteredToday = countRes.count ?? 0
    blockedToday = blockedRes.count ?? 0
    recentEmails = (recentRes.data ?? []) as typeof recentEmails

    console.log('[DASHBOARD] Data loaded', { filteredToday, blockedToday, recentCount: recentEmails.length })
  } catch (error) {
    console.error('[DASHBOARD] Failed to load data:', error)
  }

  const timeSaved = Math.round(filteredToday * 0.75)
  const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'vous'

  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl font-headline font-semibold text-slate-800 tracking-tight">
          Bonjour, {firstName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Voici le résumé de votre boîte mail aujourd&apos;hui.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[var(--color-accent-cyan)]/10">
              <Filter size={18} className="text-[var(--color-accent-cyan)]" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-label text-slate-500 uppercase tracking-wider">Triés aujourd&apos;hui</span>
          </div>
          <p className="text-3xl font-headline font-bold text-slate-800">{filteredToday}</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[var(--color-bloque)]/10">
              <Mail size={18} className="text-[var(--color-bloque)]" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-label text-slate-500 uppercase tracking-wider">Prospection bloquée</span>
          </div>
          <p className="text-3xl font-headline font-bold text-slate-100">{blockedToday}</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[var(--color-protected)]/10">
              <Clock size={18} className="text-[var(--color-protected)]" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-label text-slate-500 uppercase tracking-wider">Temps gagné</span>
          </div>
          <p className="text-3xl font-headline font-bold text-slate-800">{timeSaved} <span className="text-base font-normal text-slate-500">min</span></p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-headline font-semibold text-slate-600 uppercase tracking-wider mb-4">
          Derniers emails triés
        </h2>

        {recentEmails.length > 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)]">
            {recentEmails.map((email) => {
              const style = classificationStyles[email.classification_result as keyof typeof classificationStyles] ?? classificationStyles.FILTRE
              const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`

              return (
                <div key={email.gmail_message_id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                  <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-label font-medium uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                    {style.label}
                  </span>
                  <p className="flex-1 text-sm text-slate-600 truncate min-w-0">
                    {email.summary ?? 'Email classifié'}
                  </p>
                  <span className="shrink-0 text-xs text-slate-500 font-label">
                    {timeAgo(email.created_at)}
                  </span>
                  <a
                    href={gmailLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 rounded-md text-slate-400 group-hover:text-[var(--primary)] transition-colors no-underline"
                  >
                    <ArrowUpRight size={14} strokeWidth={1.5} />
                  </a>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] py-16 text-center">
            <Mail size={28} strokeWidth={1} className="text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Aucun email trié pour le moment.</p>
            <p className="text-xs text-slate-400 mt-1">Kyrra trie vos emails en arrière-plan.</p>
          </div>
        )}
      </div>
    </>
  )
}
