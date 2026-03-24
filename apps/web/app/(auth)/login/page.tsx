import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/layout/Logo'
import { GoogleIcon } from '@/components/icons/GoogleIcon'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen">
      {/* Left panel: brand showcase — hidden on mobile */}
      <div className="hidden lg:flex w-1/2 bg-brand-gradient relative overflow-hidden flex-col justify-between p-12">
        <div className="bg-grid absolute inset-0 opacity-20" />
        <div className="relative z-10">
          <Logo variant="white" />
        </div>
        <div className="relative z-10">
          <blockquote className="text-3xl font-outfit font-light leading-snug text-white/90">
            &ldquo;312 distractions supprimees cette semaine.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-white/50">&mdash; Marc, CEO, 47 salaries</p>
        </div>
        <p className="relative z-10 text-xs font-mono text-white/30">
          Kyrra &middot; Pare-feu cognitif anti-prospection
        </p>
      </div>

      {/* Right panel: login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-(--background)">
        <div className="w-full max-w-[380px]">
          <Logo className="mb-12 lg:hidden" />

          <h1 className="text-2xl font-outfit font-medium text-(--foreground)">
            Bienvenue
          </h1>
          <p className="text-sm text-(--muted-foreground) mt-2">
            Connectez-vous pour acceder a votre tableau de bord.
          </p>

          <form action="/auth/callback" method="GET" className="mt-8">
            <input type="hidden" name="next" value="/connect-gmail" />
            <button
              type="submit"
              className="w-full h-12 rounded-lg bg-(--foreground) text-(--background) font-medium text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <GoogleIcon className="size-5" />
              Continuer avec Google
            </button>
          </form>

          <p className="text-xs text-(--muted-foreground) mt-8 text-center leading-relaxed">
            En continuant, vous acceptez nos{' '}
            <a href="/legal/cgu" className="underline hover:text-(--foreground)">CGU</a>
            {' '}et notre{' '}
            <a href="/legal/privacy" className="underline hover:text-(--foreground)">Politique de confidentialite</a>.
          </p>
        </div>
      </div>
    </main>
  )
}
