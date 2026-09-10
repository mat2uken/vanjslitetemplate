/**
 * User Detail Page Component
 * Demonstrates SWR resource caching, zero-latency navigation, and route cleanup.
 */

import van from "../core/van.js";
import { createSWRResource } from "../lib/swrResource.js";
import { mutate } from "../lib/cache.js";
import { userService } from "../services/userService.js";
import { Link } from "../core/router.js";

const { div, h2, h3, p, button, span, hr, strong } = van.tags;

export function UserDetailPage({ params = { id: "1" } }) {
  const userId = params.id || "1";
  const cacheKey = `user-${userId}`;

  const userResource = createSWRResource(userService.getUserById, {
    ttl: 15_000, // 15 seconds freshness
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  // Execute resource fetching (immediate cache render if available)
  userResource.execute(cacheKey, userId);

  const handleUpdate = async () => {
    const newName = `更新ユーザー (${new Date().toLocaleTimeString()})`;
    try {
      // Optimistic update: instantly reflect in cache
      mutate(cacheKey, (old) => (old ? { ...old, name: newName } : { id: userId, name: newName }));

      const updated = await userService.updateUser(userId, { name: newName });
      // Finalize with server returned state
      mutate(cacheKey, updated);
    } catch (error) {
      alert(`更新エラー: ${error.message}`);
    }
  };

  const root = div(
    { class: "c-card", id: "user-detail-page" },

    div(
      { class: "u-flex u-items-center u-justify-between" },
      h2("REST API & SWR 非同期連携 PoC"),
      () =>
        userResource.isValidating.val
          ? span(
              { class: "c-badge c-badge-warning", style: "font-size: 11px;" },
              "🔄 SWR バックグラウンド再検証中...",
            )
          : span(
              { class: "c-badge c-badge-success", style: "font-size: 11px;" },
              "✓ キャッシュ同期済",
            ),
    ),

    p(
      { style: "color: #64748b; font-size: 13px;" },
      "キャッシュ（TTL 15秒）が存在する場合は0ms即時描画。期限切れ時は裏でフェッチし、タブ復帰時にも自動再検証されます。",
    ),

    hr({ style: "border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0;" }),

    // Dynamic state binding
    () => {
      if (userResource.loading.val) {
        return div(
          { class: "c-card", style: "text-align: center; padding: 24px; color: #64748b;" },
          "⏳ データを読み込み中...",
        );
      }

      if (userResource.error.val) {
        return div(
          { class: "c-card", style: "border-left: 4px solid #ef4444; background: #fef2f2;" },
          p(
            { style: "color: #b91c1c; font-weight: bold;" },
            `取得エラー: ${userResource.error.val.message}`,
          ),
          button(
            {
              class: "c-btn c-btn-secondary",
              onclick: () => userResource.execute(cacheKey, userId),
            },
            "再試行 (Retry)",
          ),
        );
      }

      const user = userResource.data.val;
      if (!user) {
        return div({ class: "c-card" }, "データが見つかりません");
      }

      return div(
        { class: "u-space-y-sm" },
        h3({ style: "margin: 0 0 8px 0;" }, user.name),
        p(strong("ユーザーID: "), user.id),
        p(strong("メールアドレス: "), user.email),
        p(strong("役職 / ロール: "), user.role || "N/A"),
        p(
          strong("最終更新タイムスタンプ: "),
          span({ style: "font-family: monospace; font-size: 12px;" }, user.updatedAt || "N/A"),
        ),

        div(
          { class: "u-flex u-space-x-sm", style: "margin-top: 16px;" },
          button(
            {
              class: "c-btn c-btn-primary",
              onclick: handleUpdate,
            },
            "⚡ 楽観的更新 (Optimistic Mutation)",
          ),
          button(
            {
              class: "c-btn c-btn-secondary",
              onclick: () => userResource.revalidate(),
            },
            "🔄 手動SWR再検証",
          ),
        ),
      );
    },

    hr({ style: "border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" }),

    div(
      { class: "u-flex u-space-x-sm" },
      Link({ class: "c-btn c-btn-secondary", to: "/api/users/1" }, "ユーザー 1"),
      Link({ class: "c-btn c-btn-secondary", to: "/api/users/2" }, "ユーザー 2"),
      Link({ class: "c-btn c-btn-secondary", to: "/" }, "← ホームに戻る"),
    ),
  );

  // Unmount lifecycle cleanup hook (automatically invoked by RouterView)
  root._cleanup = () => {
    userResource.destroy();
  };

  return root;
}
