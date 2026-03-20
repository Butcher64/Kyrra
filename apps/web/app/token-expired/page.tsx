export default function TokenExpiredPage() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
    }}>
      <p style={{ fontSize: '1rem', color: '#6b7280' }}>
        Ce lien a expiré (7 jours) ou a déjà été utilisé.
      </p>
      <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
        Reclassifiez depuis le tableau de bord.
      </p>
      <a href="/" style={{
        marginTop: '1rem',
        padding: '0.75rem 2rem',
        background: '#2563eb',
        color: 'white',
        borderRadius: '8px',
        textDecoration: 'none',
      }}>
        Ouvrir le tableau de bord →
      </a>
    </main>
  )
}
