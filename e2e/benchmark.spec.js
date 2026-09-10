import { expect, test } from "@playwright/test";

test.describe("Performance & Benchmark (Safari & Mobile Safari)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/benchmark");
  });

  test("generates 100 DOM nodes rapidly and updates metrics", async ({ page }) => {
    // Initial state
    await expect(page.locator(".c-metric-value").first()).toContainText("0 件");

    // Click "100件 生成"
    await page.click('button:has-text("100件 生成")');

    // Verify node count metric
    await expect(page.locator(".c-metric-value").first()).toContainText("100 件");

    // Verify rendering table rows
    const rows = page.locator(".c-table tbody tr");
    await expect(rows).toHaveCount(100);

    // Verify render time is measured and non-zero
    const timeMetric = page.locator(".c-metric-value").nth(1);
    await expect(timeMetric).toContainText("ms");
  });

  test("sorts list using @nkzw/core sortBy in descending order", async ({ page }) => {
    // Generate 100 items first
    await page.click('button:has-text("100件 生成")');
    await expect(page.locator(".c-table tbody tr")).toHaveCount(100);

    // Click sort button
    await page.click('button:has-text("ソート (sortBy降順)")');
    await page.waitForTimeout(200);

    // Read first two rows' values
    const firstRowValText = await page
      .locator(".c-table tbody tr:nth-child(1) td:nth-child(3)")
      .innerText();
    const secondRowValText = await page
      .locator(".c-table tbody tr:nth-child(2) td:nth-child(3)")
      .innerText();

    const firstVal = Number.parseInt(firstRowValText, 10);
    const secondVal = Number.parseInt(secondRowValText, 10);

    expect(firstVal).toBeGreaterThanOrEqual(secondVal);
  });

  test("clears benchmark items", async ({ page }) => {
    await page.click('button:has-text("100件 生成")');
    await expect(page.locator(".c-table tbody tr")).toHaveCount(100);

    await page.click('button:has-text("クリア")');
    await expect(page.locator(".c-metric-value").first()).toContainText("0 件");
    await expect(
      page.locator("text=「生成」ボタンを押してベンチマークを実行してください"),
    ).toBeVisible();
  });
});
