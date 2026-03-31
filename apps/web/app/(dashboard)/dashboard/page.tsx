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
  let weeklyByDay: number[] = [0, 0, 0, 0, 0, 0, 0]
  let weekBlocked = 0

  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Start of week (Monday)
    const mondayOffset = (now.getDay() + 6) % 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - mondayOffset)
    monday.setHours(0, 0, 0, 0)
    const weekStart = monday.toISOString()

    const [countRes, blockedRes, recentRes, weekRes, weekBlockedRes] = await Promise.all([
      supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', `${today}T00:00:00Z`),
      supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('classification_result', 'BLOQUE').gte('created_at', `${today}T00:00:00Z`),
      supabase.from('email_classifications').select('gmail_message_id, classification_result, summary, confidence_score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('email_classifications').select('created_at').eq('user_id', user.id).gte('created_at', weekStart),
      supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('classification_result', 'BLOQUE').gte('created_at', weekStart),
    ])

    filteredToday = countRes.count ?? 0
    blockedToday = blockedRes.count ?? 0
    recentEmails = (recentRes.data ?? []) as typeof recentEmails
    weekBlocked = weekBlockedRes.count ?? 0

    // Build weekly bar chart from real data
    if (weekRes.data) {
      for (const row of weekRes.data) {
        const dayOfWeek = (new Date(row.created_at).getDay() + 6) % 7 // Monday=0
        weeklyByDay[dayOfWeek]++
      }
    }
  } catch (error) {
    console.error('[DASHBOARD] Failed to load data:', error)
  }

  const timeSaved = Math.round(filteredToday * 0.75)
  const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'vous'

  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })

  // Split emails by classification
  const aVoirEmails = recentEmails.filter(e => e.classification_result === 'A_VOIR').slice(0, 3)
  const filtreEmails = recentEmails.filter(e => e.classification_result === 'FILTRE').slice(0, 2)
  const bloqueEmails = recentEmails.filter(e => e.classification_result === 'BLOQUE').slice(0, 2)

  // Weekly bar chart from real data
  const dayLabels = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
  const todayIndex = (now.getDay() + 6) % 7 // Monday=0
  const weekBars = weeklyByDay

  // Weekly totals from real data
  const weekSorted = weekBars.reduce((a, b) => a + b, 0)
  const weekTimeSaved = Math.round(weekSorted * 0.75)

  const maxBar = Math.max(...weekBars, 1)

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-[#0c1a32]">
            Bonjour, {firstName}
          </h1>
          <p className="font-mono text-[11px] text-[#8b90a0] mt-1">
            {dateStr} &middot; {filteredToday} emails tri&eacute;s aujourd&apos;hui
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-center">
            <p className="text-[20px] font-bold text-[#0c1a32]">{blockedToday}</p>
            <p className="font-mono text-[10px] text-[#8b90a0]">bloqu&eacute;s</p>
          </div>
          <div className="w-px h-7 bg-[#e4e6ed]" />
          <div className="text-center">
            <p className="text-[20px] font-bold text-[#1a7a4a]">{timeSaved}min</p>
            <p className="font-mono text-[10px] text-[#8b90a0]">gagn&eacute;es</p>
          </div>
          <div className="w-px h-7 bg-[#e4e6ed]" />
          <div className="flex items-center gap-2 border border-[#e4e6ed] px-3 py-1.5">
            <span className="w-[5px] h-[5px] bg-[#2dd881] rounded-full" />
            <span className="font-mono text-[10px] text-[#1a7a4a]">prot&eacute;g&eacute;</span>
          </div>
        </div>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Left: Overview card */}
        <div className="bg-white border border-[#e4e6ed] p-6">
          <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b90a0] mb-4">
            Cette semaine
          </p>

          {/* 3 stat numbers */}
          <div className="flex items-baseline gap-6 mb-6">
            <div>
              <span className="text-[28px] font-bold text-[#0c1a32]">{weekSorted}</span>
              <span className="font-mono text-[10px] text-[#8b90a0] ml-1.5">tri&eacute;s</span>
            </div>
            <div>
              <span className="text-[28px] font-bold text-[#c23a3a]">{weekBlocked}</span>
              <span className="font-mono text-[10px] text-[#8b90a0] ml-1.5">bloqu&eacute;s</span>
            </div>
            <div>
              <span className="text-[28px] font-bold text-[#1a7a4a]">{weekTimeSaved}</span>
              <span className="font-mono text-[10px] text-[#8b90a0] ml-1.5">min</span>
            </div>
          </div>

          {/* Mini bar chart */}
          <div className="flex items-end gap-2 h-[80px] mb-2">
            {weekBars.map((val, i) => (
              <div
                key={i}
                className={`flex-1 ${i === todayIndex ? 'bg-[#0c1a32]' : 'bg-[#e4e6ed]'}`}
                style={{ height: `${Math.max((val / maxBar) * 100, 4)}%` }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {dayLabels.map((d, i) => (
              <span
                key={d}
                className={`flex-1 text-center font-mono text-[9px] ${i === todayIndex ? 'text-[#0c1a32] font-bold' : 'text-[#c4c7d4]'}`}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Right: A voir card */}
        <div className="bg-white border border-[#e4e6ed]">
          {/* Header with blue bar */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e4e6ed]">
            <div className="w-[3px] h-4 bg-[#3a5bc7]" />
            <h2 className="text-[13px] font-semibold text-[#0c1a32]">&Agrave; voir</h2>
            <span className="font-mono text-[10px] text-[#8b90a0]">{aVoirEmails.length}</span>
            <Link href="/emails?filter=a_voir" className="font-mono text-[11px] text-[#3a5bc7] no-underline hover:underline ml-auto">
              tout voir &rarr;
            </Link>
          </div>

          {aVoirEmails.length > 0 ? (
            <div className="divide-y divide-[#e4e6ed]">
              {aVoirEmails.map((email) => {
                const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`
                return (
                  <a
                    key={email.gmail_message_id}
                    href={gmailLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-6 py-3.5 no-underline hover:bg-[#f5f6f9] transition-colors"
                  >
                    <div className="w-[3px] self-stretch bg-[#3a5bc7] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#0c1a32] truncate">
                        {email.summary ?? 'Email &agrave; consulter'}
                      </p>
                      <p className="font-mono text-[10px] text-[#c4c7d4] mt-0.5">
                        {timeAgo(email.created_at)}
                      </p>
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Mail size={22} strokeWidth={1} className="text-[#c4c7d4] mx-auto mb-2" />
              <p className="text-[12px] text-[#8b90a0]">Aucun email &agrave; voir</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Recently filtered — full width */}
      <div className="bg-white border border-[#e4e6ed]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e6ed]">
          <h2 className="text-[13px] font-semibold text-[#0c1a32]">R&eacute;cemment filtr&eacute;s</h2>
          <Link href="/emails" className="font-mono text-[11px] text-[#3a5bc7] no-underline hover:underline">
            tout voir &rarr;
          </Link>
        </div>

        {(filtreEmails.length > 0 || bloqueEmails.length > 0) ? (
          <div className="grid grid-cols-2 divide-x divide-[#e4e6ed]">
            {/* Left: Filtered */}
            <div className="divide-y divide-[#e4e6ed]">
              {filtreEmails.map((email) => {
                const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`
                return (
                  <a
                    key={email.gmail_message_id}
                    href={gmailLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-6 py-3.5 no-underline hover:bg-[#f5f6f9] transition-colors opacity-60"
                  >
                    <div className="w-[3px] self-stretch bg-[#c4c7d4] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#0c1a32] truncate">
                        {email.summary ?? 'Email filtr&eacute;'}
                      </p>
                      <p className="font-mono text-[10px] text-[#c4c7d4] mt-0.5">
                        {timeAgo(email.created_at)}
                      </p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-[#edeef2] text-[#5c6070]">
                      Filtr&eacute;
                    </span>
                  </a>
                )
              })}
              {filtreEmails.length === 0 && (
                <div className="py-8 text-center opacity-60">
                  <p className="text-[12px] text-[#8b90a0]">Aucun email filtr&eacute;</p>
                </div>
              )}
            </div>

            {/* Right: Blocked */}
            <div className="divide-y divide-[#e4e6ed]">
              {bloqueEmails.map((email) => {
                const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`
                return (
                  <a
                    key={email.gmail_message_id}
                    href={gmailLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-6 py-3.5 no-underline hover:bg-[#f5f6f9] transition-colors opacity-35"
                  >
                    <div className="w-[3px] self-stretch bg-[#c23a3a] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#0c1a32] truncate line-through">
                        {email.summary ?? 'Email bloqu&eacute;'}
                      </p>
                      <p className="font-mono text-[10px] text-[#c4c7d4] mt-0.5">
                        {timeAgo(email.created_at)}
                      </p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-[#f8e8e8] text-[#8a2d2d]">
                      Bloqu&eacute;
                    </span>
                  </a>
                )
              })}
              {bloqueEmails.length === 0 && (
                <div className="py-8 text-center opacity-35">
                  <p className="text-[12px] text-[#8b90a0]">Aucun email bloqu&eacute;</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Mail size={28} strokeWidth={1} className="text-[#c4c7d4] mx-auto mb-3" />
            <p className="text-[13px] text-[#8b90a0]">Aucun email filtr&eacute; pour le moment.</p>
            <p className="font-mono text-[10px] text-[#c4c7d4] mt-1">Kyrra trie vos emails en arri&egrave;re-plan.</p>
          </div>
        )}
      </div>
    </>
  )
}
