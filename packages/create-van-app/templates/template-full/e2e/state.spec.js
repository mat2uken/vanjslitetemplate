import { expect, test } from "@playwright/test";

test.describe("Global State Management & Dynamic Routing (Safari & Mobile Safari)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/state");
  });

  test("displays state management page and initial guest status", async ({ page }) => {
    await expect(page.locator("h2")).toContainText("状態管理 & 動的クライアントサイドルーティング");
    await expect(page.locator(".c-card:has-text('1. グローバルストア')")).toBeVisible();
    await expect(page.locator("text=未ログイン (Guest)")).toBeVisible();
  });

  test("login action updates global store, reflects in App Header, and persists across page navigation", async ({
    page,
  }) => {
    // Click login button (Taro)
    const loginBtn = page.locator('button:has-text("ログインする (Taro)")');
    await loginBtn.click();

    // Verify authenticated badge in page
    await expect(page.locator("text=ログイン中 (Authenticated)")).toBeVisible();
    await expect(page.locator('.l-box:has-text("現在のユーザー: Taro")')).toBeVisible();

    // Verify header reactive badge updated
    const headerBadge = page.locator('.c-header span:has-text("Taro")');
    await expect(headerBadge).toBeVisible();

    // Navigate away to another page (Layout page)
    await page.click('a[href="#/layout"]');
    await expect(page).toHaveURL(/#\/layout/);

    // Verify user remains logged in in App Header on different page
    await expect(headerBadge).toBeVisible();

    // Navigate back to State page
    await page.click('a[href="#/state"]');
    await expect(page).toHaveURL(/#\/state/);

    // State persisted across navigation!
    await expect(page.locator("text=ログイン中 (Authenticated)")).toBeVisible();

    // Logout
    await page.click('button:has-text("ログアウト")');
    await expect(page.locator("text=未ログイン (Guest)")).toBeVisible();
    await expect(headerBadge).not.toBeVisible();
  });

  test("dynamic route parameters and query strings are extracted and updated interactively", async ({
    page,
  }) => {
    // Navigate to user 100 with activity tab
    await page.click('a:has-text("ユーザー 100 (アクティビティ)")');
    await expect(page).toHaveURL(/#\/state\/users\/100\?tab=activity&sort=desc/);

    // Check inspection box displays parsed values
    const inspectionBox = page.locator(".l-box:has-text('解析された params')");
    await expect(inspectionBox).toContainText('"id":"100"');
    await expect(inspectionBox).toContainText('"tab":"activity"');
    await expect(inspectionBox).toContainText('"sort":"desc"');

    // Click interactive button to switch query to overview
    await page.click('button:has-text("概要タブへ切替")');
    await expect(page).toHaveURL(/#\/state\/users\/100\?tab=overview/);
    await expect(inspectionBox).toContainText('"tab":"overview"');

    // Click link to another user (User 42)
    await page.click('a:has-text("ユーザー 42 (設定)")');
    await expect(page).toHaveURL(/#\/state\/users\/42\?tab=settings/);
    await expect(inspectionBox).toContainText('"id":"42"');
    await expect(inspectionBox).toContainText('"tab":"settings"');
  });
});
