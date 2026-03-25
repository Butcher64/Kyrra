import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GoogleIcon } from '@/components/icons/GoogleIcon'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen w-full overflow-hidden bg-[#131318] text-[#e4e1e9] antialiased">

      {/* ── LEFT PANEL: Editorial Branding (50%) — desktop only ── */}
      <section className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700">

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Ambient glow */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'rgba(34,211,238,0.20)', filter: 'blur(120px)' }}
        />

        {/* Brand identity */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
            {/* Shield icon */}
            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2L3 6.5V12c0 4.97 3.76 9.63 9 10.93C17.24 21.63 21 16.97 21 12V6.5L12 2z" />
            </svg>
          </div>
          <span className="text-3xl font-extrabold tracking-tighter text-white font-outfit">Kyrra</span>
        </div>

        {/* Testimonial quote */}
        <div className="relative z-10 max-w-lg">
          <div className="mb-6 h-px w-24 bg-white/30" />
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white font-outfit leading-tight tracking-tight mb-8">
            &ldquo;312 distractions supprimées cette semaine.&rdquo;
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 p-0.5 overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
              {/* Placeholder avatar */}
              <svg className="w-7 h-7 text-white/60" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Marc</p>
              <p className="text-white/60 font-mono text-xs uppercase tracking-widest">CEO, Innovatech</p>
            </div>
          </div>
        </div>

        {/* Footer metadata */}
        <div className="relative z-10 flex justify-between items-end">
          <div className="font-mono text-xs text-white/50 space-y-1">
            <p>PROTOCOLE SOUVERAIN V4.2</p>
            <p>CHIFFREMENT DE BOUT EN BOUT</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-cyan-400"
              style={{ boxShadow: '0 0 10px rgba(34,211,238,0.8)' }}
            />
            <span className="text-[10px] font-mono text-white/80 uppercase tracking-widest">
              Système Opérationnel
            </span>
          </div>
        </div>
      </section>

      {/* ── RIGHT PANEL: Login Form (50%) ── */}
      <section className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 relative bg-[#0A0A0F]">

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-12 flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tighter text-[#e4e1e9] font-outfit">Kyrra</span>
        </div>

        {/* Login container */}
        <div className="w-full max-w-[380px] space-y-10">

          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-[#e4e1e9] font-outfit">
              Bienvenue
            </h1>
            <p className="text-[#c2c6d6]">
              Accédez à votre espace sécurisé Kyrra AI.
            </p>
          </div>

          {/* Google Auth — primary CTA */}
          <form action="/auth/callback" method="GET">
            <input type="hidden" name="next" value="/connect-gmail" />
            <button
              type="submit"
              className="w-full group flex items-center justify-center gap-4 py-3.5 px-6 rounded-xl bg-[#2a292f] hover:bg-[#35343a] transition-all duration-300 border border-white/[0.08] shadow-xl cursor-pointer"
            >
              <GoogleIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium tracking-wide text-[#e4e1e9]">
                Se connecter avec Google
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full h-px bg-white/[0.12]" />
            <span className="absolute px-4 bg-[#0A0A0F] text-[10px] font-mono uppercase tracking-[0.2em] text-[#8c909f]">
              ou via email
            </span>
          </div>

          {/* Email / password fields — visual only, not wired */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block font-mono text-[10px] uppercase tracking-widest text-[#c2c6d6] ml-1">
                Adresse Email
              </label>
              <input
                type="email"
                placeholder="nom@entreprise.com"
                disabled
                className="w-full bg-[#1b1b20] border border-white/[0.07] rounded-xl px-4 py-3.5 text-[#e4e1e9] placeholder:text-[#8c909f]/40 outline-none opacity-50 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block font-mono text-[10px] uppercase tracking-widest text-[#c2c6d6]">
                  Mot de passe
                </label>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#adc6ff]/50">
                  Oublié ?
                </span>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                disabled
                className="w-full bg-[#1b1b20] border border-white/[0.07] rounded-xl px-4 py-3.5 text-[#e4e1e9] placeholder:text-[#8c909f]/40 outline-none opacity-50 cursor-not-allowed"
              />
            </div>
            <button
              type="button"
              disabled
              className="w-full py-4 rounded-xl font-semibold text-white opacity-30 cursor-not-allowed"
              style={{ background: 'linear-gradient(to right, #4d8eff, #3131c0)' }}
            >
              Connexion
            </button>
          </div>

          {/* Sign-up link */}
          <p className="text-center text-sm text-[#c2c6d6]">
            Pas encore de compte ?{' '}
            <a href="#" className="text-[#adc6ff] font-medium hover:underline underline-offset-4">
              Commencer l&apos;essai
            </a>
          </p>
        </div>

        {/* Footer links */}
        <div className="absolute bottom-12 w-full max-w-[380px] flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-[#8c909f]">
          <a href="/legal/privacy" className="hover:text-[#e4e1e9] transition-colors">Confidentialité</a>
          <span className="w-1 h-1 rounded-full bg-[#424754]" />
          <a href="/legal/cgu" className="hover:text-[#e4e1e9] transition-colors">Conditions</a>
          <span className="w-1 h-1 rounded-full bg-[#424754]" />
          <a href="mailto:support@kyrra.ai" className="hover:text-[#e4e1e9] transition-colors">Support</a>
        </div>

        {/* Branding subtle footer */}
        <div className="absolute bottom-4 text-[9px] font-mono text-[#8c909f]/30 tracking-[0.3em]">
          KYRRA AI SOUVERAINETÉ NUMÉRIQUE © 2024
        </div>
      </section>

    </main>
  )
}
