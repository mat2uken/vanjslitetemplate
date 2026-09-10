import van from "../core/van.js";
import { HStack, VStack } from "../components/stack.js";

const { div, h2, p, span, strong, table, tbody, td, th, thead, tr } = van.tags;

const CARDS = [1, 2, 3, 4];

export function LayoutPage() {
  return div(
    { class: "c-container u-space-y-lg" },

    // Header
    div(
      { class: "u-flex u-justify-between u-items-center" },
      h2({ style: "margin: 0; font-size: 18px;" }, "Every Layout 準拠: Boxes & Layout Primitives"),
      span({ class: "c-badge c-badge-success" }, "every-layout.dev Inspired"),
    ),

    // 1. Every Layout: The Box & Invert
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "1. The Box (.l-box) & Intrinsic Sizing"),
      p(
        { class: "c-card-description" },
        "Every Layout の Boxes 原則: 「デザインのすべては Box である」。過剰な width: 100% を指定せず、inline-size: auto と border-box により内包コンテンツと外側コンテキストから自然に寸法を決定します。",
      ),
      div(
        { class: "u-flex u-space-x" },
        div(
          { class: "l-box", style: "flex: 1;" },
          strong("Standard Box"),
          p(
            { style: "margin: 4px 0 0 0; font-size: 12px; color: #64748b;" },
            "Padding + Border + Intrinsic content",
          ),
        ),
        div(
          { class: "l-box l-box--invert", style: "flex: 1;" },
          strong("Invert Box"),
          p(
            { style: "margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;" },
            "High-contrast dark container",
          ),
        ),
      ),
    ),

    // 2. Every Layout: The Stack & The Cluster
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "2. The Stack (.l-stack) & The Cluster (.l-cluster)"),
      p(
        { class: "c-card-description" },
        "The Stack は Lobotomized Owl (* + *) により親コンテキストから要素間に余白を注入。The Cluster は要素群を均一に折り返し配置します。",
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

    // 3. Every Layout: The Switcher (Algorithmic Breakpoint)
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "3. The Switcher (.l-switcher) - メディアクエリレス切り替え"),
      p(
        { class: "c-card-description" },
        "Every Layout 特有のアルゴリズム設計: flex-basis: calc((35rem - 100%) * 999) を活用し、コンテナ幅が閾値を下回るとメディアクエリ不要で自動的に縦積みに切り替わります。",
      ),
      div(
        { class: "l-switcher" },
        CARDS.map((e) =>
          div(
            { class: "c-metric-col" },
            div(
              { class: "c-metric-box" },
              div({ style: "color: #1e293b; font-weight: 700;" }, `カード ${e}`),
              div(
                { style: "color: #64748b; font-size: 12px; margin-top: 4px;" },
                "Switcherアルゴリズム",
              ),
            ),
          ),
        ),
      ),
    ),

    // 4. Fixed Scroll Bug Mitigation
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "4. position: fixed スクロール追従バグの完全回避"),
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

    // 5. Rule Check Matrix
    div(
      { class: "c-card" },
      div({ class: "c-card-header" }, "Strict Subset CSS & Every Layout 制約チェックリスト"),
      table(
        { class: "c-table" },
        thead(
          tr(
            th("Every Layout / CSS"),
            th("組込みでのリスク"),
            th("本PoCでの採用アプローチ"),
            th("判定"),
          ),
        ),
        tbody(
          tr(
            td("The Stack (gap代替)"),
            td("Cobalt/旧Safariでgap無視"),
            td("* + * Lobotomized Owl マージン注入"),
            td(span({ class: "c-badge c-badge-success" }, "クリア")),
          ),
          tr(
            td("The Switcher (Grid代替)"),
            td("Webf/CobaltでGrid未対応"),
            td("flex-basis calc((35rem - 100%) * 999)"),
            td(span({ class: "c-badge c-badge-success" }, "クリア")),
          ),
          tr(
            td("The Center (コンテンツ幅)"),
            td("コンテナパディング溢れ"),
            td("box-sizing: content-box + margin-inline: auto"),
            td(span({ class: "c-badge c-badge-success" }, "クリア")),
          ),
          tr(
            td("The Imposter (Modal)"),
            td("fixed要素のスクロール脱落"),
            td("Portal + body直下マウント + inset: 0"),
            td(span({ class: "c-badge c-badge-success" }, "クリア")),
          ),
          tr(
            td("The Box (装飾・擬似要素)"),
            td("ネイティブブリッジで疑似要素脱落"),
            td("純粋な実DOMスパンとborder/padding"),
            td(span({ class: "c-badge c-badge-success" }, "クリア")),
          ),
        ),
      ),
    ),
  );
}
