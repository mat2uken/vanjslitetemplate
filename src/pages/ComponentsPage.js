import van from "../core/van.js";
import { openModal } from "../components/modal.js";
import { attachPopover } from "../components/popover.js";
import { createTabs, createAccordionItem } from "../components/tabs.js";
import { showToast } from "../components/toast.js";

const { button, div, h2, p, span, strong } = van.tags;

export function ComponentsPage() {
  const modalCount = van.state(0);

  // Helper to test modal
  function testOpenModal() {
    openModal({
      cancelText: "閉じる",
      content: div(
        p("このモーダルは document.body 直下に直接Portalマウントされています。"),
        p(strong("検証機能:")),
        div(
          { style: "font-size: 12px; color: #475569;" },
          "• 背景タップ/クリックで閉じる\n• キーボードESCキー または TVリモコンBackキーで閉じる\n• OKボタンへの自動フォーカス\n• backdrop-filter不使用（rgba背景）で描画クラッシュなし",
        ),
      ),
      okText: "確認 (カウントUP)",
      onCancel: () => {
        showToast("モーダルをキャンセルしました", "info");
      },
      onOk: () => {
        modalCount.val++;
        showToast(`モーダル確認完了 (通算: ${modalCount.val}回)`, "success");
      },
      title: "Portal Modal 検証",
    });
  }

  // Popover Trigger 1 (Bottom target)
  const popoverBtn1 = button({ class: "c-btn c-btn-primary" }, "ポップオーバー (中央配置)");
  attachPopover(
    popoverBtn1,
    (close) =>
      div(
        { class: "u-space-y-sm" },
        div({ style: "font-weight: 700;" }, "Safe Popover"),
        p(
          { style: "margin: 0; font-size: 12px;" },
          "getBoundingClientRect + Flip & Clampによる自作位置決め。外側タップで自動クローズします。",
        ),
        button(
          {
            class: "c-btn c-btn-sm",
            onclick: () => {
              close();
              showToast("Popover内アクション実行");
            },
            style: "width: 100%; margin-top: 8px;",
          },
          "閉じる",
        ),
      ),
    { placement: "bottom" },
  );

  // Popover Trigger 2 (Screen Edge Test for Clamp)
  const popoverBtn2 = button({ class: "c-btn" }, "画面端クランプ検証");
  attachPopover(
    popoverBtn2,
    div(
      div({ style: "font-weight: 600;" }, "画面端ガード"),
      p(
        { style: "margin: 4px 0 0 0; font-size: 12px;" },
        "画面幅からはみ出さないようClamp関数で安全に補正されています。",
      ),
    ),
    { placement: "bottom" },
  );

  // Tabs Definition
  const tabs = [
    {
      content: () =>
        div(
          p(
            "VanJSのリアクティブステート（van.state）により、仮想DOMの差分計算を一切行わずにノードを直接切り替えています。",
          ),
          p(
            { style: "font-size: 12px; color: #64748b;" },
            "コード量: tabs.js は約35行。軽量エンジンでのメモリ消費は極小です。",
          ),
        ),
      id: "tab1",
      label: "概要",
    },
    {
      content: () =>
        div(
          p(
            "Cobalt/Webf/Lynx/Servo のいずれでも完全動作。ブラウザ標準のDOM Level 1/2 APIのみで実装されています。",
          ),
          p(
            { style: "font-size: 12px; color: #64748b;" },
            "Web Components (Shadow DOM) を使用しないため、ネイティブブリッジでのトラブルが起きません。",
          ),
        ),
      id: "tab2",
      label: "エンジン互換性",
    },
    {
      content: () =>
        div(
          p(
            "タブボタンにはキーボード/リモコン用のフォーカススタイルを設定。矢印キーやTabキーでの移動が可能です。",
          ),
        ),
      id: "tab3",
      label: "A11y/操作性",
    },
  ];

  return div(
    { class: "c-container u-space-y-lg" },

    // Header
    div(
      { class: "u-flex u-justify-between u-items-center" },
      h2({ style: "margin: 0; font-size: 18px;" }, "UIコンポーネント & A11y 検証"),
      span({ class: "c-badge c-badge-info" }, "Zero Dependency"),
    ),

    // 1. Modal Test
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "1. Portal Modal (<dialog> 非依存)"),
      p(
        { class: "c-card-description" },
        "組込みエンジンで未実装または不具合の多い <dialog> や popover 属性を使わず、document.body 直下へのPortalマウントで描画します。",
      ),
      div(
        { class: "u-flex u-items-center u-space-x" },
        button(
          {
            class: "c-btn c-btn-primary",
            onclick: testOpenModal,
          },
          "モーダルを開く",
        ),
        span({ style: "font-size: 13px; color: #64748b;" }, () => `確認回数: ${modalCount.val}`),
      ),
    ),

    // 2. Popover Test
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "2. Safe Popover (自作位置決めエンジン)"),
      p(
        { class: "c-card-description" },
        "Floating UI（3.5〜5KB）や CSS Anchor Positioning を使わず、約25行の四則演算 + getBoundingClientRect で上下反転（Flip）と画面端制限（Clamp）を実現。",
      ),
      div({ class: "u-flex u-space-x" }, popoverBtn1, popoverBtn2),
    ),

    // 3. Tabs Test
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "3. Lightweight Tabs (van.state 駆動)"),
      p(
        { class: "c-card-description" },
        "UIライブラリ（Zag.js等: 4〜10KB/部品）を排除し、van.state のみで高速にタブを切り替えます。",
      ),
      createTabs(tabs, "tab1"),
    ),

    // 4. Accordion Test
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "4. Lightweight Accordion (<details> 代替)"),
      p(
        { class: "c-card-description" },
        "<details>/<summary> のレンダリング差異を避けるための純粋なState駆動アコーディオン。",
      ),
      createAccordionItem(
        "アコーディオン項目 1: なぜ組込みでPortalが必要か？",
        "親コンテナに overflow: hidden や transform がかかっている場合、一般的な fixed 要素はスクロールで切り取られたり位置がずれたりします。document.body 直下にPortalマウントすることでこの制約を100%回避できます。",
      ),
      createAccordionItem(
        "アコーディオン項目 2: メモリリーク防止機構",
        "モーダルやポップオーバーを閉じた瞬間、unmount() コールバックが DOM ツリーから要素を完全に除去し、イベントリスナーも解除するため、長時間稼働するSTB環境でもメモリリークを起こしません。",
      ),
    ),

    // 5. Toast Test
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "5. Lightweight Toast 通知"),
      div(
        { class: "u-flex u-space-x" },
        button(
          {
            class: "c-btn",
            onclick: () => showToast("通常通知メッセージです", "info"),
          },
          "情報トースト",
        ),
        button(
          {
            class: "c-btn c-btn-primary",
            onclick: () => showToast("処理が正常に完了しました！", "success"),
          },
          "成功トースト",
        ),
        button(
          {
            class: "c-btn c-btn-danger",
            onclick: () => showToast("通信エラーが発生しました", "error"),
          },
          "エラートースト",
        ),
      ),
    ),
  );
}
