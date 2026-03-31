import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GoogleIcon } from '@/components/icons/GoogleIcon'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ uninstalled?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const showUninstalled = params.uninstalled === 'true'

  return (
    <main className="flex min-h-screen w-full overflow-hidden antialiased">

      {/* ── LEFT PANEL: Navy branding (50%) — desktop only ── */}
      <section className="hidden lg:flex lg:w-1/2 bg-[#0c1a32] bg-noise relative">
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">

          {/* Top — Logo */}
          <div className="flex items-center gap-3">
            <div className="w-[22px] h-[22px] bg-white/[0.08] flex items-center justify-center">
              <div className="w-[10px] h-[10px] border-[1.5px] border-white/70" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tighter font-[var(--font-sans)]">
              Kyrra
            </span>
          </div>

          {/* Center — Testimonial */}
          <div className="max-w-lg">
            <p className="font-[var(--font-serif)] text-[32px] italic text-white leading-snug">
              &ldquo;312 distractions{'\n'}supprimées cette{'\n'}semaine.&rdquo;
            </p>
            <div className="mt-6">
              <p className="text-[12px] font-semibold text-white/70">
                Marc, CEO
              </p>
              <p className="font-[var(--font-mono)] text-[10px] text-white/30">
                Innovatech
              </p>
            </div>
          </div>

          {/* Bottom — Metadata */}
          <div className="flex justify-between items-end">
            <span className="font-[var(--font-mono)] text-[9px] text-white/20 uppercase tracking-widest">
              Souveraineté numérique
            </span>
            <div className="flex items-center gap-2">
              <div className="w-[5px] h-[5px] bg-[#2dd881] rounded-full shadow-[0_0_6px_#2dd881]" />
              <span className="font-[var(--font-mono)] text-[9px] text-white/30 uppercase tracking-widest">
                Opérationnel
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ── RIGHT PANEL: Login Form (50%) ── */}
      <section className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 lg:p-16 relative">

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-12">
          <span className="text-2xl font-bold text-[#0c1a32] tracking-tighter">
            Kyrra
          </span>
        </div>

        {/* Form container */}
        <div className="w-full max-w-[380px] space-y-8">

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-[24px] font-bold text-[#0c1a32] tracking-tight">
              Bienvenue
            </h1>
            <p className="text-[13px] text-[#8b90a0]">
              Connectez-vous ou créez votre compte.
            </p>
          </div>

          {/* Uninstall success banner */}
          {showUninstalled && (
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-[#1a7a4a]">
              Votre compte a été supprimé et Kyrra a été désinstallé de Gmail.
            </div>
          )}

          {/* Google Auth — primary CTA */}
          <form action="/auth/callback" method="GET">
            <input type="hidden" name="next" value="/connect-gmail" />
            <button
              type="submit"
              className="border border-[#e4e6ed] w-full flex items-center justify-center gap-4 py-3.5 px-6 bg-white hover:bg-[#f5f6f9] transition-colors cursor-pointer"
            >
              <GoogleIcon className="w-5 h-5 shrink-0" />
              <span className="text-[13px] font-medium text-[#1a1f36]">
                Se connecter avec Google
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center">
            <div className="flex-1 h-px bg-[#e4e6ed]" />
            <span className="font-[var(--font-mono)] text-[9px] uppercase tracking-[0.12em] text-[#8b90a0] px-4 bg-white">
              ou
            </span>
            <div className="flex-1 h-px bg-[#e4e6ed]" />
          </div>

          {/* Email / password fields — disabled, coming soon */}
          <div className="relative space-y-5">

            {/* "Bientôt disponible" label */}
            <p className="text-center font-[var(--font-mono)] text-[10px] text-[#8b90a0] uppercase tracking-widest">
              Bientôt disponible
            </p>

            {/* Email field */}
            <div className="space-y-2">
              <label className="block font-[var(--font-mono)] text-[10px] uppercase tracking-widest text-[#8b90a0]">
                Adresse Email
              </label>
              <input
                type="email"
                placeholder="nom@entreprise.com"
                disabled
                className="w-full border border-[#e4e6ed] bg-[#f5f6f9] px-4 py-3.5 text-[#1a1f36] placeholder:text-[#c4c7d4] opacity-50 cursor-not-allowed"
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block font-[var(--font-mono)] text-[10px] uppercase tracking-widest text-[#8b90a0]">
                  Mot de passe
                </label>
                <span className="text-[10px] font-[var(--font-mono)] uppercase tracking-widest text-[#8b90a0]">
                  Oublié ?
                </span>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                disabled
                className="w-full border border-[#e4e6ed] bg-[#f5f6f9] px-4 py-3.5 text-[#1a1f36] placeholder:text-[#c4c7d4] opacity-50 cursor-not-allowed"
              />
            </div>

            {/* Submit button */}
            <button
              type="button"
              disabled
              className="w-full py-3.5 bg-[#f5f6f9] text-[#c4c7d4] font-semibold opacity-40 cursor-not-allowed"
            >
              Connexion
            </button>
          </div>

          {/* Sign-up link */}
          <p className="text-center text-[13px] text-[#8b90a0]">
            Pas encore de compte ?{' '}
            <a href="/login" className="text-[#3a5bc7] font-medium hover:underline">
              Commencer l&apos;essai
            </a>
          </p>
        </div>

        {/* Footer links */}
        <div className="absolute bottom-12 flex items-center gap-3 font-[var(--font-mono)] text-[10px] uppercase tracking-widest text-[#8b90a0]">
          <a href="/legal/privacy" className="hover:text-[#1a1f36] transition-colors">Confidentialité</a>
          <span className="w-1 h-1 rounded-full bg-[#c4c7d4]" />
          <a href="/legal/cgu" className="hover:text-[#1a1f36] transition-colors">CGU</a>
          <span className="w-1 h-1 rounded-full bg-[#c4c7d4]" />
          <a href="mailto:support@kyrra.ai" className="hover:text-[#1a1f36] transition-colors">Support</a>
        </div>

        {/* Branding footer */}
        <div className="absolute bottom-4 font-[var(--font-mono)] text-[9px] text-[#c4c7d4] tracking-[0.3em]">
          KYRRA AI SOUVERAINETÉ NUMÉRIQUE © 2026
        </div>
      </section>

    </main>
  )
}
