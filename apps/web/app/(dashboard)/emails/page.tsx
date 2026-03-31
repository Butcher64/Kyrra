import { Mail, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type ClassificationResult = 'A_VOIR' | 'FILTRE' | 'BLOQUE'

const classificationConfig: Record<ClassificationResult, {
  label: string
  bar: string
  badgeBg: string
  badgeText: string
  opacity: string
  fontWeight: string
  lineThrough: boolean
}> = {
  A_VOIR: {
    label: 'À voir',
    bar: 'bar-a-voir',
    badgeBg: 'bg-[#e8edf8]',
    badgeText: 'text-[#2d4a8a]',
    opacity: 'opacity-100',
    fontWeight: 'font-semibold',
    lineThrough: false,
  },
  FILTRE: {
    label: 'Filtré',
    bar: 'bar-filtre',
    badgeBg: 'bg-[#edeef2]',
    badgeText: 'text-[#5c6070]',
    opacity: 'opacity-55',
    fontWeight: 'font-normal',
    lineThrough: false,
  },
  BLOQUE: {
    label: 'Bloqué',
    bar: 'bar-bloque',
    badgeBg: 'bg-[#f8e8e8]',
    badgeText: 'text-[#8a2d2d]',
    opacity: 'opacity-30',
    fontWeight: 'font-normal',
    lineThrough: true,
  },
}

export default async function EmailsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: classifications } = await supabase
    .from('email_classifications')
    .select('gmail_message_id, classification_result, summary, confidence_score, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const emails = classifications ?? []

  const countAVoir = emails.filter((e) => e.classification_result === 'A_VOIR').length
  const countFiltre = emails.filter((e) => e.classification_result === 'FILTRE').length
  const countBloque = emails.filter((e) => e.classification_result === 'BLOQUE').length
  const totalPages = Math.max(1, Math.ceil(emails.length / 50))

  const tabs = [
    { label: 'Tous', count: emails.length, active: true },
    { label: 'À voir', count: countAVoir, active: false },
    { label: 'Filtrés', count: countFiltre, active: false },
    { label: 'Bloqués', count: countBloque, active: false },
  ]

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
                const result = email.classification_result as ClassificationResult
                const config = classificationConfig[result] ?? classificationConfig.FILTRE
                const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`
                const time = new Intl.DateTimeFormat('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(email.created_at))

                // Extract a pseudo sender from gmail_message_id (first 8 chars)
                const messageIdShort = email.gmail_message_id
                  ? email.gmail_message_id.slice(0, 12)
                  : '—'

                return (
                  <a
                    key={email.gmail_message_id}
                    href={gmailLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-stretch no-underline transition-colors hover:bg-[#f5f6f9] ${config.opacity}`}
                  >
                    {/* Classification bar */}
                    <span className={`shrink-0 ${config.bar}`} />

                    {/* Main content */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4 px-5 py-3.5">
                      {/* Left: sender + subject + excerpt */}
                      <div className="min-w-0 flex-1">
                        {/* Sender line */}
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`text-[13px] ${config.fontWeight} text-[#0c1a32] truncate ${
                              config.lineThrough ? 'line-through' : ''
                            }`}
                          >
                            {email.summary ?? 'Email trié'}
                          </span>
                        </div>

                        {/* Message ID as subtitle */}
                        <p className="font-mono text-[9px] text-[#c4c7d4] mt-0.5 truncate">
                          id: {messageIdShort}
                        </p>
                      </div>

                      {/* Right: badge + confidence + time */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Classification badge */}
                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${config.badgeBg} ${config.badgeText}`}
                        >
                          {config.label}
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
