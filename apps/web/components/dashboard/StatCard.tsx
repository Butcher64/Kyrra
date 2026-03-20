interface StatCardProps {
  value: string | number
  label: string
  accent?: boolean // blue for "À voir"
}

export function StatCard({ value, label, accent }: StatCardProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: '14px 16px',
        border: '1px solid #e5e5e3',
        borderRadius: '10px',
        transition: 'border-color 0.2s ease',
      }}
    >
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '20px',
          fontWeight: 500,
          color: accent ? '#3b82f6' : 'var(--foreground, #1a1a18)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: '#9ca3af',
          marginTop: '2px',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  )
}
