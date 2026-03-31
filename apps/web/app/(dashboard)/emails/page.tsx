import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type ClassificationResult = 'A_VOIR' | 'FILTRE' | 'BLOQUE'

const resultConfig: Record<ClassificationResult, { variant: 'a-voir' | 'filtre' | 'bloque'; label: string }> = {
  A_VOIR: { variant: 'a-voir', label: 'À voir' },
  FILTRE: { variant: 'filtre', label: 'Filtré' },
  BLOQUE: { variant: 'bloque', label: 'Bloqué' },
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
        <h1 className="font-outfit text-2xl font-semibold text-[var(--foreground)]">
          Mes emails
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Historique de tri
        </p>
      </div>

      {emails.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Mail size={32} strokeWidth={1} className="text-[var(--muted-foreground)]/40 mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Aucun email trié pour le moment.
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]/60">
            Kyrra trie vos emails en arrière-plan.
          </p>
        </div>
      ) : (
        <Card variant="glass">
          <CardContent className="divide-y divide-[var(--border)] p-0">
            {emails.map((email) => {
              const result = email.classification_result as ClassificationResult
              const config = resultConfig[result] ?? resultConfig.FILTRE
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
                  className="flex items-center gap-3 px-4 py-3.5 no-underline transition-opacity duration-150 hover:opacity-70"
                >
                  <Badge variant={config.variant} className="shrink-0">
                    {config.label}
                  </Badge>
                  <span className="flex-1 truncate text-[13px] text-[var(--card-foreground)]">
                    {email.summary ?? 'Email trié'}
                  </span>
                  {email.confidence_score !== null && (
                    <span className="shrink-0 text-[11px] text-[var(--muted-foreground)]">
                      {Math.round(email.confidence_score * 100)}%
                    </span>
                  )}
                  <span className="shrink-0 text-[11px] text-[var(--muted-foreground)]">
                    {time}
                  </span>
                  <span className="shrink-0 text-[13px] text-[var(--border)]">&rarr;</span>
                </a>
              )
            })}
          </CardContent>
        </Card>
      )}
    </>
  )
}
