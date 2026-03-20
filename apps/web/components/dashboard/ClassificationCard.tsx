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
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 0',
        borderBottom: '1px solid #f0f0ee',
        gap: '12px',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'opacity 0.15s',
      }}
      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7' }}
      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
    >
      <span
        style={{
          fontSize: '10px',
          padding: '3px 8px',
          borderRadius: '100px',
          background: '#dbeafe',
          color: '#2563eb',
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
      >
        À voir
      </span>
      <span
        style={{
          fontSize: '13px',
          color: '#374151',
          flex: 1,
          whiteSpace: 'nowrap' as const,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {summary}
      </span>
      {confidenceScore !== undefined && confidenceScore < 0.75 && (
        <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>
          {Math.round(confidenceScore * 100)}%
        </span>
      )}
      <span style={{ color: '#d1d5db', fontSize: '13px', flexShrink: 0 }}>→</span>
    </a>
  )
}
