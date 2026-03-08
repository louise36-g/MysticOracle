import { test, expect } from '@playwright/test';

/**
 * Info Pages E2E Tests
 * Tests FAQ, About, How Credits Work, and Contact pages
 */

test.describe('FAQ Page', () => {
  test('should display the FAQ page', async ({ page }) => {
    await page.goto('/faq');

    await expect(page).toHaveURL(/.*faq/);

    // Should show FAQ heading
    await expect(page.getByText(/Frequently Asked Questions|Questions fréquentes/i).first()).toBeVisible();
  });

  test('should display FAQ sections', async ({ page }) => {
    await page.goto('/faq');

    await page.waitForLoadState('networkidle');

    // Should have Getting Started section
    await expect(page.getByText(/Getting Started|Pour commencer/i).first()).toBeVisible();

    // Should have Credits section
    await expect(page.getByText(/Credits|Crédits/i).first()).toBeVisible();
  });

  test('should expand FAQ accordion items', async ({ page }) => {
    await page.goto('/faq');

    await page.waitForLoadState('networkidle');

    // Click on first question to expand it
    const firstQuestion = page.getByText(/What is CelestiArcana/i).first();
    if (await firstQuestion.isVisible()) {
      await firstQuestion.click();

      // Answer should become visible
      await expect(page.getByText(/AI-powered tarot/i).first()).toBeVisible();
    }
  });
});

test.describe('About Page', () => {
  test('should display the about page', async ({ page }) => {
    await page.goto('/about');

    await expect(page).toHaveURL(/.*about/);

    // Should show About heading
    await expect(page.getByText(/About Me|À propos/i).first()).toBeVisible();
  });

  test('should display content sections', async ({ page }) => {
    await page.goto('/about');

    await page.waitForLoadState('networkidle');

    // Should have tarot-related content
    await expect(page.getByText(/Tarot/i).first()).toBeVisible();
  });
});

test.describe('How Credits Work', () => {
  test('should display the credits info page', async ({ page }) => {
    await page.goto('/how-credits-work');

    await expect(page).toHaveURL(/.*how-credits-work/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display spread pricing', async ({ page }) => {
    await page.goto('/how-credits-work');

    await page.waitForLoadState('networkidle');

    // Should mention credits
    await expect(page.getByText(/credit/i).first()).toBeVisible();
  });
});

test.describe('Contact Page', () => {
  test('should display the contact page', async ({ page }) => {
    await page.goto('/contact');

    await expect(page).toHaveURL(/.*contact/);

    // Should show contact form heading
    await expect(page.getByText(/Get in Touch|Contactez-nous/i).first()).toBeVisible();
  });

  test('should display the contact form', async ({ page }) => {
    await page.goto('/contact');

    await page.waitForLoadState('networkidle');

    // Should have form fields
    await expect(page.locator('input[type="text"], input[placeholder*="name" i]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/contact');

    await page.waitForLoadState('networkidle');

    // Dismiss cookie consent if it's blocking
    const cookieBanner = page.locator('[class*="fixed"][class*="bottom"]').filter({ hasText: /cookie/i });
    if (await cookieBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      const acceptBtn = cookieBanner.getByRole('button').first();
      if (await acceptBtn.isVisible()) await acceptBtn.click();
    }

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /Send|Envoyer/i });
    if (await submitButton.isVisible()) {
      await submitButton.click({ force: true });

      // Form should not submit — HTML5 validation or custom validation should show
      // We stay on the same page
      await expect(page).toHaveURL(/.*contact/);
    }
  });
});
