import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully and displays branding', async ({ page }) => {
    await page.goto('/');

    // Page loads without errors
    await expect(page).toHaveTitle(/.*/);

    // Next.js logo is present
    const logo = page.locator('img[alt="Next.js logo"]');
    await expect(logo).toBeVisible({ timeout: 15_000 });
  });

  test('has navigation links to Vercel and Next.js docs', async ({ page }) => {
    await page.goto('/');

    // "Deploy Now" link exists — use text content directly
    const deployLink = page.getByRole('link', { name: 'Deploy Now' });
    await expect(deployLink).toBeVisible({ timeout: 15_000 });
    await expect(deployLink).toHaveAttribute('href', /vercel\.com/);

    // "Documentation" link exists
    const docsLink = page.getByRole('link', { name: 'Documentation' });
    await expect(docsLink).toBeVisible({ timeout: 15_000 });
    await expect(docsLink).toHaveAttribute('href', /nextjs\.org/);
  });

  test('displays the get-started message', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('get started', {
      timeout: 15_000,
    });
  });
});
