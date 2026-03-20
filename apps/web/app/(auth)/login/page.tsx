export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 300 }}>Kyrra</h1>
      <p style={{ color: '#6b7280' }}>Faites taire le bruit. Gardez l&apos;essentiel.</p>
      <form action="/auth/callback" method="GET">
        <button
          type="submit"
          style={{
            padding: '0.75rem 2rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Se connecter avec Google
        </button>
      </form>
    </main>
  )
}
