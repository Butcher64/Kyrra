import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions Generales d\'Utilisation — Kyrra',
}

export default function CGUPage() {
  return (
    <main className="flex justify-center px-6 pt-16 pb-12 min-h-screen">
      <article className="w-full max-w-[640px]">
        <nav className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <Link
            href="/"
            className="text-[var(--color-a-voir)] no-underline transition-opacity duration-150 hover:opacity-70"
          >
            &larr; Tableau de bord
          </Link>
          <span>&middot;</span>
          <Link
            href="/legal/privacy"
            className="no-underline transition-opacity duration-150 hover:opacity-70"
          >
            Politique de confidentialite
          </Link>
        </nav>

        <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-medium mt-6 mb-2">
          Conditions Generales d&apos;Utilisation
        </h1>
        <p className="text-xs text-[var(--muted-foreground)] mb-10">
          Derniere mise a jour : 23 mars 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--foreground)]">
          <section>
            <h2 className="text-base font-medium mb-3">1. Objet</h2>
            <p>
              Les presentes Conditions Generales d&apos;Utilisation (ci-apres &laquo; CGU &raquo;)
              regissent l&apos;acces et l&apos;utilisation du service Kyrra (ci-apres &laquo; le Service &raquo;),
              edite par Kyrra SAS, accessible a l&apos;adresse app.kyrra.io.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">2. Acceptation des CGU</h2>
            <p>
              L&apos;utilisation du Service implique l&apos;acceptation pleine et entiere des presentes CGU.
              Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser le Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">3. Description du Service</h2>
            <p>
              Kyrra est un service de filtrage intelligent d&apos;emails par intelligence artificielle.
              Il analyse les emails entrants pour identifier et classifier automatiquement les
              emails de prospection commerciale, permettant aux utilisateurs de se concentrer
              sur les messages importants.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">4. Inscription et compte</h2>
            <p>
              L&apos;acces au Service necessite la creation d&apos;un compte via authentification Google OAuth.
              L&apos;utilisateur garantit l&apos;exactitude des informations fournies et s&apos;engage a
              maintenir la confidentialite de ses identifiants d&apos;acces.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">5. Acces Gmail et permissions</h2>
            <p>
              Le Service accede a votre compte Gmail via les API Google avec les permissions
              strictement necessaires a son fonctionnement : lecture des emails entrants,
              application de labels, et lecture de l&apos;historique d&apos;envoi pour la whitelist.
              Aucun contenu d&apos;email n&apos;est stocke de maniere permanente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">6. Tarification</h2>
            <p>
              Le Service propose plusieurs formules : Free (30 emails/jour), Pro (15&euro;/mois)
              et Team (19&euro;/utilisateur/mois). Un essai gratuit de 14 jours est offert pour
              les formules payantes. Les tarifs peuvent etre modifies avec un preavis de 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">7. Limitation de responsabilite</h2>
            <p>
              Kyrra s&apos;efforce de fournir un service fiable mais ne peut garantir l&apos;absence
              d&apos;erreurs de classification. Le Service fonctionne par quarantaine (labeling)
              et ne supprime jamais d&apos;email. L&apos;utilisateur conserve un acces complet a tous
              ses emails via Gmail.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">8. Resiliation</h2>
            <p>
              L&apos;utilisateur peut resilier son compte a tout moment depuis les parametres.
              La desinstallation supprime tous les labels Kyrra de Gmail, arrete le
              traitement des emails et efface les donnees associees au compte.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">9. Droit applicable</h2>
            <p>
              Les presentes CGU sont soumises au droit francais. Tout litige sera soumis
              aux tribunaux competents de Paris, sauf disposition legale contraire.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">10. Contact</h2>
            <p>
              Pour toute question relative aux presentes CGU, vous pouvez nous contacter
              a l&apos;adresse : legal@kyrra.io
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
          <Link
            href="/legal/privacy"
            className="no-underline transition-opacity duration-150 hover:opacity-70"
          >
            Politique de confidentialite &rarr;
          </Link>
        </div>
      </article>
    </main>
  )
}
