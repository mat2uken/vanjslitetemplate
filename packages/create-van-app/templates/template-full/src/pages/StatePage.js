import van from "../core/van.js";
import { authStore } from "../core/store.js";
import { Link, navigate } from "../core/router.js";
import { HStack } from "../components/stack.js";

const { button, div, h2, p, span, strong, table, tbody, td, th, thead } = van.tags;

export function StatePage({ params = {}, query = {} } = {}) {
  const localCounter = van.state(0);
  const activeUserId = params.id || "100";
  const activeTab = query.tab || "overview";

  return div(
    { class: "c-container u-space-y-lg" },

    // Header
    div(
      { class: "u-flex u-justify-between u-items-center" },
      h2({ style: "margin: 0; font-size: 18px;" }, "状態管理 & 動的クライアントサイドルーティング"),
      span({ class: "c-badge c-badge-primary" }, "van.state + Regex Router"),
    ),

    // 1. Global Store Demonstration
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "1. グローバルストア (authStore)"),
      p(
        { class: "c-card-description" },
        "モジュールスコープに配置された van.state は、SPA内のページ遷移（URL変更）が発生しても破棄されず、ブラウザ生存期間中に永続化されます。派生状態（isAuthenticated）も自動で連動します。",
      ),

      // Store Status Panel
      div(
        { class: "l-box l-box--muted u-space-y-sm" },
        div(
          { class: "u-flex u-justify-between u-items-center" },
          div(strong("ログイン状態: "), () =>
            authStore.isAuthenticated.val
              ? span({ class: "c-badge c-badge-success" }, "ログイン中 (Authenticated)")
              : span({ class: "c-badge" }, "未ログイン (Guest)"),
          ),
          () =>
            authStore.user.val
              ? span(
                  { style: "font-size: 12px; color: #64748b;" },
                  `ログイン時刻: ${authStore.user.val.loggedInAt}`,
                )
              : span(""),
        ),
        div(strong("現在のユーザー: "), () =>
          authStore.user.val
            ? `${authStore.user.val.name} (Role: ${authStore.user.val.role})`
            : "ゲスト",
        ),
      ),

      // Actions
      HStack(
        { spacing: 8 },
        () =>
          authStore.isAuthenticated.val
            ? button(
                {
                  class: "c-btn c-btn-danger",
                  onclick: () => authStore.logout(),
                },
                "ログアウト",
              )
            : button(
                {
                  class: "c-btn c-btn-primary",
                  disabled: () => authStore.isLoading.val,
                  onclick: () => authStore.login("Taro (管理者)"),
                },
                () => (authStore.isLoading.val ? "認証通信中 (300ms)..." : "ログインする (Taro)"),
              ),
        button(
          {
            class: "c-btn",
            disabled: () => authStore.isLoading.val,
            onclick: () => authStore.login("Hanako (メンバー)"),
          },
          "別名でログイン (Hanako)",
        ),
      ),

      // Local vs Global Counter Comparison
      div(
        { style: "margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e2e8f0;" },
        HStack(
          { spacing: 12, style: "align-items: center;" },
          span("ページ固有ローカル状態 (遷移でリセット): "),
          strong(() => `${localCounter.val}`),
          button(
            {
              class: "c-btn",
              style: "padding: 4px 10px; font-size: 12px;",
              onclick: () => localCounter.val++,
            },
            "+1 加算",
          ),
        ),
      ),
    ),

    // 2. Dynamic Route & Query Parameter Resolution
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "2. 動的パスパラメータ & クエリパラメータ解析"),
      p(
        { class: "c-card-description" },
        "外部ライブラリゼロで /state/users/:id や ?tab=...&sort=... を正規表現コンパイル & キャッシュによって高速抽出。ページコンポーネントへ引数として注入されます。",
      ),

      // Route parameter links
      div(
        { class: "l-cluster", style: "margin-bottom: 12px;" },
        Link(
          {
            to: "/state/users/100?tab=overview",
            class: `c-btn ${activeUserId === "100" && activeTab === "overview" ? "c-btn-primary" : ""}`,
          },
          "ユーザー 100 (概要)",
        ),
        Link(
          {
            to: "/state/users/100?tab=activity&sort=desc",
            class: `c-btn ${activeUserId === "100" && activeTab === "activity" ? "c-btn-primary" : ""}`,
          },
          "ユーザー 100 (アクティビティ)",
        ),
        Link(
          {
            to: "/state/users/42?tab=settings",
            class: `c-btn ${activeUserId === "42" ? "c-btn-primary" : ""}`,
          },
          "ユーザー 42 (設定)",
        ),
      ),

      // Dynamic parameter inspection box
      div(
        { class: "l-box", style: "background-color: #0f172a; color: #f8fafc;" },
        div(
          { style: "font-family: monospace; font-size: 13px;" },
          div(span({ style: "color: #38bdf8;" }, "● 解析された params: "), JSON.stringify(params)),
          div(span({ style: "color: #4ade80;" }, "● 解析された query: "), JSON.stringify(query)),
          div(
            span({ style: "color: #facc15;" }, "● 現在の動的タブ: "),
            span({ class: "c-badge c-badge-primary" }, activeTab),
          ),
        ),
      ),

      // Interactive Tab Buttons (Updates query string without reload)
      HStack(
        { spacing: 8 },
        button(
          {
            class: `c-btn ${activeTab === "overview" ? "c-btn-primary" : ""}`,
            onclick: () => navigate(`/state/users/${activeUserId}?tab=overview`),
          },
          "概要タブへ切替",
        ),
        button(
          {
            class: `c-btn ${activeTab === "activity" ? "c-btn-primary" : ""}`,
            onclick: () => navigate(`/state/users/${activeUserId}?tab=activity&sort=desc`),
          },
          "アクティビティタブへ切替",
        ),
        button(
          {
            class: `c-btn ${activeTab === "settings" ? "c-btn-primary" : ""}`,
            onclick: () => navigate(`/state/users/${activeUserId}?tab=settings`),
          },
          "設定タブへ切替",
        ),
      ),
    ),

    // 3. Router & Store Architecture Table
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "3. 状態管理 & ルーティングの設計特徴"),
      table(
        { class: "c-table" },
        thead(van.tags.tr(th("項目"), th("実装技術 / アプローチ"), th("組込み / Safari 適合性"))),
        tbody(
          van.tags.tr(
            td(strong("グローバル状態")),
            td("ES Modules キャッシュ + van.state / van.derive"),
            td(span({ class: "c-badge c-badge-success" }, "メモリ超軽量 (数100B)")),
          ),
          van.tags.tr(
            td(strong("パスパラメータ")),
            td("正規表現事前コンパイルキャッシュ (/users/:id)"),
            td(span({ class: "c-badge c-badge-success" }, "O(1) ルックアップ")),
          ),
          van.tags.tr(
            td(strong("クエリ解析")),
            td("URLSearchParams + 独自フォールバック解析"),
            td(span({ class: "c-badge c-badge-success" }, "全環境 100% 互換")),
          ),
          van.tags.tr(
            td(strong("動作モード")),
            td("Hash mode (組込み/file://) ⇄ History mode 切替対応"),
            td(span({ class: "c-badge c-badge-success" }, "SecurityError 回避")),
          ),
        ),
      ),
    ),
  );
}
