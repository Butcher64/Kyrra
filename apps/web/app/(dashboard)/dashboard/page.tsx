import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}j`
}

const classificationConfig = {
  A_VOIR: { label: 'À voir', bar: 'bar-a-voir', badgeBg: 'bg-[#e8edf8]', badgeText: 'text-[#2d4a8a]', opacity: 'opacity-100', fontWeight: 'font-medium' },
  FILTRE: { label: 'Filtré', bar: 'bar-filtre', badgeBg: 'bg-[#edeef2]', badgeText: 'text-[#5c6070]', opacity: 'opacity-55', fontWeight: 'font-normal' },
  BLOQUE: { label: 'Bloqué', bar: 'bar-bloque', badgeBg: 'bg-[#f8e8e8]', badgeText: 'text-[#8a2d2d]', opacity: 'opacity-30', fontWeight: 'font-normal' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-12 text-center text-[#8b90a0]">Session expirée. <a href="/login" className="text-[#3a5bc7] underline">Reconnexion</a></div>
  }

  let filteredToday = 0
  let blockedToday = 0
  let recentEmails: Array<{ gmail_message_id: string; classification_result: string; summary: string | null; confidence_score: number | null; created_at: string }> = []

  try {
    const today = new Date().toISOString().split('T')[0]

    const [countRes, blockedRes, recentRes] = await Promise.all([
      supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', `${today}T00:00:00Z`),
      supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('classification_result', 'BLOQUE').gte('created_at', `${today}T00:00:00Z`),
      supabase.from('email_classifications').select('gmail_message_id, classification_result, summary, confidence_score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
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

  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-[22px] font-bold text-[#0c1a32] tracking-tight">
            Bonjour, {firstName}
          </h1>
          <p className="font-mono text-[11px] text-[#8b90a0] mt-1 capitalize">
            {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-2 border border-[#e4e6ed] px-3 py-1.5">
          <span className="w-[5px] h-[5px] bg-[#2dd881] rounded-full shadow-[0_0_6px_#2dd881]" />
          <span className="font-mono text-[10px] text-[#1a7a4a]">protégé</span>
        </div>
      </div>

      {/* Stats block */}
      <div className="bg-white border border-[#e4e6ed] mb-10">
        <div className="flex divide-x divide-[#e4e6ed]">
          {/* Triés */}
          <div className="flex-1 px-6 py-5">
            <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-1">
              Triés aujourd&apos;hui
            </p>
            <p className="text-4xl font-bold text-[#3a5bc7]">{filteredToday}</p>
            <p className="font-mono text-[9px] text-[#c4c7d4] mt-1">emails analysés</p>
          </div>
          {/* Bloqués */}
          <div className="flex-1 px-6 py-5">
            <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-1">
              Bloqués
            </p>
            <p className="text-4xl font-bold text-[#c23a3a]">{blockedToday}</p>
            <p className="font-mono text-[9px] text-[#c4c7d4] mt-1">prospection stoppée</p>
          </div>
          {/* Temps gagné */}
          <div className="flex-1 px-6 py-5">
            <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-1">
              Temps gagné
            </p>
            <p className="text-4xl font-bold text-[#1a7a4a]">
              {timeSaved}<span className="text-base font-normal text-[#8b90a0] ml-1">min</span>
            </p>
            <p className="font-mono text-[9px] text-[#c4c7d4] mt-1">estimé ce jour</p>
          </div>
        </div>
      </div>

      {/* Email list */}
      <div className="bg-white border border-[#e4e6ed]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e6ed]">
          <h2 className="text-[13px] font-semibold text-[#0c1a32]">
            Derniers emails triés
          </h2>
          <Link href="/emails" className="font-mono text-[11px] text-[#3a5bc7] no-underline hover:underline">
            tout voir →
          </Link>
        </div>

        {recentEmails.length > 0 ? (
          <div className="divide-y divide-[#e4e6ed]">
            {recentEmails.map((email) => {
              const config = classificationConfig[email.classification_result as keyof typeof classificationConfig] ?? classificationConfig.FILTRE
              const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`

              return (
                <a
                  key={email.gmail_message_id}
                  href={gmailLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 px-6 py-3.5 no-underline transition-opacity duration-150 hover:bg-[#f5f6f9] ${config.opacity}`}
                >
                  {/* Classification bar */}
                  <span className={`self-stretch ${config.bar}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] ${config.fontWeight} text-[#0c1a32] truncate`}>
                      {email.summary ?? 'Email classifié'}
                    </p>
                  </div>

                  {/* Badge */}
                  <span className={`shrink-0 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${config.badgeBg} ${config.badgeText}`}>
                    {config.label}
                  </span>

                  {/* Confidence + time */}
                  {email.confidence_score !== null && (
                    <span className="shrink-0 font-mono text-[10px] text-[#c4c7d4]">
                      {Math.round(email.confidence_score * 100)}%
                    </span>
                  )}
                  <span className="shrink-0 font-mono text-[10px] text-[#c4c7d4]">
                    {timeAgo(email.created_at)}
                  </span>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Mail size={28} strokeWidth={1} className="text-[#c4c7d4] mx-auto mb-3" />
            <p className="text-[13px] text-[#8b90a0]">Aucun email trié pour le moment.</p>
            <p className="font-mono text-[10px] text-[#c4c7d4] mt-1">Kyrra trie vos emails en arrière-plan.</p>
          </div>
        )}
      </div>
    </>
  )
}
