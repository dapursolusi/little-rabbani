import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/');

    // Unauthenticated users land on the sign-in page
    await expect(page).toHaveTitle(/Masuk|Little Rabbani/);
    await expect(page.locator('h1, h2, [class*=logo]')).toContainText(
      /Little Rabbani/i,
      { timeout: 15_000 }
    );
  });

  test('shows sign-in with Google option', async ({ page }) => {
    await page.goto('/');

    // Google OAuth sign-in button is visible
    const signInButton = page.getByRole('button', {
      name: /masuk dengan google/i,
    });
    await expect(signInButton).toBeVisible({ timeout: 15_000 });
  });
});
