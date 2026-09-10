import { expect, test } from "@playwright/test";

test.describe("CSS Layout & Stack (Safari & Mobile Safari)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/layout");
  });

  test("renders @nkzw/stack layout components correctly", async ({ page }) => {
    const stackCard = page.locator('.c-card:has-text("1. @nkzw/stack 互換")');
    await expect(stackCard).toBeVisible();

    // Verify HStack items rendered side-by-side
    const hstackItem1 = page.locator("text=HStack Item 1");
    const hstackItem2 = page.locator("text=HStack Item 2");
    await expect(hstackItem1).toBeVisible();
    await expect(hstackItem2).toBeVisible();

    // Verify justify="between" HStack
    await expect(page.locator('text=HStack with justify="between"')).toBeVisible();
    await expect(page.locator("text=Flexbox Safe")).toBeVisible();
  });

  test("renders nested flexbox grid without display:grid", async ({ page }) => {
    const gridCard = page.locator('.c-card:has-text("2. CSS Grid 代替")');
    await expect(gridCard).toBeVisible();

    const metricBoxes = page.locator(".c-metric-box");
    await expect(metricBoxes).toHaveCount(4);
    await expect(metricBoxes.nth(0)).toContainText("カード 1");
  });

  test("displays strict CSS rule check table with all passed badges", async ({ page }) => {
    const table = page.locator(".c-table");
    await expect(table).toBeVisible();

    const badges = table.locator(".c-badge-success");
    await expect(badges).toHaveCount(5); // gap, Grid, CSS Variables, backdrop-filter, ::before/::after
  });
});
