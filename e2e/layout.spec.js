import { expect, test } from "@playwright/test";

test.describe("CSS Layout & Every Layout Primitives (Safari & Mobile Safari)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/layout");
  });

  test("renders Every Layout The Box and Invert boxes", async ({ page }) => {
    const boxCard = page.locator('.c-card:has-text("1. The Box")');
    await expect(boxCard).toBeVisible();

    const standardBox = page.locator('.l-box:has-text("Standard Box")');
    const invertBox = page.locator('.l-box--invert:has-text("Invert Box")');
    await expect(standardBox).toBeVisible();
    await expect(invertBox).toBeVisible();
  });

  test("renders The Stack and The Cluster layout components correctly", async ({ page }) => {
    const stackCard = page.locator('.c-card:has-text("2. The Stack")');
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

  test("renders The Switcher responsive grid without media queries", async ({ page }) => {
    const switcherCard = page.locator('.c-card:has-text("3. The Switcher")');
    await expect(switcherCard).toBeVisible();

    const metricBoxes = page.locator(".c-metric-box");
    await expect(metricBoxes).toHaveCount(4);
    await expect(metricBoxes.nth(0)).toContainText("カード 1");
  });

  test("displays strict CSS & Every Layout rule check table with all passed badges", async ({
    page,
  }) => {
    const table = page.locator(".c-table");
    await expect(table).toBeVisible();

    const badges = table.locator(".c-badge-success");
    await expect(badges).toHaveCount(5); // The Stack, The Switcher, The Center, The Imposter, The Box
  });
});
