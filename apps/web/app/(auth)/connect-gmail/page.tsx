import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ConnectGmailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // TODO: Check if user already has an active Gmail integration
  // If so, redirect to dashboard

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: '#f0fdf4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        marginBottom: '2rem',
      }}>
        🔒
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>
        Avant de connecter votre Gmail
      </h1>

      <div style={{ marginTop: '2rem', width: '100%' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#16a34a', marginBottom: '0.75rem' }}>
          Ce que Kyrra fait ✓
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li style={{ fontSize: '0.875rem', color: '#374151' }}>✓ Ajouter des labels à vos emails</li>
          <li style={{ fontSize: '0.875rem', color: '#374151' }}>✓ Lire les en-têtes pour classifier</li>
        </ul>
      </div>

      <div style={{ marginTop: '1.5rem', width: '100%' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#dc2626', marginBottom: '0.75rem' }}>
          Ce que Kyrra ne fait JAMAIS ✗
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li style={{ fontSize: '0.875rem', color: '#374151' }}>✗ Lire le contenu complet de vos emails</li>
          <li style={{ fontSize: '0.875rem', color: '#374151' }}>✗ Supprimer un email</li>
          <li style={{ fontSize: '0.875rem', color: '#374151' }}>✗ Envoyer depuis votre compte</li>
        </ul>
      </div>

      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1.5rem', textAlign: 'center' }}>
        🔄 Un clic pour tout annuler. Votre boîte revient exactement comme avant.
      </p>

      <a
        href="/auth/callback/google"
        style={{
          marginTop: '2rem',
          padding: '0.75rem 2rem',
          background: '#2563eb',
          color: 'white',
          borderRadius: '8px',
          fontSize: '1rem',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Connecter Gmail →
      </a>
    </main>
  )
}
