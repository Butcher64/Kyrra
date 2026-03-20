type Status = 'protected' | 'alert' | 'degraded' | 'paused'

interface ProtectedStatusBadgeProps {
  status: Status
  alertCount?: number
}

const statusConfig: Record<Status, { dotColor: string; text: string }> = {
  protected: { dotColor: '#22c55e', text: 'Votre boîte est protégée' },
  alert: { dotColor: '#f59e0b', text: '' }, // Dynamic text
  degraded: { dotColor: '#f59e0b', text: 'Mode simplifié actif' },
  paused: { dotColor: '#9ca3af', text: 'Classification en pause' },
}

export function ProtectedStatusBadge({ status, alertCount }: ProtectedStatusBadgeProps) {
  const config = statusConfig[status]
  const text = status === 'alert'
    ? `${alertCount} email${(alertCount ?? 0) > 1 ? 's' : ''} nécessite${(alertCount ?? 0) > 1 ? 'nt' : ''} votre attention`
    : config.text

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: '#6b7280',
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: config.dotColor,
          flexShrink: 0,
          animation: status === 'protected' ? 'pulse 3s ease-in-out infinite' : undefined,
        }}
      />
      {text}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
