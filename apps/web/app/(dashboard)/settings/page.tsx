
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '64px 24px 48px',
      minHeight: '100vh',
      background: '#fafaf9',
    }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '2rem' }}>
          Paramètres
        </h1>

        {/* Exposure mode */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
            Mode d&apos;exposition
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Contrôlez le niveau de filtrage de Kyrra.
          </p>
        </section>

        {/* Recap preferences */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
            Recap
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Fréquence et heure de livraison du Recap quotidien.
          </p>
        </section>

        {/* Display preferences */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
            Affichage
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Scores de confiance : seulement en cas de doute (&lt;75%) ou toujours afficher.
          </p>
        </section>

        {/* Account */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
            Compte
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {user?.email}
          </p>
        </section>

        <a href="/" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>
          ← Retour au tableau de bord
        </a>
      </div>
    </main>
  )
}
