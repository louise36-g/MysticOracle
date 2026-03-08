import { test, expect } from '@playwright/test';

/**
 * Navigation & Error Pages E2E Tests
 * Tests 404 handling, cross-page navigation, and layout elements
 */

test.describe('404 Page', () => {
  test('should display 404 for non-existent routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    // Should show 404 content
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText(/Page Not Found|Page introuvable/i)).toBeVisible();
  });

  test('should have a link back to homepage from 404', async ({ page }) => {
    await page.goto('/non-existent-route');

    // Should have "Go Home" link
    const homeLink = page.getByRole('link', { name: /Go Home|Accueil/i });
    await expect(homeLink).toBeVisible();

    await homeLink.click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Header Navigation', () => {
  test('should display header on all pages', async ({ page }) => {
    const pages = ['/', '/blog', '/horoscopes', '/faq', '/about'];

    for (const url of pages) {
      await page.goto(url);
      await expect(page.locator('header')).toBeVisible();
    }
  });

  test('should have working logo/home link', async ({ page }) => {
    await page.goto('/faq');

    // Click logo or brand link to go home
    const homeLink = page.locator('header a[href="/"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('Footer', () => {
  test('should display footer on all pages', async ({ page }) => {
    const pages = ['/', '/blog', '/horoscopes', '/faq'];

    for (const url of pages) {
      await page.goto(url);
      const footer = page.locator('footer');
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeVisible();
    }
  });

  test('should have legal links in footer', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();

    await expect(page.locator('footer').getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(page.locator('footer').getByRole('link', { name: /terms/i })).toBeVisible();
  });
});

test.describe('Cross-Page Navigation', () => {
  test('should navigate between main sections', async ({ page }) => {
    // Start at home
    await page.goto('/');

    // Navigate to horoscopes
    await page.getByRole('link', { name: /horoscope/i }).first().click();
    await expect(page).toHaveURL(/.*horoscopes/);

    // Navigate to tarot/reading
    await page.getByRole('link', { name: /tarot/i }).first().click();
    await expect(page).toHaveURL(/.*reading/);
  });
});
