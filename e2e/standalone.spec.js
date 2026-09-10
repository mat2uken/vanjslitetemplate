import path from "node:path";
import { expect, test } from "@playwright/test";

const standalonePath = path.resolve(import.meta.dirname, "../dist/standalone.html");

test.describe("Standalone HTML Direct Injection (Safari & Mobile Safari)", () => {
  test("standalone single-file loads directly via file:// and operates without external requests", async ({
    page,
  }) => {
    // Open single standalone HTML directly via file://
    await page.goto(`file://${standalonePath}`);

    // Verify Title and Shell loaded with embedded inline CSS & JS
    await expect(page).toHaveTitle(/VanJS Light WebApp/);
    await expect(page.locator(".c-header-title")).toContainText("VanJS Light WebApp");

    // Test Navigation inside standalone file
    await page.click('button:has-text("UIコンポーネント検証")');
    await expect(page).toHaveURL(/#\/components/);

    // Test Modal inside standalone file
    await page.click('button:has-text("モーダルを開く")');
    await expect(page.locator(".c-modal-dialog")).toBeVisible();
    await page.click("#modal-ok-btn");
    await expect(page.locator(".c-toast")).toBeVisible();

    // Test Popover inside standalone file
    await page.click('button:has-text("ポップオーバー (中央配置)")');
    await expect(page.locator(".c-popover")).toBeVisible();
    await page.click('.c-popover button:has-text("閉じる")');
    await expect(page.locator(".c-popover")).not.toBeVisible();
  });

  test("standalone page enables vertical scrolling without cutting off bottom content", async ({
    page,
  }) => {
    await page.goto(`file://${standalonePath}#/components`);

    // Verify viewport containment: body should not overflow
    const bodyContainment = await page.evaluate(() => {
      const b = document.body;
      const s = document.querySelector(".c-main-scroll");
      return {
        bodyScrollHeight: b.scrollHeight,
        bodyClientHeight: b.clientHeight,
        hasMainScroll: Boolean(s),
        mainScrollHeight: s ? s.scrollHeight : 0,
        mainClientHeight: s ? s.clientHeight : 0,
      };
    });

    expect(bodyContainment.hasMainScroll).toBe(true);
    expect(bodyContainment.mainScrollHeight).toBeGreaterThan(bodyContainment.mainClientHeight);

    // Scroll to the bottom of the container
    await page.evaluate(() => {
      const s = document.querySelector(".c-main-scroll");
      s.scrollTop = s.scrollHeight;
    });

    const scrollTop = await page.evaluate(() => {
      const s = document.querySelector(".c-main-scroll");
      return s.scrollTop;
    });
    expect(scrollTop).toBeGreaterThan(100);

    // Bottom element (Lightweight Toast card) must be visible
    const toastCard = page.locator('.c-card:has-text("5. Lightweight Toast")');
    await expect(toastCard).toBeVisible();
  });
});
