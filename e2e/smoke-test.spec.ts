import { test, expect } from '@playwright/test'

/**
 * Kyrra Smoke Test — Story B6.4
 *
 * Covers all PUBLIC pages. Authenticated pages (dashboard, settings,
 * connect-gmail) require a Google OAuth session and are NOT covered here.
 * See README.md for details.
 */

test.describe('Smoke Test — Public Pages', () => {
  test('Login page renders correctly', async ({ page }) => {
    await page.goto('/login')

    // Title "Kyrra"
    await expect(page.locator('h1')).toContainText('Kyrra')

    // Tagline
    await expect(page.getByText('Faites taire le bruit')).toBeVisible()

    // Google sign-in button
    await expect(
      page.getByRole('button', { name: /connecter.*google/i })
    ).toBeVisible()
  })

  test('Token-expired page renders correctly', async ({ page }) => {
    await page.goto('/token-expired')

    // Expiry message
    await expect(
      page.getByText('Ce lien a expiré ou a déjà été utilisé')
    ).toBeVisible()

    // Dashboard CTA
    await expect(
      page.getByRole('link', { name: /tableau de bord/i })
    ).toBeVisible()
  })

  test('CGU (legal/cgu) page renders correctly', async ({ page }) => {
    await page.goto('/legal/cgu')

    // Page heading
    await expect(page.locator('h1')).toContainText(
      "Conditions Generales d'Utilisation"
    )

    // At least one section heading
    await expect(page.getByText('1. Objet')).toBeVisible()
  })

  test('Privacy (legal/privacy) page renders correctly', async ({ page }) => {
    await page.goto('/legal/privacy')

    // Page heading
    await expect(page.locator('h1')).toContainText(
      'Politique de Confidentialite'
    )

    // At least one section heading
    await expect(
      page.getByText('1. Responsable du traitement')
    ).toBeVisible()
  })
})
