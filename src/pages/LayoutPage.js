import van from "../core/van.js";
import { HStack, VStack } from "../components/stack.js";

const { div, h2, p, span, strong, table, tbody, td, th, thead } = van.tags;

export function LayoutPage() {
  return div(
    { class: "c-container u-space-y-lg" },

    // Header
    div(
      { class: "u-flex u-justify-between u-items-center" },
      h2({ style: "margin: 0; font-size: 18px;" }, "Strict Subset CSS & Stack レイアウト検証"),
      span({ class: "c-badge c-badge-warning" }, "No gap / No Grid / Pure CSS"),
    ),

    // Stack Component Demo (@nkzw/stack inspired)
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "1. @nkzw/stack 互換: 組込みセーフ Stack コンポーネント"),
      p(
        { class: "c-card-description" },
        "@nkzw/stack の「ゼロ依存・型安全なFlexbox抽象化」思想をVanJSに移植。CobaltやWebfで gap が使えない制約を、隣接セレクタ・マージンフォールバックで完全透過的に解決します。",
      ),
      VStack(
        { spacing: 8, style: "background-color: #f1f5f9; padding: 12px; border-radius: 6px;" },
        HStack(
          { spacing: 8 },
          div(
            {
              style:
                "flex: 1; padding: 10px; background: #ffffff; border: 1px solid #cbd5e1; text-align: center;",
            },
            "HStack Item 1",
          ),
          div(
            {
              style:
                "flex: 1; padding: 10px; background: #ffffff; border: 1px solid #cbd5e1; text-align: center;",
            },
            "HStack Item 2",
          ),
          div(
            {
              style:
                "flex: 1; padding: 10px; background: #ffffff; border: 1px solid #cbd5e1; text-align: center;",
            },
            "HStack Item 3",
          ),
        ),
        HStack(
          {
            align: "center",
            justify: "between",
            style:
              "padding: 8px 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px;",
          },
          span({ style: "font-weight: 600;" }, 'HStack with justify="between"'),
          span({ class: "c-badge c-badge-info" }, "Flexbox Safe"),
        ),
      ),
    ),

    // Grid-less Multi-column Demo
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "2. CSS Grid 代替のネスト Flexbox レスポンシブ配置"),
      p(
        { class: "c-card-description" },
        "WebfやCobalt等では display: grid が未実装です。すべて flex-direction: row / column のネストと flex-wrap, 負の親マージン + 子パディングで完全なマルチカラムグリッドを再現します。",
      ),
      div(
        { class: "c-metric-grid" },
        [1, 2, 3, 4].map((e) =>
          div(
            { class: "c-metric-col" },
            div(
              { class: "c-metric-box" },
              div({ style: "color: #1e293b; font-weight: 700;" }, `カード ${e}`),
              div(
                { style: "color: #64748b; font-size: 12px; margin-top: 4px;" },
                "Flexboxネスト構成",
              ),
            ),
          ),
        ),
      ),
    ),

    // Fixed Scroll Bug Mitigation Demo
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "3. position: fixed スクロール追従バグの完全回避"),
      p(
        { class: "c-card-description" },
        "組込みエンジンでは、html/bodyスクロール時に fixed ヘッダーやモーダルが揺れたり、描画から脱落するバグが多発します。",
      ),
      div(
        {
          style:
            "border-left: 3px solid #2563eb; color: #334155; font-size: 13px; padding-left: 12px;",
        },
        p(strong("本構成の安全設計:")),
        p("① html, body に overflow: hidden を指定し、ウィンドウレベルのスクロールを遮断。"),
        p("② コンテンツ領域 (.c-main-scroll) の単一 div のみ overflow-y: auto にする。"),
        p("③ ヘッダーは通常フローで配置されるため、スクロールズレが原理的に発生しない。"),
      ),
    ),

    // Rule Check Matrix
    div(
      { class: "c-card" },
      div({ class: "c-card-header" }, "Strict Subset CSS 制約チェックリスト"),
      table(
        { class: "c-table" },
        thead(
          van.tags.tr(
            th("CSS機能"),
            th("組込みでのリスク"),
            th("本PoCでの代替アプローチ"),
            th("判定"),
          ),
        ),
        tbody(
          van.tags.tr(
            td("gap"),
            td("Cobalt/旧Safariで無視される"),
            td("* + * 隣接マージン / Stack fallback"),
            td(span({ class: "c-badge c-badge-success" }, "クリア")),
          ),
          van.tags.tr(
            td("CSS Grid"),
            td("Webf/Cobaltでパースエラー・無効"),
            td("Flexboxネスト + flex-wrap"),
            td(span({ class: "c-badge c-badge-success" }, "クリア")),
          ),
          van.tags.tr(
            td("CSS Variables (var)"),
            td("再計算コスト・古いエンジン未対応"),
            td("ビルド時解決または直接カラー指定"),
            td(span({ class: "c-badge c-badge-success" }, "クリア")),
          ),
          van.tags.tr(
            td("backdrop-filter"),
            td("GPU負荷増大・黒塗りバグ"),
            td("rgba(15, 23, 42, 0.65) 半透明ベタ"),
            td(span({ class: "c-badge c-badge-success" }, "クリア")),
          ),
          van.tags.tr(
            td("::before / ::after"),
            td("ネイティブブリッジでノード脱落"),
            td("明示的な span / div タグを配置"),
            td(span({ class: "c-badge c-badge-success" }, "クリア")),
          ),
        ),
      ),
    ),
  );
}
