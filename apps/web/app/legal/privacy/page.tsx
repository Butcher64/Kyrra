import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de Confidentialite — Kyrra',
}

export default function PrivacyPage() {
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
            href="/legal/cgu"
            className="no-underline transition-opacity duration-150 hover:opacity-70"
          >
            Conditions Generales d&apos;Utilisation
          </Link>
        </nav>

        <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-medium mt-6 mb-2">
          Politique de Confidentialite
        </h1>
        <p className="text-xs text-[var(--muted-foreground)] mb-10">
          Derniere mise a jour : 23 mars 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--foreground)]">
          <section>
            <h2 className="text-base font-medium mb-3">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des donnees personnelles est Kyrra SAS,
              dont le siege social est situe en France. Contact : privacy@kyrra.io
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">2. Donnees collectees</h2>
            <p className="mb-3">
              Dans le cadre du Service, Kyrra collecte et traite les donnees suivantes :
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Adresse email (via Google OAuth)</li>
              <li>Metadonnees des emails entrants (expediteur, objet, identifiants)</li>
              <li>Hash SHA-256 des adresses email de vos correspondants (whitelist)</li>
              <li>Resultats de classification (labels appliques, scores de confiance)</li>
              <li>Preferences utilisateur (mode d&apos;exposition, parametres Recap)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">3. Donnees NON collectees</h2>
            <p className="mb-3">
              Conformement a notre principe de Zero Data Retention :
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Le contenu des emails n&apos;est jamais stocke — traitement en memoire uniquement</li>
              <li>Aucun corps d&apos;email n&apos;est enregistre dans nos bases de donnees</li>
              <li>Les adresses email de vos contacts sont hashees (SHA-256) et non reversibles</li>
              <li>Aucune donnee n&apos;est partagee avec des tiers a des fins publicitaires</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">4. Finalites du traitement</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Classification automatique des emails de prospection</li>
              <li>Generation du Recap quotidien</li>
              <li>Amelioration de la precision du filtrage</li>
              <li>Generation de statistiques d&apos;utilisation anonymisees</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">5. Base legale</h2>
            <p>
              Le traitement est fonde sur le consentement de l&apos;utilisateur (article 6.1.a du RGPD),
              obtenu lors de l&apos;autorisation Google OAuth et l&apos;acceptation des presentes conditions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">6. Hebergement et securite</h2>
            <p>
              Les donnees sont hebergees au sein de l&apos;Union Europeenne. Les tokens d&apos;acces
              Gmail sont chiffres au repos (AES-256-GCM). Les communications sont securisees
              par TLS 1.3. Aucun acces direct a la base de donnees n&apos;est possible depuis
              l&apos;application cliente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">7. Duree de conservation</h2>
            <p>
              Les donnees de classification sont conservees tant que le compte est actif.
              Les tokens de reclassification expirent apres 7 jours. Lors de la suppression
              du compte, toutes les donnees associees sont effacees de maniere irreversible.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">8. Vos droits (RGPD)</h2>
            <p className="mb-3">
              Conformement au Reglement General sur la Protection des Donnees, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Acces</strong> — obtenir une copie de vos donnees personnelles</li>
              <li><strong>Rectification</strong> — corriger des donnees inexactes</li>
              <li><strong>Effacement</strong> — supprimer vos donnees (desinstallation complete)</li>
              <li><strong>Portabilite</strong> — recevoir vos donnees dans un format structure</li>
              <li><strong>Opposition</strong> — vous opposer au traitement de vos donnees</li>
              <li><strong>Limitation</strong> — restreindre le traitement de vos donnees</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous a : privacy@kyrra.io
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">9. Sous-traitants</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Supabase (base de donnees, hebergement EU)</li>
              <li>Vercel (hebergement application web)</li>
              <li>Railway (hebergement worker)</li>
              <li>Postmark (envoi d&apos;emails transactionnels)</li>
              <li>OpenAI / Anthropic (classification IA, sans retention de donnees)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">10. Modifications</h2>
            <p>
              Kyrra se reserve le droit de modifier la presente politique. Les utilisateurs
              seront notifies par email de toute modification substantielle au moins 30 jours
              avant son entree en vigueur.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3">11. Reclamation</h2>
            <p>
              Si vous estimez que le traitement de vos donnees constitue une violation du RGPD,
              vous avez le droit d&apos;introduire une reclamation aupres de la CNIL (Commission
              Nationale de l&apos;Informatique et des Libertes) : www.cnil.fr
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
          <Link
            href="/legal/cgu"
            className="no-underline transition-opacity duration-150 hover:opacity-70"
          >
            Conditions Generales d&apos;Utilisation &rarr;
          </Link>
        </div>
      </article>
    </main>
  )
}
