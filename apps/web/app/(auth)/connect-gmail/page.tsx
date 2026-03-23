
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConsentForm } from './ConsentForm.client'

export default async function ConnectGmailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-8 max-w-[480px] mx-auto">
      {/* Icon */}
      <div className="size-12 rounded-full bg-[oklch(0.627_0.194_149.214/0.12)] flex items-center justify-center text-2xl mb-8">
        <span aria-hidden="true">&#x1F512;</span>
      </div>

      <h1 className="text-2xl font-medium mb-2 text-(--foreground)">
        Avant de connecter votre Gmail
      </h1>

      {/* What Kyrra does */}
      <div className="mt-8 w-full">
        <h2 className="text-sm font-semibold text-[var(--color-protected)] mb-3">
          Ce que Kyrra fait &#x2713;
        </h2>
        <ul className="flex flex-col gap-2 list-none p-0">
          <li className="text-sm text-(--card-foreground)">&#x2713; Ajouter des labels à vos emails</li>
          <li className="text-sm text-(--card-foreground)">&#x2713; Lire les en-têtes pour classifier</li>
        </ul>
      </div>

      {/* What Kyrra NEVER does — amber, not red (Nordic Calm: zero red in UI) */}
      <div className="mt-6 w-full">
        <h2 className="text-sm font-semibold text-[var(--color-attention)] mb-3">
          Ce que Kyrra ne fait JAMAIS &#x2717;
        </h2>
        <ul className="flex flex-col gap-2 list-none p-0">
          <li className="text-sm text-(--card-foreground)">&#x2717; Lire le contenu complet de vos emails</li>
          <li className="text-sm text-(--card-foreground)">&#x2717; Supprimer un email</li>
          <li className="text-sm text-(--card-foreground)">&#x2717; Envoyer depuis votre compte</li>
        </ul>
      </div>

      <p className="text-xs text-(--muted-foreground) mt-6 text-center">
        Un clic pour tout annuler. Votre boîte revient exactement comme avant.
      </p>

      {/* RGPD consent + connect button */}
      <ConsentForm />
    </main>
  )
}
