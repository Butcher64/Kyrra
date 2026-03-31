import { Badge } from '@/components/ui/badge'

interface ClassificationCardProps {
  summary: string
  gmailMessageId: string
  confidenceScore?: number
}

export function ClassificationCard({ summary, gmailMessageId, confidenceScore }: ClassificationCardProps) {
  const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${gmailMessageId}`

  return (
    <a
      href={gmailLink}
      target="_blank"
      rel="noopener noreferrer"
      role="article"
      aria-label={`Email: ${summary}`}
      className="flex items-center py-3.5 border-b border-(--border) gap-3 no-underline transition-opacity duration-150 hover:opacity-70"
    >
      <Badge variant="a-voir" className="shrink-0">
        À voir
      </Badge>
      <span className="text-[13px] font-mono text-(--card-foreground) flex-1 truncate">
        {summary}
      </span>
      {confidenceScore !== undefined && confidenceScore < 0.75 && (
        <span className="text-[11px] font-mono text-(--muted-foreground) shrink-0">
          {Math.round(confidenceScore * 100)}%
        </span>
      )}
      <span className="text-(--border) text-[13px] shrink-0">&rarr;</span>
    </a>
  )
}
