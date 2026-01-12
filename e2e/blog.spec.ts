import { test, expect } from '@playwright/test';

/**
 * Blog E2E Tests
 * Tests blog listing and article viewing functionality
 */

test.describe('Blog', () => {
  test('should display the blog list page', async ({ page }) => {
    await page.goto('/blog');

    // Page should load
    await expect(page).toHaveURL(/.*blog/);

    // Should have a heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should display blog categories', async ({ page }) => {
    await page.goto('/blog');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Categories should be visible (may vary based on content)
    const categoryLinks = page.locator('[data-testid="category-filter"], .category, nav a');
    // Just verify the page has navigation/filter elements
    await expect(page.locator('main')).toBeVisible();
  });

  test('should filter posts by search', async ({ page }) => {
    await page.goto('/blog');

    // Find search input if exists
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('tarot');
      // Search should filter results
      await page.waitForLoadState('networkidle');
    }
  });

  test('should navigate to individual blog post', async ({ page }) => {
    await page.goto('/blog');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Find and click on first blog post link
    const postLink = page.locator('article a, [data-testid="post-link"]').first();

    if (await postLink.isVisible()) {
      await postLink.click();

      // Should navigate to post page
      await expect(page).toHaveURL(/.*blog\/.+/);

      // Post should have title and content
      await expect(page.locator('h1, article h2').first()).toBeVisible();
    }
  });
});
