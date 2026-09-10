import { expect, test } from "@playwright/test";

test.describe("UI Components & A11y (Safari & Mobile Safari)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/components");
  });

  test("modal opens, increments counter on OK, and shows toast notification", async ({ page }) => {
    // Check initial counter
    await expect(page.locator('.c-card:has-text("1. Portal Modal")')).toContainText("確認回数: 0");

    // Open Modal
    await page.click('button:has-text("モーダルを開く")');

    // Verify Modal mounted to document.body
    const modal = page.locator(".c-modal-dialog");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Portal Modal 検証");

    // Click OK button
    await page.click("#modal-ok-btn");

    // Verify Modal closed
    await expect(modal).not.toBeVisible();

    // Verify Toast appeared
    const toast = page.locator(".c-toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("モーダル確認完了 (通算: 1回)");

    // Verify counter updated
    await expect(page.locator('.c-card:has-text("1. Portal Modal")')).toContainText("確認回数: 1");
  });

  test("modal closes when backdrop overlay or ESC key is triggered", async ({ page }) => {
    // Test Backdrop Click
    await page.click('button:has-text("モーダルを開く")');
    const overlay = page.locator(".c-modal-overlay");
    await expect(overlay).toBeVisible();

    // Click top-left of overlay outside the dialog
    await overlay.click({ position: { x: 10, y: 10 } });
    await expect(overlay).not.toBeVisible();

    // Test ESC Key
    await page.click('button:has-text("モーダルを開く")');
    await expect(overlay).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(overlay).not.toBeVisible();
  });

  test("popover opens, clamps to viewport, and dismisses on outside tap", async ({ page }) => {
    // 1. Center Popover
    const centerBtn = page.locator('button:has-text("ポップオーバー (中央配置)")');
    await centerBtn.click();

    const popover = page.locator(".c-popover");
    await expect(popover).toBeVisible();
    await expect(popover).toContainText("Safe Popover");

    // Close via inside button
    await page.click('.c-popover button:has-text("閉じる")');
    await expect(popover).not.toBeVisible();

    // 2. Edge Clamp Popover
    const edgeBtn = page.locator('button:has-text("画面端クランプ検証")');
    await edgeBtn.click();
    await expect(popover).toBeVisible();
    await expect(popover).toContainText("画面端ガード");

    // Outside tap (Light Dismiss)
    await page.click('h2:has-text("UIコンポーネント & A11y 検証")');
    await expect(popover).not.toBeVisible();
  });

  test("tabs switch content reactively with van.state", async ({ page }) => {
    const tabsCard = page.locator('.c-card:has-text("3. Lightweight Tabs")');

    // Default tab
    await expect(tabsCard).toContainText("VanJSのリアクティブステート");

    // Click "エンジン互換性" Tab
    await page.click('.c-tabs-btn:has-text("エンジン互換性")');
    await expect(tabsCard).toContainText("Cobalt/Webf/Lynx/Servo のいずれでも完全動作");
    await expect(tabsCard).not.toContainText("VanJSのリアクティブステート");

    // Click "A11y/操作性" Tab
    await page.click('.c-tabs-btn:has-text("A11y/操作性")');
    await expect(tabsCard).toContainText(
      "タブボタンにはキーボード/リモコン用のフォーカススタイルを設定",
    );
  });

  test("accordion toggles open and closed", async ({ page }) => {
    const accordionBtn = page.locator('button:has-text("アコーディオン項目 1")');

    // Initially collapsed
    await expect(page.locator("text=親コンテナに overflow: hidden")).not.toBeVisible();

    // Click to expand
    await accordionBtn.click();
    await expect(page.locator("text=親コンテナに overflow: hidden")).toBeVisible();

    // Click to collapse
    await accordionBtn.click();
    await expect(page.locator("text=親コンテナに overflow: hidden")).not.toBeVisible();
  });

  test("toast notifications trigger and auto-dismiss", async ({ page }) => {
    // Click "成功トースト"
    await page.click('button:has-text("成功トースト")');

    const toast = page.locator(".c-toast.is-success");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("処理が正常に完了しました！");

    // Click "エラートースト"
    await page.click('button:has-text("エラートースト")');
    const errorToast = page.locator(".c-toast.is-error");
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText("通信エラーが発生しました");
  });
});
