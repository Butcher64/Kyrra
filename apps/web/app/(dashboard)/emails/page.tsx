import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type ClassificationResult = 'A_VOIR' | 'FILTRE' | 'BLOQUE'

const classificationConfig: Record<ClassificationResult, { label: string; bar: string; badgeBg: string; badgeText: string; opacity: string; fontWeight: string }> = {
  A_VOIR: { label: 'À voir', bar: 'bar-a-voir', badgeBg: 'bg-[#e8edf8]', badgeText: 'text-[#2d4a8a]', opacity: 'opacity-100', fontWeight: 'font-medium' },
  FILTRE: { label: 'Filtré', bar: 'bar-filtre', badgeBg: 'bg-[#edeef2]', badgeText: 'text-[#5c6070]', opacity: 'opacity-55', fontWeight: 'font-normal' },
  BLOQUE: { label: 'Bloqué', bar: 'bar-bloque', badgeBg: 'bg-[#f8e8e8]', badgeText: 'text-[#8a2d2d]', opacity: 'opacity-30', fontWeight: 'font-normal' },
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

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#0c1a32] tracking-tight">
          Mes emails
        </h1>
        <p className="font-mono text-[11px] text-[#8b90a0] mt-1">
          Historique de tri
        </p>
      </div>

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
        <div className="bg-white border border-[#e4e6ed]">
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
                      {email.summary ?? 'Email trié'}
                    </p>
                  </div>

                  {/* Badge */}
                  <span className={`shrink-0 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${config.badgeBg} ${config.badgeText}`}>
                    {config.label}
                  </span>

                  {/* Confidence */}
                  {email.confidence_score !== null && (
                    <span className="shrink-0 font-mono text-[10px] text-[#c4c7d4]">
                      {Math.round(email.confidence_score * 100)}%
                    </span>
                  )}

                  {/* Time */}
                  <span className="shrink-0 font-mono text-[10px] text-[#c4c7d4]">
                    {time}
                  </span>

                  <span className="shrink-0 text-[13px] text-[#e4e6ed]">&rarr;</span>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
