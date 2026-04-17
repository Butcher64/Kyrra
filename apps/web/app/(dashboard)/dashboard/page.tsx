import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getLabels } from '../actions/labels'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}j`
}

/**
 * Derives badge styling from a hex color.
 * Returns a light background and dark text version.
 */
function labelBadgeStyle(hexColor: string): { bg: string; text: string } {
  // Parse hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.12)`,
    text: hexColor,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-12 text-center text-[#8b90a0]">Session expirée. <a href="/login" className="text-[#3a5bc7] underline">Reconnexion</a></div>
  }

  // Load user labels
  const labelsResult = await getLabels()
  const userLabels = labelsResult.data ?? []

  let filteredToday = 0
  let blockedToday = 0
  let recentEmails: Array<{ gmail_message_id: string; classification_result: string; label_id: string | null; summary: string | null; sender_display: string | null; subject_snippet: string | null; confidence_score: number | null; created_at: string }> = []
  let weeklyByDay: number[] = [0, 0, 0, 0, 0, 0, 0]
  let weekBlocked = 0

  // "Blocked" = the Kyrra-default Prospection + Spam buckets. Match by
  // is_default + canonical name so Gmail user labels never get counted as
  // blocked even if they were saved at position >= 5 historically.
  const BLOCKED_DEFAULT_NAMES = new Set(['Prospection', 'Spam'])
  const blockedLabelIds = userLabels
    .filter(l => l.is_default && BLOCKED_DEFAULT_NAMES.has(l.name))
    .map(l => l.id)

  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Start of week (Monday)
    const mondayOffset = (now.getDay() + 6) % 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - mondayOffset)
    monday.setHours(0, 0, 0, 0)
    const weekStart = monday.toISOString()

    // Build blocked queries using label_id instead of classification_result
    const noBlockedFallback = Promise.resolve({ count: 0, data: null, error: null })

    const blockedTodayQuery = blockedLabelIds.length > 0
      ? supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('label_id', blockedLabelIds).gte('created_at', `${today}T00:00:00Z`)
      : noBlockedFallback

    const blockedWeekQuery = blockedLabelIds.length > 0
      ? supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('label_id', blockedLabelIds).gte('created_at', weekStart)
      : noBlockedFallback

    const [countRes, blockedRes, recentRes, weekRes, weekBlockedRes] = await Promise.all([
      supabase.from('email_classifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', `${today}T00:00:00Z`),
      blockedTodayQuery,
      supabase.from('email_classifications').select('gmail_message_id, classification_result, label_id, summary, sender_display, subject_snippet, confidence_score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('email_classifications').select('created_at').eq('user_id', user.id).gte('created_at', weekStart),
      blockedWeekQuery,
    ])

    filteredToday = countRes.count ?? 0
    blockedToday = ('count' in blockedRes ? blockedRes.count : 0) ?? 0
    recentEmails = (recentRes.data ?? []) as typeof recentEmails
    weekBlocked = ('count' in weekBlockedRes ? weekBlockedRes.count : 0) ?? 0

    // Build weekly bar chart from real data
    if (weekRes.data) {
      for (const row of weekRes.data) {
        const dayOfWeek = (new Date(row.created_at).getDay() + 6) % 7 // Monday=0
        if (weeklyByDay[dayOfWeek] !== undefined) weeklyByDay[dayOfWeek]++
      }
    }
  } catch (error) {
    console.error('[DASHBOARD] Failed to load data:', error)
  }

  const timeSaved = Math.round(filteredToday * 0.75)
  const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'vous'

  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })

  // Build label lookup for quick access
  const labelById = new Map(userLabels.map(l => [l.id, l]))

  // Helper: resolve label for an email (dynamic label_id or legacy classification_result fallback)
  function resolveEmailLabel(email: typeof recentEmails[number]): { name: string; color: string; position: number } | null {
    if (email.label_id && labelById.has(email.label_id)) {
      const l = labelById.get(email.label_id)!
      return { name: l.name, color: l.color, position: l.position }
    }
    // Legacy fallback: map classification_result to approximate label
    const legacyMap: Record<string, { name: string; color: string; position: number }> = {
      'A_VOIR': { name: 'À voir', color: '#2e7d32', position: 0 },
      'FILTRE': { name: 'Filtré', color: '#5c6070', position: 50 },
      'BLOQUE': { name: 'Bloqué', color: '#c23a3a', position: 100 },
    }
    return legacyMap[email.classification_result] ?? null
  }

  // Group emails by label, preserving order
  const emailsByLabel = new Map<string, { label: { name: string; color: string; position: number }; emails: typeof recentEmails }>()
  for (const email of recentEmails) {
    const resolved = resolveEmailLabel(email)
    if (!resolved) continue
    const key = email.label_id ?? `legacy_${email.classification_result}`
    if (!emailsByLabel.has(key)) {
      emailsByLabel.set(key, { label: resolved, emails: [] })
    }
    emailsByLabel.get(key)!.emails.push(email)
  }

  // Sort groups by label position, take top labels
  const sortedGroups = [...emailsByLabel.values()].sort((a, b) => a.label.position - b.label.position)

  // The first group (lowest position = most important) goes in the featured card
  const featuredGroup = sortedGroups[0] ?? null
  const featuredEmails = featuredGroup?.emails.slice(0, 3) ?? []

  // Remaining groups go in the bottom section
  const otherGroups = sortedGroups.slice(1)

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

        {/* Right: Featured label card */}
        <div className="bg-white border border-[#e4e6ed]">
          {/* Header with colored bar */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e4e6ed]">
            <div className="w-[3px] h-4" style={{ backgroundColor: featuredGroup?.label.color ?? '#3a5bc7' }} />
            <h2 className="text-[13px] font-semibold text-[#0c1a32]">{featuredGroup?.label.name ?? '\u00c0 voir'}</h2>
            <span className="font-mono text-[10px] text-[#8b90a0]">{featuredEmails.length}</span>
            <Link href="/emails" className="font-mono text-[11px] text-[#3a5bc7] no-underline hover:underline ml-auto">
              tout voir &rarr;
            </Link>
          </div>

          {featuredEmails.length > 0 ? (
            <div className="divide-y divide-[#e4e6ed]">
              {featuredEmails.map((email) => {
                const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`
                return (
                  <a
                    key={email.gmail_message_id}
                    href={gmailLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-6 py-3.5 no-underline hover:bg-[#f5f6f9] transition-colors"
                  >
                    <div className="w-[3px] self-stretch shrink-0 mt-0.5" style={{ backgroundColor: featuredGroup?.label.color ?? '#3a5bc7' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#0c1a32] truncate">
                        {email.sender_display || email.summary || 'Email \u00e0 consulter'}
                      </p>
                      <p className="text-[11px] text-[#8b90a0] truncate">
                        {email.subject_snippet || ''}
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
              <p className="text-[12px] text-[#8b90a0]">Aucun email r&eacute;cent</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Other labels — full width */}
      <div className="bg-white border border-[#e4e6ed]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e6ed]">
          <h2 className="text-[13px] font-semibold text-[#0c1a32]">R&eacute;cemment filtr&eacute;s</h2>
          <Link href="/emails" className="font-mono text-[11px] text-[#3a5bc7] no-underline hover:underline">
            tout voir &rarr;
          </Link>
        </div>

        {otherGroups.length > 0 ? (
          <div className={`grid divide-x divide-[#e4e6ed]`} style={{ gridTemplateColumns: `repeat(${Math.min(otherGroups.length, 3)}, 1fr)` }}>
            {otherGroups.slice(0, 3).map((group) => {
              const badge = labelBadgeStyle(group.label.color)
              const shownEmails = group.emails.slice(0, 3)
              // Lower position labels are more prominent
              const opacity = group.label.position >= 5 ? 'opacity-40' : group.label.position >= 3 ? 'opacity-60' : ''
              return (
                <div key={group.label.name} className="divide-y divide-[#e4e6ed]">
                  {/* Label header */}
                  <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#e4e6ed]">
                    <div className="w-[3px] h-3" style={{ backgroundColor: group.label.color }} />
                    <span className="text-[11px] font-semibold text-[#0c1a32]">{group.label.name}</span>
                    <span className="font-mono text-[9px] text-[#8b90a0]">{group.emails.length}</span>
                  </div>
                  {shownEmails.map((email) => {
                    const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`
                    return (
                      <a
                        key={email.gmail_message_id}
                        href={gmailLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-start gap-3 px-6 py-3.5 no-underline hover:bg-[#f5f6f9] transition-colors ${opacity}`}
                      >
                        <div className="w-[3px] self-stretch shrink-0 mt-0.5" style={{ backgroundColor: group.label.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[#0c1a32] truncate">
                            {email.sender_display || email.summary || 'Email'}
                          </p>
                          <p className="text-[11px] text-[#8b90a0] truncate">
                            {email.subject_snippet || ''}
                          </p>
                          <p className="font-mono text-[10px] text-[#c4c7d4] mt-0.5">
                            {timeAgo(email.created_at)}
                          </p>
                        </div>
                        <span
                          className="shrink-0 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          {group.label.name}
                        </span>
                      </a>
                    )
                  })}
                  {shownEmails.length === 0 && (
                    <div className={`py-8 text-center ${opacity}`}>
                      <p className="text-[12px] text-[#8b90a0]">Aucun email</p>
                    </div>
                  )}
                </div>
              )
            })}
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
