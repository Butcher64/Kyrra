interface DegradedModeBannerProps {
  visible: boolean
}

export function DegradedModeBanner({ visible }: DegradedModeBannerProps) {
  if (!visible) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        padding: '12px 20px',
        background: '#fef3c7',
        borderBottom: '1px solid #fde68a',
        fontSize: '13px',
        color: '#92400e',
        textAlign: 'center',
      }}
    >
      Kyrra fonctionne en mode simplifié. Vos emails sont filtrés avec une confiance légèrement réduite.
    </div>
  )
}
