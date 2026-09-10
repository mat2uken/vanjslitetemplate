import { expect, test } from "@playwright/test";

test.describe("REST API & SWR Integration (Safari & Mobile Safari)", () => {
  test("displays user detail page, fetches data and allows optimistic mutation", async ({
    page,
  }) => {
    await page.goto("/#/api/users/1");

    // Verify Page Header
    const card = page.locator("#user-detail-page");
    await expect(card).toBeVisible();
    await expect(card.locator("h2")).toContainText("REST API & SWR 非同期連携 PoC");

    // Verify User details rendered
    await expect(card.locator("h3")).toContainText("山田 太郎");
    await expect(card).toContainText("taro.yamada@example.com");

    // Perform optimistic update
    const updateBtn = page.getByRole("button", { name: /楽観的更新/ });
    await updateBtn.click();

    // Verify updated text reflects immediately
    await expect(card.locator("h3")).toContainText("更新ユーザー");

    // Navigate to user 2
    const user2Link = page.getByRole("link", { name: "ユーザー 2" });
    await user2Link.click();
    await expect(page).toHaveURL(/#\/api\/users\/2/);
    await expect(card.locator("h3")).toContainText("佐藤 花子");

    // Navigate back to user 1 (Zero-latency cache hit)
    const user1Link = page.getByRole("link", { name: "ユーザー 1" });
    await user1Link.click();
    await expect(page).toHaveURL(/#\/api\/users\/1/);
    await expect(card.locator("h3")).toContainText("更新ユーザー");
  });
});
