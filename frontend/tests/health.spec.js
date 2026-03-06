import { test, expect } from '@playwright/test';

test('minimal health check', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await expect(page).toHaveTitle(/MyTripBudget/i, { timeout: 10000 });
});
