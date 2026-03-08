import { test, expect } from '@playwright/test';

/**
 * Horoscope Page E2E Tests
 * Tests zodiac sign selection and horoscope display
 */

test.describe('Horoscope', () => {
  test('should display the horoscope page', async ({ page }) => {
    await page.goto('/horoscopes');

    await expect(page).toHaveURL(/.*horoscopes/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display all 12 zodiac signs', async ({ page }) => {
    await page.goto('/horoscopes');

    await page.waitForLoadState('networkidle');

    // Check for zodiac sign symbols (these are consistent across EN/FR)
    const zodiacSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

    for (const symbol of zodiacSymbols) {
      await expect(page.getByText(symbol).first()).toBeVisible();
    }
  });

  test('should allow selecting a zodiac sign', async ({ page }) => {
    await page.goto('/horoscopes');

    await page.waitForLoadState('networkidle');

    // Click on Aries (first zodiac sign)
    const ariesButton = page.getByText('♈').first();
    if (await ariesButton.isVisible()) {
      await ariesButton.click();

      // After clicking, the sign name should be visible (either English or French)
      await expect(page.getByText(/Aries|Bélier/i).first()).toBeVisible();
    }
  });
});
