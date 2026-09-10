# 超軽量 WebApp (SPA) PoC - 技術選定精査 & 実装レビュー

モバイルブラウザ（Chrome / Safari）から組込み・軽量Webエンジン（**Google Cobalt, Webf, Lynx, Servo, miniblink**）までを対象とした、超軽量・低依存Web App（SPA）の技術選定精査および実装PoCリポジトリです。

本プロジェクトの Foundation / Toolchain には、次世代 Rust 製高速ツールチェーン（**Vite+, Rolldown, Vitest, Oxc, Oxlint, Oxfmt**）および **nkzw-tech（Christoph Nakazawa氏）のエコシステム（`@nkzw/oxlint-config`, `@nkzw/stack`, `@nkzw/core`）** を全面採用しています。

---

## 1. Toolchain & Foundation アーキテクチャ

| レイヤー | 採用技術 | 役割・選定理由 |
|---|---|---|
| **Toolchain** | **Vite+ / Vite 8** | 次世代統合ツールチェーン。高速HMRと開発サーバー |
| **Bundler** | **Rolldown** (Rust) | Rust製超高速バンドラー。Vite 8 のコアエンジン |
| **Testing** | **Vitest** | Viteネイティブの高速単体テストフレームワーク |
| **Compiler** | **Oxc** (Rust) | 超高速JS/TSパーサー・トランスパイラ |
| **Linter** | **Oxlint** | ESLintの数十〜数百倍高速なRust製リンター（300ms台で全ファイル走査） |
| **Formatter** | **Oxfmt** | わずか数ミリ秒で全ファイルをフォーマットするRust製フォーマッター |
| **Shared defaults**| **`@nkzw/oxlint-config`** | nkzw-techによるオピニオン付き厳格なOxlint設定 |
| **Layout Utility** | **`@nkzw/stack` 思想** | ゼロ依存・型安全なFlexboxスタック。組込みNo-gapフォールバックを内包 |
| **Core Utilities** | **`@nkzw/core`** | 極小・ゼロ依存の関数群（`isPresent`, `sortBy`, `random`, `safeParse` 等） |

---

## 2. 提案ドキュメントの精査・技術レビュー

### 2.1 採用構成（モデルC改）の妥当性評価
結論として、**「モデルC改（VanJS + 独自Portal + 自作位置決め + Strict Subset CSS）」の選定は極めて妥当**です。

| 比較モデル | 評価 | 精査コメント |
|---|:---:|---|
| **モデルA: SolidJS / Preact** | △ | エコシステムは豊かだが、組込み環境では未実装DOM API（Shadow DOM、Custom Elements、一部イベント）によるクラッシュリスクが高い。バンドルサイズも数倍。 |
| **モデルB: VanJS + Native HTML** | × | `<dialog>` や `popover` 属性などのTop-layer APIは、Cobalt / Webf / Lynx では**完全に動作しない**ため、組込みターゲットでは即座に描画破綻する。 |
| **モデルC改: VanJS + 自作Portal/位置決め** | **◎ (採用)** | **DOM Level 1/2 の枯れたプリミティブAPIのみ**で構成。全エンジンで動作し、サイズも極小。開発保守性と互換性のバランスが最良。 |
| **モデルD: 完全自作Signal + 自作DOM** | ◯ | 極限環境（ROM数KBなど）では有効だが、リストレンダリングや状態バインディングの車輪の再発明コストが高く、長期的な保守性に課題あり。 |

---

### 2.2 ドキュメント想定サイズ vs 実測値のギャップ分析

本PoCにおいて、実際に本番稼働可能なコード（A11y、リモコン操作、メモリリーク防止、トースト通知、Stackコンポーネント、@nkzw/coreユーティリティ含む）を構築し、正確に測定（esbuild minify + gzip level 9）した結果は以下の通りです。

```
======================================================================
         VanJS Light WebApp PoC - Comprehensive Size Audit            
======================================================================

[1] Core Framework Runtime (VanJS + Custom Components & Utils)
----------------------------------------------------------------------
Layer / Module                            Raw        Gzip      Brotli
----------------------------------------------------------------------
1. VanJS Core (vanjs-core 1.6.1)      2.62 KB     1.26 KB     1.14 KB
2. Hash Router (van.state駆動)         3.01 KB     1.44 KB     1.31 KB
3. Safe Position Engine (Flip&Clamp)    820 B       415 B       351 B
4. Safe Events & STB Back Key           880 B       412 B       343 B
5. Portal Engine (メモリ安全)            144 B       138 B       109 B
6. Portal Modal (A11y/ESC対応)         3.87 KB     1.86 KB     1.66 KB
7. Safe Popover (Light Dismiss対応)   4.67 KB     2.10 KB     1.88 KB
8. Lightweight Tabs & Accordion        3.56 KB     1.75 KB     1.53 KB
9. Lightweight Toast                   3.11 KB     1.50 KB     1.35 KB
----------------------------------------------------------------------
★ FULL MODEL-C RUNTIME                8.86 KB     3.75 KB     3.34 KB

[2] Strict Subset CSS (No gap, No grid, No CSS variables)
----------------------------------------------------------------------
Strict Subset CSS (Minified)          5.54 KB     1.55 KB     1.28 KB
```

#### 【精査における重要ポイント】
- **机上想定（1.3〜1.6KB）との差分理由**:
  - ドキュメント記載の「1.3〜1.6KB」は、「VanJS本体（1.0KB）＋ 単純なPortal関数（0.3KB）＋ 位置計算（0.2KB）」の**骨格コードのみの単純合算**でした。
  - 実運用に耐えうるモーダル、ポップオーバー、タブ、トースト、スタック、ルーター、リモコンキー対応を含めると、**フルランタイム全体で約 3.75 KB (gzip) / 3.34 KB (brotli)** となります。
  - Preact（4〜7KB）や SolidJS（7KB）が「コアランタイム単体」であるのに対し、**本PoCはUIコンポーネント・位置決め・ルーター・スタック全込みで 3.7KB** であり、依然として圧倒的な極小性を誇ります。
- **Floating UI vs Safe Position Engine**:
  - Floating UI（3.5〜5.0 KB gzip）に対し、自作位置決めエンジンは **わずか 415 Byte (gzip)**。約1/10以下のサイズ削減を実証。
- **Strict Subset CSS**:
  - 1.55 KB (gzip) であり、ドキュメントの「1〜2 KB」に完全に合致。

---

### 2.3 組込み環境特有の落とし穴と本PoCでの解決策

1. **`position: fixed` のスクロール追従バグ（Cobalt/STB特有）**:
   - `html, body` を `overflow: hidden` に固定し、メイン領域（`.c-main-scroll`）のみをスクロールさせる構造でスクロールズレを原理的に排除。
2. **Portalのメモリリーク防止**:
   - `mountPortal()` は要素とリスナーを完全破棄する `unmount()` クリーンアップ関数を返し、長時間稼働するSTB機器でのDOM肥大化を防止。
3. **Smart TV / STB リモコン操作（リモコンBackキー対応）**:
   - Tizen TV (`10009`), webOS (`461`), Android TV (`4`), ESC (`27`) を一括処理し、OKボタンへの自動フォーカスを実装。
4. **Touch & Click の二重発火（Ghost Click）防止**:
   - `onSafeTap` ユーティリティでタッチ発火後の合成クリックを安全に抑制。
5. **クロスレルム・iframe 安全性（`@nkzw(no-instanceof)` 準拠）**:
   - `@nkzw/oxlint-config` のルールに基づき、`instanceof HTMLElement` を排除し `Boolean(node && node.nodeType)` による判定を採用。組込みWebViewやiframe間通信でも型判定が壊れません。

---

## 3. ディレクトリ構成

```
vanjslightpoc/
├── index.html                       # 開発・ビルド用エントリーHTML
├── vite.config.js                   # Vite設定 (Rolldown / Oxc / ES2018 target)
├── vitest.config.js                 # Vitest設定 (happy-dom 環境)
├── oxlint.config.js                 # @nkzw/oxlint-config を拡張した Oxlint 設定
├── package.json                     # スクリプト & 依存関係
├── README.md                        # 本ドキュメント
├── scripts/
│   ├── analyze-size.js              # モジュール別・全体サイズの自動計測スクリプト
│   └── build-standalone.js          # 組込みエンジン直接インジェクション用単一HTML生成
├── tests/
│   ├── position.test.js             # Safe Position Engine 単体テスト (Flip & Clamp)
│   ├── router.test.js               # Hash Router 単体テスト (同期・非同期ルーティング)
│   ├── stack.test.js                # @nkzw/stack 互換コンポーネント単体テスト
│   ├── core.test.js                 # @nkzw/core ユーティリティ連携テスト
│   ├── modal.test.js                # Portal Modal 単体テスト (A11y/ESC/Backdrop)
│   ├── popover.test.js              # Safe Popover 単体テスト (Light Dismiss/ESC)
│   ├── tabs.test.js                 # Tabs & Accordion 単体テスト (van.state駆動)
│   ├── toast.test.js                # Toast 通知単体テスト (自動破棄)
│   └── events.test.js               # 組込みイベント単体テスト (STBリモコンBack/GhostClick)
├── e2e/
│   ├── home.spec.js                 # ホーム画面・メトリクス・ナビゲーション E2E
│   ├── components.spec.js           # Modal・Popover・Tabs・Accordion・Toast 実機 E2E
│   ├── layout.spec.js               # Subset CSS & Stack レイアウト実機 E2E
│   ├── benchmark.spec.js            # Direct DOM 100件生成 & sortBy ソート実機 E2E
│   └── standalone.spec.js           # 単一自己完結HTML (file://) Safari 実機 E2E
└── src/
    ├── main.js                      # アプリケーション初期化・ルーティングマウント
    ├── bundle-core.js               # コアフレームワーク層（サイズ測定用エントリ）
    ├── core/
    │   ├── van.js                   # vanjs-core re-export
    │   └── router.js                # 超軽量ハッシュルーター (約15行、van.state駆動)
    ├── styles/
    │   └── subset.css               # Strict Subset CSS (No gap, No grid, No CSS var)
    ├── utils/
    │   ├── position.js              # Safe Position Engine (Flip & Clamp: 約25行, @nkzw/core連動)
    │   └── events.js                # 組込み安全イベント (Touch/Click/ESC/STB Backキー)
    ├── components/
    │   ├── portal.js                # メモリ安全Portalエンジン
    │   ├── modal.js                 # Portal Modal (<dialog>非依存)
    │   ├── popover.js               # Safe Popover (Safe Position連動)
    │   ├── tabs.js                  # Lightweight Tabs & Accordion (van.state駆動)
    │   ├── toast.js                 # Lightweight Toast (自動消去)
    │   └── stack.js                 # @nkzw/stack 思想の組込みセーフ Stack (No gap)
    └── pages/
        ├── HomePage.js              # 概要・アーキテクチャ特性・実測値表
        ├── ComponentsPage.js        # 各種UIコンポーネント実機動作検証
        ├── LayoutPage.js            # CSSレイアウト制約 & Stack コンポーネント検証
        └── BenchmarkPage.js         # 1,000 DOMノードレンダリング計測 (@nkzw/core連動)
```

---

## 4. テスト & Safari 実機検証コマンド

### 4.1 テストスイートの実行
```bash
# 1. ユニットテスト実行 (Vitest: happy-dom)
# -> 9 テストファイル / 25 テスト全合格 (~500ms)
npm run test:unit

# 2. E2E テスト実行 (Playwright: WebKit デスクトップ Safari & Mobile Safari)
# -> 32 テスト全合格 (~8s)
npm run test:e2e

# 3. ユニットテスト + E2E テストの一括実行
npm run test:all

# 4. 超高速 Lint (Oxlint + @nkzw/oxlint-config)
npm run lint

# 5. 超高速 フォーマット (Oxfmt)
npm run format
npm run format:check
```

### 4.2 macOS Safari 実機での直接プレビュー
```bash
# 開発サーバーを起動し、macOS Safari で開く
npm run dev
# 別ターミナルまたはブラウザで
npm run safari          # http://localhost:3000 を Safari で起動

# 単一スタンドアローンHTML（組込み向けファイル）を Safari で直接開く
npm run safari:standalone  # dist/standalone.html を file:// で Safari 起動
```

### 4.3 ビルド & バンドルサイズ測定
```bash
# プロダクションビルド & 単一HTML生成 (Rolldown / Oxc)
npm run build

# サイズ・バジェット自動計測 (zlib gzip/brotli)
npm run size
```
