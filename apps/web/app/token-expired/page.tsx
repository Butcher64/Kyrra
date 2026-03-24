import { Button } from '@/components/ui/button'

/**
 * Token expired page — MI-10 fallback
 * Neutral message + "Ouvrir le dashboard" CTA
 * Shown when recap token is expired (>7 days) or already used
 */
export default function TokenExpiredPage() {
  return (
    <main className="flex justify-center items-center min-h-screen px-6">
      <div className="w-full max-w-[320px] text-center flex flex-col items-center gap-4">
        <p className="text-[15px] text-(--muted-foreground)">
          Ce lien a expiré ou a déjà été utilisé.
        </p>
        <p className="text-[12px] text-(--muted-foreground)">
          Reclassifiez directement depuis le tableau de bord.
        </p>
        <Button asChild className="mt-2">
          <a href="/dashboard">Ouvrir le tableau de bord &rarr;</a>
        </Button>
      </div>
    </main>
  )
}
