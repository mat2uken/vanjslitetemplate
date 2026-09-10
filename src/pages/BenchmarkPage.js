import van from "../core/van.js";
import random from "@nkzw/core/random.js";
import sortBy from "@nkzw/core/sortBy.js";

const { button, div, h2, p, span, table, tbody, td, th, thead, tr } = van.tags;

export function BenchmarkPage() {
  const isBenchmarking = van.state(false);
  const itemCount = van.state(0);
  const itemsState = van.state([]);
  const renderTime = van.state(0);

  function runBenchmark(count) {
    isBenchmarking.val = true;

    // Small delay to allow UI to show loading state
    setTimeout(() => {
      const t0 = performance.now();

      // Pre-allocate array capacity to prevent dynamic V8 heap resizes
      const newItems = new Array(count);
      for (let i = 0; i < count; i++) {
        const id = i + 1;
        newItems[i] = {
          id,
          title: `Item #${id} - ${Math.random().toString(36).slice(2, 8)}`,
          val: random(1, 1000),
        };
      }

      itemsState.val = newItems;

      requestAnimationFrame(() => {
        const t1 = performance.now();
        renderTime.val = Math.round((t1 - t0) * 10) / 10;
        itemCount.val = count;
        isBenchmarking.val = false;
      });
    }, 16);
  }

  function sortBenchmark() {
    if (itemsState.val.length === 0) {
      return;
    }
    const t0 = performance.now();
    // Clone array with fast native slice() so VanJS detects reference change
    const sorted = sortBy(itemsState.val.slice(), (item) => -item.val);
    itemsState.val = sorted;

    requestAnimationFrame(() => {
      const t1 = performance.now();
      renderTime.val = Math.round((t1 - t0) * 10) / 10;
    });
  }

  function clearItems() {
    itemsState.val = [];
    itemCount.val = 0;
    renderTime.val = 0;
  }

  return div(
    { class: "c-container u-space-y-lg" },

    // Header
    div(
      { class: "u-flex u-justify-between u-items-center" },
      h2({ style: "margin: 0; font-size: 18px;" }, "パフォーマンス＆レンダリング計測"),
      span({ class: "c-badge c-badge-success" }, "Direct DOM / Zero VDOM"),
    ),

    // Controls
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "ベンチマーク実行"),
      p(
        { class: "c-card-description" },
        "VanJSは仮想DOM（diffingアルゴリズム）を持たず、ブラウザの原生DOM APIを直接呼び出すため、低スペック組込み環境でのGC（ガベージコレクション）スパイクを回避できます。データ操作には @nkzw/core のユーティリティを活用しています。",
      ),
      div(
        { class: "u-flex u-flex-wrap u-space-x" },
        button(
          {
            class: "c-btn",
            disabled: isBenchmarking,
            onclick: () => runBenchmark(100),
          },
          "100件 生成",
        ),
        button(
          {
            class: "c-btn c-btn-primary",
            disabled: isBenchmarking,
            onclick: () => runBenchmark(500),
          },
          "500件 生成",
        ),
        button(
          {
            class: "c-btn",
            disabled: isBenchmarking,
            onclick: () => runBenchmark(1000),
          },
          "1,000件 生成",
        ),
        button(
          {
            class: "c-btn",
            disabled: () => itemsState.val.length === 0 || isBenchmarking.val,
            onclick: sortBenchmark,
          },
          "ソート (sortBy降順)",
        ),
        button(
          {
            class: "c-btn c-btn-danger",
            onclick: clearItems,
          },
          "クリア",
        ),
      ),
      div(
        { class: "c-metric-grid", style: "margin-top: 12px;" },
        div(
          { class: "c-metric-col" },
          div(
            { class: "c-metric-box" },
            div({ class: "c-metric-value" }, () => `${itemCount.val} 件`),
            div({ class: "c-metric-label" }, "描画DOMノード数"),
          ),
        ),
        div(
          { class: "c-metric-col" },
          div(
            { class: "c-metric-box" },
            div(
              { class: "c-metric-value", style: "color: #16a34a;" },
              () => `${renderTime.val} ms`,
            ),
            div({ class: "c-metric-label" }, "レンダリング所要時間"),
          ),
        ),
      ),
    ),

    // Rendered list container
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, span("レンダリング結果テーブル"), () =>
        isBenchmarking.val ? span({ class: "c-badge c-badge-warning" }, "計測中...") : span(""),
      ),
      div(
        {
          style:
            "max-height: 320px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 4px;",
        },
        () =>
          itemsState.val.length === 0
            ? div(
                { style: "padding: 24px; text-align: center; color: #94a3b8;" },
                "「生成」ボタンを押してベンチマークを実行してください",
              )
            : table(
                { class: "c-table" },
                thead(tr(th("ID"), th("ランダムハッシュ"), th("値"))),
                tbody(itemsState.val.map((it) => tr(td(it.id), td(it.title), td(it.val)))),
              ),
      ),
    ),
  );
}
