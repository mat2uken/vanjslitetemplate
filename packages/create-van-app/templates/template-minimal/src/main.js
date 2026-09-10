import van from "./core/van.js";
import { RouterView, Link, navigate } from "./core/router.js";
import { authStore } from "./store.js";
import { HStack } from "./components/stack.js";
import "./styles/subset.css";

const { button, div, header, main, p, span, strong } = van.tags;

function HomePage() {
  const count = van.state(0);

  return div(
    { class: "c-container u-space-y-lg" },
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "1. Minimal VanJS Application"),
      p(
        { class: "c-card-description" },
        "Ultra-lightweight, zero-dependency SPA template targeting Mobile Safari and Embedded Engines (Cobalt, Webf, Lynx, Servo).",
      ),
      HStack(
        { spacing: 12 },
        button(
          {
            class: "c-btn c-btn-primary",
            onclick: () => count.val++,
          },
          "ローカルカウント: ",
          () => count.val,
        ),
        button(
          {
            class: "c-btn",
            onclick: () => (count.val = 0),
          },
          "リセット",
        ),
      ),
    ),

    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "2. グローバル状態 (authStore)"),
      p("ログイン状態: ", () =>
        authStore.isAuthenticated.val
          ? span({ class: "c-badge c-badge-success" }, "ログイン中: " + authStore.user.val.name)
          : span({ class: "c-badge" }, "未ログイン")
      ),
      HStack(
        { spacing: 8 },
        () =>
          authStore.isAuthenticated.val
            ? button({ class: "c-btn c-btn-danger", onclick: () => authStore.logout() }, "ログアウト")
            : button(
                {
                  class: "c-btn c-btn-primary",
                  disabled: () => authStore.isLoading.val,
                  onclick: () => authStore.login("Taro"),
                },
                () => (authStore.isLoading.val ? "ログイン処理中..." : "ログイン (Taro)")
              ),
        Link({ to: "/users/42?tab=overview", class: "c-btn" }, "動的ルート (/users/42) へ移動 →")
      )
    )
  );
}

function UserDetailPage({ params = {}, query = {} } = {}) {
  return div(
    { class: "c-container u-space-y-lg" },
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "動的ユーザー詳細ページ"),
      p("取得したユーザーID (params.id): ", strong(params.id || "none")),
      p("クエリパラメータ (query.tab): ", strong(query.tab || "none")),
      HStack(
        { spacing: 8 },
        button(
          { class: "c-btn", onclick: () => navigate("/users/" + params.id + "?tab=activity") },
          "タブ切替: activity"
        ),
        Link({ to: "/", class: "c-btn c-btn-primary" }, "← Homeへ戻る")
      )
    )
  );
}

const routes = {
  "/": HomePage,
  "/users/:id": UserDetailPage,
};

function App() {
  return div(
    { id: "app-root" },
    header(
      { class: "c-header" },
      div(
        { class: "u-flex u-items-center u-space-x-sm" },
        div(
          { class: "c-header-title" },
          "My VanJS App",
          span({ class: "c-header-badge" }, "Minimal"),
        ),
        () =>
          authStore.isAuthenticated.val
            ? span({ class: "c-badge c-badge-success", style: "font-size: 11px;" }, "👤 " + authStore.user.val.name)
            : span("")
      ),
      div({ style: "font-size: 12px; color: #94a3b8;" }, "Embedded-Safe Runtime"),
    ),
    main({ class: "c-main-scroll" }, RouterView(routes)),
  );
}

const mountPoint = document.getElementById("app") || document.body;
van.add(mountPoint, App());
