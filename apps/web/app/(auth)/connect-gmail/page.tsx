import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/layout/Logo'
import { ConsentForm } from './ConsentForm.client'

export default async function ConnectGmailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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
          <blockquote className="text-3xl font-headline font-light leading-snug text-white/90">
            &ldquo;Un clic, et le silence revient.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-white/50">&mdash; Sophie, DRH, 120 salaries</p>
        </div>
        <p className="relative z-10 text-xs font-mono text-white/30">
          Kyrra &middot; Pare-feu cognitif anti-prospection
        </p>
      </div>

      {/* Right panel: consent form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-(--background)">
        <div className="w-full max-w-[440px]">
          <Logo className="mb-10 lg:hidden" />

          {/* Glass card */}
          <div className="rounded-xl border border-(--border) bg-(--card) p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="size-11 rounded-full bg-brand-gradient flex items-center justify-center shrink-0">
                <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-headline font-medium text-(--foreground)">
                  Connecter Gmail
                </h1>
                <p className="text-xs text-(--muted-foreground) font-mono">
                  Consentement &amp; connexion
                </p>
              </div>
            </div>

            {/* What Kyrra does */}
            <div className="rounded-lg border border-(--border) bg-(--background) p-4 mb-3">
              <h2 className="text-xs font-semibold text-[var(--color-protected)] mb-3 uppercase tracking-wider">
                Ce que Kyrra fait
              </h2>
              <ul className="flex flex-col gap-2">
                <li className="text-sm text-(--card-foreground) flex items-start gap-2">
                  <span className="text-[var(--color-protected)] mt-0.5 shrink-0">&#x2713;</span>
                  Ajouter des labels a vos emails
                </li>
                <li className="text-sm text-(--card-foreground) flex items-start gap-2">
                  <span className="text-[var(--color-protected)] mt-0.5 shrink-0">&#x2713;</span>
                  Lire les en-tetes pour classifier
                </li>
              </ul>
            </div>

            {/* What Kyrra NEVER does */}
            <div className="rounded-lg border border-(--border) bg-(--background) p-4 mb-6">
              <h2 className="text-xs font-semibold text-[var(--color-attention)] mb-3 uppercase tracking-wider">
                Ce que Kyrra ne fait jamais
              </h2>
              <ul className="flex flex-col gap-2">
                <li className="text-sm text-(--card-foreground) flex items-start gap-2">
                  <span className="text-[var(--color-attention)] mt-0.5 shrink-0">&#x2717;</span>
                  Lire le contenu complet de vos emails
                </li>
                <li className="text-sm text-(--card-foreground) flex items-start gap-2">
                  <span className="text-[var(--color-attention)] mt-0.5 shrink-0">&#x2717;</span>
                  Supprimer un email
                </li>
                <li className="text-sm text-(--card-foreground) flex items-start gap-2">
                  <span className="text-[var(--color-attention)] mt-0.5 shrink-0">&#x2717;</span>
                  Envoyer depuis votre compte
                </li>
              </ul>
            </div>

            {/* RGPD consent + connect button */}
            <ConsentForm />
          </div>

          <p className="text-xs text-(--muted-foreground) mt-6 text-center leading-relaxed">
            Un clic pour tout annuler. Votre boite revient exactement comme avant.
          </p>
        </div>
      </div>
    </main>
  )
}
