import { test, expect } from '@playwright/test';

test.describe('Multi-User Trip Budgeting', () => {
    // Generate a very unique prefix for this entire test run
    const runId = Math.random().toString(36).substring(2, 8) + Date.now().toString().slice(-4);

    const userA = {
        email: `usera_${runId}@example.com`,
        password: 'Password123!',
        name: `Alpha ${runId}`
    };
    const userB = {
        email: `userb_${runId}@example.com`,
        password: 'Password123!',
        name: `Beta ${runId}`
    };
    const groupName = `E2E Trip ${runId}`;

    test('should handle full multi-user flow: group, expenses, and settlement', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();

        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        console.log(`Starting E2E run with ID: ${runId}`);

        // 1. Register both users
        for (const [page, user] of [[pageA, userA], [pageB, userB]]) {
            await page.goto('/register');
            await page.waitForLoadState('load');

            await page.getByPlaceholder('John Doe').fill(user.name);
            await page.getByPlaceholder('name@example.com').fill(user.email);
            await page.getByPlaceholder('••••••••').fill(user.password);

            await page.getByRole('button', { name: 'Sign Up' }).click();
            await expect(page).toHaveURL(/.*dashboard/, { timeout: 20000 });
        }

        // 2. User A creates group
        await pageA.getByPlaceholder('Enter new group name...').fill(groupName);
        await pageA.getByPlaceholder('Enter group description (optional)...').fill('Testing multi-user flow');
        await pageA.getByRole('button', { name: 'Create Group' }).click();

        const groupCardLink = pageA.locator('.group-card').filter({ hasText: groupName });
        await expect(groupCardLink).toBeVisible({ timeout: 15000 });

        // 3. User A enters the group
        const groupLink = pageA.getByRole('link', { name: groupName });
        await expect(groupLink).toBeVisible({ timeout: 15000 });
        await groupLink.click({ force: true });

        await pageA.waitForURL(/\/groups\/\d+/, { timeout: 30000 });
        await pageA.waitForLoadState('networkidle');

        // Wait for React hydration
        await pageA.waitForTimeout(2000);

        // Heartbeat: "Members" text should be visible somewhere
        await expect(pageA.getByRole('heading', { name: 'Members' })).toBeVisible({ timeout: 15000 });
        await pageA.screenshot({ path: `debug_group_A_final_${runId}.png` });

        // 4. User A adds User B to group
        const memberEmailInput = pageA.getByPlaceholder('Enter new member email...');
        await memberEmailInput.fill(userB.email);
        await pageA.getByRole('button', { name: 'Add Member' }).click();
        await expect(pageA.locator('.members-section')).toContainText(userB.name, { timeout: 15000 });

        // 5. User A adds 1000 INR expense
        await pageA.getByPlaceholder('Description', { exact: true }).fill('Flights');
        await pageA.getByPlaceholder('Amount', { exact: true }).fill('1000');

        // Specific payer select
        const payerSelect = pageA.locator('select').filter({ has: pageA.locator('option:text("Select Payer")') });
        await payerSelect.selectOption({ label: userA.name });

        await pageA.getByRole('button', { name: 'Add Expense' }).click();
        await expect(pageA.locator('.expense-item')).toContainText('Flights', { timeout: 15000 });

        // 6. User B enters the group and checks balance
        await pageB.reload();
        await pageB.waitForLoadState('networkidle');
        await pageB.locator('.group-card').filter({ hasText: groupName }).click();
        await pageB.waitForURL(/\/groups\/\d+/);
        await pageB.waitForLoadState('networkidle');

        await expect(pageB.locator('.expense-item')).toContainText('Flights', { timeout: 15000 });
        // User B owes 500 (Balance -500)
        await expect(pageB.locator('.members-section')).toContainText('-₹500.00', { timeout: 15000 });

        // 7. User B adds 200 INR expense
        await pageB.getByPlaceholder('Description', { exact: true }).fill('Dinner');
        await pageB.getByPlaceholder('Amount', { exact: true }).fill('200');

        const payerSelectB = pageB.locator('select').filter({ has: pageB.locator('option:text("Select Payer")') });
        await payerSelectB.selectOption({ label: userB.name });

        await pageB.getByRole('button', { name: 'Add Expense' }).click();
        await expect(pageB.locator('.expense-item')).toContainText('Dinner', { timeout: 15000 });

        // 8. Verify Net Balances
        // Net: User B owes User A 400
        await expect(pageB.locator('.members-section')).toContainText('-₹400.00', { timeout: 20000 });

        await pageA.reload();
        await pageA.waitForLoadState('networkidle');
        await expect(pageA.locator('.members-section')).toContainText('+₹400.00', { timeout: 20000 });

        // 9. User B settles up
        await pageB.getByRole('button', { name: 'Settle Up' }).click();

        const payeeSelect = pageB.locator('select').filter({ has: pageB.locator('option:text("Who did you pay?")') });
        await payeeSelect.selectOption({ label: userA.name });

        await pageB.getByPlaceholder('Amount', { exact: true }).fill('400');
        await pageB.getByRole('button', { name: 'Save Settlement' }).click();

        // 10. Final check
        await expect(pageB.locator('.members-section')).toContainText('Settled', { timeout: 15000 });
        await pageA.reload();
        await pageA.waitForLoadState('networkidle');
        await expect(pageA.locator('.members-section')).toContainText('Settled', { timeout: 15000 });

        await contextA.close();
        await contextB.close();
    });
});
