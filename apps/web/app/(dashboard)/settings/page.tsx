
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="flex justify-center px-6 pt-16 pb-12 min-h-screen">
      <div className="w-full max-w-[560px]">
        <h1 className="text-xl font-medium mb-8">
          Paramètres
        </h1>

        {/* Exposure mode */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-(--card-foreground)">
            Mode d&apos;exposition
          </h2>
          <p className="text-xs text-(--muted-foreground)">
            Contrôlez le niveau de filtrage de Kyrra.
          </p>
        </section>

        {/* Recap preferences */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-(--card-foreground)">
            Recap
          </h2>
          <p className="text-xs text-(--muted-foreground)">
            Fréquence et heure de livraison du Recap quotidien.
          </p>
        </section>

        {/* Display preferences */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-(--card-foreground)">
            Affichage
          </h2>
          <p className="text-xs text-(--muted-foreground)">
            Scores de confiance : seulement en cas de doute (&lt;75%) ou toujours afficher.
          </p>
        </section>

        {/* Account */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-(--card-foreground)">
            Compte
          </h2>
          <p className="text-xs text-(--muted-foreground)">
            {user?.email}
          </p>
        </section>

        <a href="/" className="text-xs text-[var(--color-a-voir)] no-underline transition-opacity duration-150 hover:opacity-70">
          &larr; Retour au tableau de bord
        </a>
      </div>
    </main>
  )
}
