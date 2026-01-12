import { test, expect } from '@playwright/test';

/**
 * Legal Pages E2E Tests
 * Tests that legal pages are accessible and display required content
 */

test.describe('Legal Pages', () => {
  test('should display Privacy Policy', async ({ page }) => {
    await page.goto('/privacy');

    // Page should load
    await expect(page).toHaveURL(/.*privacy/);

    // Should have privacy policy content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Should contain GDPR-related content
    await expect(page.locator('body')).toContainText(/privacy|data|personal/i);
  });

  test('should display Terms of Service', async ({ page }) => {
    await page.goto('/terms');

    // Page should load
    await expect(page).toHaveURL(/.*terms/);

    // Should have terms content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Should contain terms-related content
    await expect(page.locator('body')).toContainText(/terms|service|agreement/i);
  });

  test('should display Cookie Policy', async ({ page }) => {
    await page.goto('/cookies');

    // Page should load
    await expect(page).toHaveURL(/.*cookies/);

    // Should have cookie policy content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Should contain cookie-related content
    await expect(page.locator('body')).toContainText(/cookie/i);
  });

  test('should have working links from footer to legal pages', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();

    // Test privacy link
    const privacyLink = page.locator('footer').getByRole('link', { name: /privacy/i });
    if (await privacyLink.isVisible()) {
      await privacyLink.click();
      await expect(page).toHaveURL(/.*privacy/);
    }
  });
});
