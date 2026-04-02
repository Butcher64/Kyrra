import { test, expect } from '@playwright/test'

/**
 * Kyrra Smoke Test — Story B6.4
 *
 * PUBLIC pages: automated Playwright tests.
 * AUTHENTICATED pages: require Google OAuth — see README for manual test plan.
 */

test.describe('Smoke Test — Landing Page', () => {
  test('Hero section renders with headline and CTAs', async ({ page }) => {
    await page.goto('/')

    // Hero headline
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Faites taire le bruit')

    // Primary CTA
    await expect(page.getByRole('link', { name: /essai gratuit/i })).toBeVisible()

    // Secondary CTA
    await expect(page.getByRole('link', { name: /comment ça marche/i })).toBeVisible()
  })

  test('Navbar has all navigation links', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Solutions' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sécurité' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tarifs' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Connexion' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Démonstration' })).toBeVisible()
  })

  test('Pricing section shows 3 tiers with correct prices', async ({ page }) => {
    await page.goto('/')

    // Scroll to pricing
    await page.locator('[data-section="pricing"]').scrollIntoViewIfNeeded()

    await expect(page.getByRole('heading', { name: 'Gratuit' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible()
  })

  test('Footer has legal links', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Confidentialité' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'CGU' }).first()).toBeVisible()
  })
})

test.describe('Smoke Test — Login Page', () => {
  test('Login page renders with Google OAuth button', async ({ page }) => {
    await page.goto('/login')

    // Title
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible()

    // Google sign-in button
    await expect(
      page.getByRole('button', { name: /connecter.*google/i })
    ).toBeVisible()

    // Footer
    await expect(page.getByText('KYRRA AI SOUVERAINETÉ NUMÉRIQUE')).toBeVisible()
  })

  test('Login page shows uninstall success banner', async ({ page }) => {
    await page.goto('/login?uninstalled=true')

    await expect(
      page.getByText(/compte.*supprimé.*désinstallé/i)
    ).toBeVisible()
  })

  test('Unauthenticated /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Smoke Test — Legal Pages', () => {
  test('CGU page renders', async ({ page }) => {
    await page.goto('/legal/cgu')

    await expect(page.locator('h1')).toContainText(
      "Conditions Generales d'Utilisation"
    )
    await expect(page.getByText('1. Objet')).toBeVisible()
  })

  test('Privacy page renders', async ({ page }) => {
    await page.goto('/legal/privacy')

    await expect(page.locator('h1')).toContainText(
      'Politique de Confidentialite'
    )
    await expect(
      page.getByText('1. Responsable du traitement')
    ).toBeVisible()
  })
})

test.describe('Smoke Test — Error Pages', () => {
  test('Token-expired page renders', async ({ page }) => {
    await page.goto('/token-expired')

    await expect(
      page.getByText(/lien.*expiré/i)
    ).toBeVisible()
  })
})

/**
 * AUTHENTICATED FLOW — Manual Test Plan
 *
 * Prerequisites:
 * - Test Gmail account (kyrra.test@gmail.com or similar)
 * - Dev server running: pnpm dev (localhost:3000)
 * - Supabase running (local or cloud)
 * - Worker running: cd apps/worker && pnpm dev
 * - Migrations 001-026 applied
 *
 * ── ONBOARDING FLOW ──
 *
 * 1. Navigate to /login
 * 2. Click "Se connecter avec Google"
 * 3. Authenticate with test Gmail account
 * 4. Verify redirect to /connect-gmail (RGPD consent)
 * 5. Check "J'autorise Kyrra à classifier mes emails" checkbox
 * 6. Click "Connecter Gmail →"
 * 7. Authorize Gmail permissions in Google OAuth popup
 * 8. Verify redirect to /onboarding-progress (whitelist scan)
 * 9. Wait for whitelist scan completion
 * 10. Verify redirect to /configure-profile
 * 11. Fill profile: role, sector, company description
 * 12. Add prospection types to avoid (chips)
 * 13. Click "Continuer"
 * 14. Verify redirect to /configure-labels
 * 15. Check 7 default labels are displayed as cards
 * 16. Optionally add/remove a custom label
 * 17. Click "Valider mes labels"
 * 18. Verify redirect to /scan-progress
 * 19. Watch emails appear one by one (sender, subject, label with color)
 * 20. Wait for scan completion (counter reaches total)
 * 21. Verify redirect to /dashboard
 *
 * ── DASHBOARD FLOW ──
 *
 * 22. Check dashboard shows stats: trust score, filtered count, blocked count
 * 23. Verify loading skeleton appears when navigating between pages
 * 24. Navigate to /emails — verify dynamic label tabs and badge colors
 * 25. Navigate to /labels — verify label cards with descriptions
 * 26. Navigate to /settings
 * 27. Change exposure mode (Strict → Normal)
 * 28. Verify toast confirmation
 *
 * ── CLASSIFICATION FLOW ──
 *
 * 29. Send a test prospection email to test Gmail (from a non-whitelisted sender)
 * 30. Wait 2 minutes for classification
 * 31. Verify email has Kyrra label in Gmail (Prospection or Spam)
 * 32. Check /dashboard shows new blocked count
 * 33. Check /emails shows the email with correct label badge
 *
 * ── UNINSTALL FLOW ──
 *
 * 34. Navigate to /settings → "Supprimer mon compte"
 * 35. Type "SUPPRIMER" and confirm
 * 36. Verify redirect to /login?uninstalled=true
 * 37. Verify success banner displayed
 * 38. Verify Gmail Kyrra labels removed
 */
