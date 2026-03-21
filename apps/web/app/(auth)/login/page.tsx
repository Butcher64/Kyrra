
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h1 className="font-(family-name:--font-outfit) text-[2rem] font-light tracking-[-0.02em] text-(--foreground)">
        Kyrra
      </h1>
      <p className="text-(--muted-foreground) text-sm">
        Faites taire le bruit. Gardez l&apos;essentiel.
      </p>
      <form action="/auth/callback" method="GET">
        <Button type="submit" size="lg" className="bg-[var(--color-a-voir)] text-white hover:opacity-80">
          Se connecter avec Google
        </Button>
      </form>
    </main>
  )
}
