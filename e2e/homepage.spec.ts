import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully and displays Next.js branding', async ({ page }) => {
    await page.goto('/');

    // Page loads without errors
    await expect(page).toHaveTitle(/.*/);

    // Next.js logo is present
    const logo = page.locator('img[alt="Next.js logo"]');
    await expect(logo).toBeVisible();
  });

  test('has navigation links to Vercel and Next.js docs', async ({ page }) => {
    await page.goto('/');

    // "Deploy Now" link exists
    const deployLink = page.locator('a', { hasText: 'Deploy Now' });
    await expect(deployLink).toBeVisible();
    await expect(deployLink).toHaveAttribute('href', /vercel\.com/);

    // "Documentation" link exists
    const docsLink = page.locator('a', { hasText: 'Documentation' });
    await expect(docsLink).toBeVisible();
    await expect(docsLink).toHaveAttribute('href', /nextjs\.org/);
  });

  test('displays the get-started message', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('get started');
  });
});
