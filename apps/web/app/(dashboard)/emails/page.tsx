import { Mail, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function EmailsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's dynamic labels
  const { data: userLabels } = await supabase
    .from('user_labels')
    .select('id, name, color, position')
    .eq('user_id', user!.id)
    .order('position', { ascending: true })

  const labels = userLabels ?? []

  // Fetch classifications (join labels in memory — avoids PostgREST FK/RLS issues)
  const { data: classifications } = await supabase
    .from('email_classifications')
    .select('gmail_message_id, label_id, summary, confidence_score, created_at, sender_display, subject_snippet')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const labelMap = new Map(labels.map((l) => [l.id, l]))

  const emails = (classifications ?? []).map((c: any) => {
    const label = c.label_id ? labelMap.get(c.label_id) : null
    return {
      gmail_message_id: c.gmail_message_id,
      label_id: c.label_id,
      label_name: label?.name ?? 'Inconnu',
      label_color: label?.color ?? '#8b90a0',
      label_position: label?.position ?? 99,
      summary: c.summary,
      confidence_score: c.confidence_score,
      created_at: c.created_at,
      sender_display: c.sender_display,
      subject_snippet: c.subject_snippet,
    }
  })

  // Build tabs from user's labels
  const labelCounts = new Map<string, number>()
  for (const email of emails) {
    labelCounts.set(email.label_name, (labelCounts.get(email.label_name) ?? 0) + 1)
  }

  const tabs = [
    { label: 'Tous', count: emails.length, active: true },
    ...labels.map((l) => ({
      label: l.name,
      count: labelCounts.get(l.name) ?? 0,
      active: false,
    })),
  ]

  const totalPages = Math.max(1, Math.ceil(emails.length / 50))

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#0c1a32] tracking-tight">
            Mes emails
          </h1>
          <p className="font-mono text-[11px] text-[#8b90a0] mt-1">
            {emails.length} derniers emails triés
          </p>
        </div>

        {/* Search bar (visual only) */}
        <div className="flex items-center gap-2 border border-[#e4e6ed] bg-white px-4 py-2 w-[280px]">
          <Search size={14} strokeWidth={1.5} className="text-[#8b90a0] shrink-0" />
          <input
            type="text"
            placeholder="Rechercher un email..."
            disabled
            className="w-full bg-transparent text-[13px] text-[#0c1a32] placeholder:text-[#c4c7d4] outline-none cursor-default font-sans"
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 border-b border-[#e4e6ed] mb-0">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            disabled
            className={`px-5 py-2.5 text-[13px] cursor-default transition-colors ${
              tab.active
                ? 'text-[#0c1a32] font-medium border-b-2 border-[#0c1a32] -mb-px'
                : 'text-[#8b90a0]'
            }`}
          >
            {tab.label}
            <span className="font-mono text-[10px] ml-1.5 opacity-60">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Email list ── */}
      {emails.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Mail size={28} strokeWidth={1} className="text-[#c4c7d4] mb-3" />
          <p className="text-[13px] text-[#8b90a0]">
            Aucun email trié pour le moment.
          </p>
          <p className="font-mono text-[10px] text-[#c4c7d4] mt-1">
            Kyrra trie vos emails en arrière-plan.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white border-x border-b border-[#e4e6ed]">
            <div className="divide-y divide-[#e4e6ed]">
              {emails.map((email) => {
                const isBlocked = email.label_position >= 5
                const isFiltered = email.label_position >= 3 && email.label_position < 5
                const opacity = isBlocked ? 'opacity-30' : isFiltered ? 'opacity-55' : 'opacity-100'
                const fontWeight = email.label_position <= 2 ? 'font-semibold' : 'font-normal'
                const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`
                const time = new Intl.DateTimeFormat('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(email.created_at))

                return (
                  <a
                    key={email.gmail_message_id}
                    href={gmailLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-stretch no-underline transition-colors hover:bg-[#f5f6f9] ${opacity}`}
                  >
                    {/* Classification color bar */}
                    <span
                      className="shrink-0 w-[3px]"
                      style={{ backgroundColor: email.label_color }}
                    />

                    {/* Main content */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4 px-5 py-3.5">
                      {/* Left: sender + subject + summary */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-[13px] ${fontWeight} text-[#0c1a32] truncate`}>
                            {email.sender_display || email.summary || 'Email trié'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8b90a0] mt-0.5 truncate">
                          {email.subject_snippet || email.summary || ''}
                        </p>
                      </div>

                      {/* Right: label badge + confidence + time */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Dynamic label badge */}
                        <span
                          className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider"
                          style={{
                            backgroundColor: `${email.label_color}20`,
                            color: email.label_color,
                          }}
                        >
                          {email.label_name}
                        </span>

                        {/* Confidence + time */}
                        <div className="flex items-center gap-2 font-mono text-[9px] text-[#c4c7d4]">
                          {email.confidence_score !== null && (
                            <span>{Math.round(email.confidence_score * 100)}%</span>
                          )}
                          <span>{time}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>

          {/* ── Pagination (visual only) ── */}
          <div className="flex items-center justify-between mt-3">
            <span className="font-mono text-[11px] text-[#8b90a0]">
              page 1 / {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                disabled
                className="w-8 h-8 flex items-center justify-center border border-[#e4e6ed] bg-white text-[#c4c7d4] cursor-default"
              >
                <ChevronLeft size={14} strokeWidth={1.5} />
              </button>
              <button
                disabled
                className="w-8 h-8 flex items-center justify-center border border-[#e4e6ed] bg-white text-[#c4c7d4] cursor-default"
              >
                <ChevronRight size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
