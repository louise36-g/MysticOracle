import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests
 * Tests core homepage functionality and navigation
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle(/CelestiArcana/i);
  });

  test('should display the main navigation', async ({ page }) => {
    // Check header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check for main navigation links
    await expect(page.getByRole('link', { name: /tarot/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /horoscope/i })).toBeVisible();
  });

  test('should display the footer', async ({ page }) => {
    // Scroll to footer
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();

    // Check for legal links
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /terms/i })).toBeVisible();
  });

  test('should navigate to Tarot page', async ({ page }) => {
    await page.getByRole('link', { name: /tarot/i }).first().click();
    await expect(page).toHaveURL(/.*tarot/);
  });

  test('should navigate to Horoscope page', async ({ page }) => {
    await page.getByRole('link', { name: /horoscope/i }).first().click();
    await expect(page).toHaveURL(/.*horoscope/);
  });
});
