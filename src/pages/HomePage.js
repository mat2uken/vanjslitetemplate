import van from "../core/van.js";
import { navigate } from "../core/router.js";

const { button, div, h2, li, p, span, strong, table, tbody, td, th, thead, tr, ul } = van.tags;

const ARCHITECTURE_ROWS = [
  {
    badgeClass: "c-badge c-badge-success",
    layer: "View Layer",
    measured: "1.55 KB",
    method: "Strict Pure CSS",
    notes: "gap・Grid・CSS変数不使用。Margin隣接セレクタで代替",
    target: "1〜2 KB",
  },
  {
    badgeClass: "c-badge c-badge-info",
    layer: "Core Runtime",
    measured: "1.26 KB",
    method: "VanJS (vanjs-core 1.6)",
    notes: "直接DOM生成。仮想DOMなし、DOM Level 1/2互換",
    target: "約 0.9 KB",
  },
  {
    badgeClass: "c-badge c-badge-success",
    layer: "Position Engine",
    measured: "0.35 KB",
    method: "自作 placeSafePopover",
    notes: "四則演算+ClampでFloating UI(3.5~5KB)を完全代替",
    target: "約 0.2 KB",
  },
  {
    badgeClass: "c-badge c-badge-success",
    layer: "Event & Back Key",
    measured: "0.41 KB",
    method: "onSafeTap / onSafeBackKey",
    notes: "Touch/Click調停、Smart TVリモコンBackキー対応",
    target: "—",
  },
  {
    badgeClass: "c-badge c-badge-warning",
    layer: "UI Components",
    measured: "1.87 KB (複合)",
    method: "Portal, Modal, Popover, Tabs, Toast",
    notes: "Top-layer (<dialog>) 非依存。個別unmountでリーク完全防止",
    target: "約 0.3 KB (Portalのみ)",
  },
  {
    badgeClass: "c-badge c-badge-success",
    layer: "Router",
    measured: "0.17 KB",
    method: "Hash Router (van.state)",
    notes: "hashchangeイベント駆動、外部ライブラリ不要",
    target: "約 15 行",
  },
  {
    badgeClass: "c-badge c-badge-info",
    isTotal: true,
    layer: "合計ランタイム",
    measured: "3.23 KB",
    method: "Model-C 改 (Full Runtime)",
    notes: "実務運用可能なフルセットSPAランタイムとして極小",
    target: "約 1.3〜1.6 KB",
  },
];

export function HomePage() {
  return div(
    { class: "c-container u-space-y-lg" },

    // Hero Section
    div(
      { class: "c-card" },
      div(
        { class: "u-flex u-justify-between u-items-center", style: "margin-bottom: 8px;" },
        h2({ style: "margin: 0; font-size: 20px; color: #0f172a;" }, "超軽量Web App (SPA) PoC"),
        span({ class: "c-badge c-badge-success" }, "採用構成: モデルC改"),
      ),
      p(
        { class: "c-card-description" },
        "モバイルブラウザ（Chrome / Safari）から組込み・軽量エンジン（Cobalt, Webf, Lynx, Servo, miniblink）までを完全サポートする、超低依存・極小Web Appの設計検証PoCです。",
      ),
      div(
        { class: "c-metric-grid" },
        div(
          { class: "c-metric-col" },
          div(
            { class: "c-metric-box" },
            div({ class: "c-metric-value", style: "color: #2563eb;" }, "3.2 KB"),
            div({ class: "c-metric-label" }, "実測コア+UI (gzip)"),
          ),
        ),
        div(
          { class: "c-metric-col" },
          div(
            { class: "c-metric-box" },
            div({ class: "c-metric-value", style: "color: #16a34a;" }, "1.26 KB"),
            div({ class: "c-metric-label" }, "VanJS単体 (gzip)"),
          ),
        ),
        div(
          { class: "c-metric-col" },
          div(
            { class: "c-metric-box" },
            div({ class: "c-metric-value", style: "color: #0284c7;" }, "1.55 KB"),
            div({ class: "c-metric-label" }, "Subset CSS (gzip)"),
          ),
        ),
        div(
          { class: "c-metric-col" },
          div(
            { class: "c-metric-box" },
            div({ class: "c-metric-value", style: "color: #7c3aed;" }, "100%"),
            div({ class: "c-metric-label" }, "組込みサブセット適合"),
          ),
        ),
      ),
    ),

    // Quick Navigation
    div(
      { class: "c-card" },
      div({ class: "c-card-header" }, "PoC 実機検証メニュー"),
      div(
        { class: "u-flex u-flex-wrap", style: "margin: -4px;" },
        button(
          {
            class: "c-btn c-btn-primary",
            onclick: () => navigate("/components"),
            style: "margin: 4px;",
          },
          "UIコンポーネント検証 (Modal/Popover/Tabs)",
        ),
        button(
          {
            class: "c-btn",
            onclick: () => navigate("/layout"),
            style: "margin: 4px;",
          },
          "Strict CSS制約検証 (No gap / Flexbox)",
        ),
        button(
          {
            class: "c-btn",
            onclick: () => navigate("/state"),
            style: "margin: 4px;",
          },
          "状態管理 & 動的ルーティング",
        ),
        button(
          {
            class: "c-btn",
            onclick: () => navigate("/api/users/1"),
            style: "margin: 4px;",
          },
          "REST API & SWR 非同期連携",
        ),
        button(
          {
            class: "c-btn",
            onclick: () => navigate("/benchmark"),
            style: "margin: 4px;",
          },
          "パフォーマンス＆レンダリング速度計測",
        ),
      ),
    ),

    // Architecture Stack Box
    div(
      { class: "c-card" },
      div({ class: "c-card-header" }, "採用レイヤーアーキテクチャ"),
      table(
        { class: "c-table" },
        thead(
          tr(
            th("レイヤー"),
            th("実装方式"),
            th("ドキュメント想定"),
            th("PoC実測値 (gzip)"),
            th("設計・安全上のポイント"),
          ),
        ),
        tbody(
          ARCHITECTURE_ROWS.map((row) =>
            tr(
              td(strong(row.layer)),
              td(row.method),
              td(row.target),
              td(
                row.isTotal
                  ? strong(span({ class: row.badgeClass }, row.measured))
                  : span({ class: row.badgeClass }, row.measured),
              ),
              td(row.notes),
            ),
          ),
        ),
      ),
    ),

    // Embedded Engine Matrix
    div(
      { class: "c-card" },
      div({ class: "c-card-header" }, "組込み/軽量エンジン制約クリア状況"),
      ul(
        { style: "padding-left: 20px; margin: 0;" },
        li(
          strong("Google Cobalt (TV/STB): "),
          "<dialog>/popover/gapなし・fixedのスクロールズレ → Portal + margin + 内部スクロールdiv構造でクリア。STBリモコンBackキー対応。",
        ),
        li(
          strong("Webf (Flutterベース): "),
          "CSS Grid非対応・擬似要素の描画脱落 → ネストFlexbox + 実DOMスパンのみでクリア。",
        ),
        li(
          strong("Lynx (ByteDance): "),
          "Web Components/Shadow DOM不安定 → 関数型プレーンDOM生成（VanJS）でクリア。",
        ),
        li(
          strong("Servo & miniblink: "),
          "モダンAPI（Pointer Events/Anchor Positioning等）の未実装 → getBoundingClientRectと標準click/touch調停でクリア。",
        ),
      ),
    ),
  );
}
