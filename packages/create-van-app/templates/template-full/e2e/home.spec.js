import { expect, test } from "@playwright/test";

test.describe("Home Page (Safari & Mobile Safari)", () => {
  test("displays application shell and navigation bar", async ({ page }) => {
    await page.goto("/");

    // Verify Title and Header
    await expect(page).toHaveTitle(/VanJS Light WebApp/);
    await expect(page.locator(".c-header-title")).toContainText("VanJS Light WebApp");
    await expect(page.locator(".c-header-badge")).toContainText("PoC v1.0");

    // Verify Navigation Bar items
    const navItems = page.locator(".c-nav-item");
    await expect(navItems).toHaveCount(4);
    await expect(navItems.nth(0)).toHaveText("概要 (Home)");
    await expect(navItems.nth(1)).toHaveText("UIコンポーネント");
    await expect(navItems.nth(2)).toHaveText("CSSレイアウト");
    await expect(navItems.nth(3)).toHaveText("ベンチマーク");

    // Active state for Home
    await expect(navItems.nth(0)).toHaveClass(/is-active/);
  });

  test("renders architecture layer metrics and comparison table", async ({ page }) => {
    await page.goto("/");

    // Metrics grid
    await expect(page.locator(".c-metric-box")).toHaveCount(4);
    await expect(page.locator(".c-container")).toContainText("採用構成: モデルC改");

    // Layer Architecture Table
    const table = page.locator(".c-table");
    await expect(table).toBeVisible();
    await expect(table).toContainText("View Layer");
    await expect(table).toContainText("Core Runtime");
    await expect(table).toContainText("Position Engine");
  });

  test("navigates to pages via menu buttons and nav bar", async ({ page }) => {
    await page.goto("/");

    // Click "UIコンポーネント検証" button
    await page.click('button:has-text("UIコンポーネント検証")');
    await expect(page).toHaveURL(/#\/components/);
    await expect(page.locator("h2")).toContainText("UIコンポーネント & A11y 検証");

    // Click back to "概要 (Home)" from nav
    await page.click('.c-nav-item:has-text("概要 (Home)")');
    await expect(page).toHaveURL(/#\//);
    await expect(page.locator("h2")).toContainText("超軽量Web App (SPA) PoC");
  });
});
