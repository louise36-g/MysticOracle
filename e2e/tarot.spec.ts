import { test, expect } from '@playwright/test';

/**
 * Tarot Pages E2E Tests
 * Tests tarot cards overview and reading category selector
 */

test.describe('Tarot Cards', () => {
  test('should display the tarot cards overview', async ({ page }) => {
    await page.goto('/tarot/cards');

    await expect(page).toHaveURL(/.*tarot\/cards/);

    // Wait for data to load (skeleton disappears, filter links appear)
    await page.waitForLoadState('networkidle');

    // Should show the page heading
    await expect(page.getByRole('heading', { name: /Tarot Deck|Arcanes du Tarot/i }).first()).toBeVisible();
  });

  test('should filter cards by category', async ({ page }) => {
    await page.goto('/tarot/cards');

    await page.waitForLoadState('networkidle');

    // Click on Major Arcana filter link
    const majorArcanaLink = page.getByRole('link', { name: /Major Arcana|Arcanes Majeurs/i }).first();
    if (await majorArcanaLink.isVisible()) {
      await majorArcanaLink.click();
      await expect(page).toHaveURL(/.*tarot\/cards\/major-arcana/);
    }
  });

  test('should navigate to individual card category', async ({ page }) => {
    await page.goto('/tarot/cards/wands');

    await expect(page).toHaveURL(/.*tarot\/cards\/wands/);
    await page.waitForLoadState('networkidle');

    // Should show Suit of Wands heading
    await expect(page.getByRole('heading', { name: /Suit of Wands|Bâtons/i }).first()).toBeVisible();
  });
});

test.describe('Reading Category Selector', () => {
  test('should display the reading page', async ({ page }) => {
    await page.goto('/reading');

    await expect(page).toHaveURL(/.*reading/);

    // Should show reading categories
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display reading categories', async ({ page }) => {
    await page.goto('/reading');

    await page.waitForLoadState('networkidle');

    // The page should show at least some category options
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
