# 超軽量 WebApp (SPA) PoC - 技術選定精査 & 実装レビュー

モバイルブラウザ（Chrome / Safari）から組込み・軽量Webエンジン（**Google Cobalt, Webf, Lynx, Servo, miniblink**）までを対象とした、超軽量・低依存Web App（SPA）の技術選定精査および実装PoCリポジトリです。

本プロジェクトの Foundation / Toolchain には、次世代 Rust 製高速ツールチェーン（**Vite+, Rolldown, Vitest, Oxc, Oxlint, Oxfmt**）および **nkzw-tech（Christoph Nakazawa氏）のエコシステム（`@nkzw/oxlint-config`, `@nkzw/stack`, `@nkzw/core`）** を全面採用しています。

---

## 0. プロジェクト作成クイックスタート (CLI / テンプレート利用法)

本リポジトリの構成をベースに、新しい軽量Webアプリケーションを即座に開始するための **3つのベストプラクティス** を提供しています。

### 方法 A: `npm create van-app` (公式スキャフォールディング CLI)
React の `create-react-app` や Vite の `create-vite` と同様の体験を提供する、ゼロ依存の高速対話型 CLI ツールです。

```bash
# npm を使用する場合
npm create van-app my-new-app

# npx で即座に実行する場合
npx create-van-app my-new-app

# または pnpm / bun
pnpm create van-app my-new-app
bun create van-app my-new-app
```

**CLI オプション一覧:**
- `-t, --template <full | minimal>`: テンプレート種別（`full`: 全コンポーネント・E2Eテスト入り、`minimal`: 極小スケルトン）
- `--pm <npm|pnpm|bun|yarn>`: パッケージマネージャーの指定（自動判定あり）
- `-y, --yes`: 対話プロンプトをスキップしてデフォルト値で即座に作成
- `--remote`: GitHub リポジトリ（`mat2uken/vanjslitetemplate`）の最新コミットから直接クローン

```bash
# ワンライナーで最小構成を作成する例:
npx create-van-app my-app -t minimal -y --install
```

### 方法 B: `degit` による直接取得
Git 履歴を含めず、最新のテンプレートファイルを 1 秒でダウンロードします。

```bash
npx degit mat2uken/vanjslitetemplate my-new-app
cd my-new-app
npm install
npm run safari
```

### 方法 C: GitHub の「Use this template」ボタン
GitHub リポジトリ（[`mat2uken/vanjslitetemplate`](https://github.com/mat2uken/vanjslitetemplate)）上部の緑色ボタン **「Use this template」** をクリックすると、GitHub 上でワンクリックで新しい個人・組織リポジトリを作成できます。

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
6. **REST API非同期通信・SWRキャッシュ・ルーター自動クリーンアップ**:
   - **AbortController による競合排除**: 高速画面遷移時の古い非同期レスポンスによるDOM破壊を100%防止。
   - **Stale-While-Revalidate**: 有効期限内（TTL）なら0ms即時描画。期限切れ時は古いデータを表示しつつバックグラウンドで最新データを再検証。
   - **リクエスト重複排除（In-flight Deduplication）**: 複数コンポーネントが同一キーを要求してもHTTP通信は1回に集約。
   - **参照カウント型ライフサイクル**: 画面がアンマウントされて購読者数が0になると、`window` のフォーカス・オンライン監視リスナーを自動解除。
   - **RouterView の自動クリーンアップ連動**: ルート切り替え時に前画面の `_cleanup()` を自動実行し、進行中リクエストの中断とメモリ解放を完結。

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
│   ├── build-standalone.js          # 組込みエンジン直接インジェクション用単一HTML生成
│   ├── open-safari.js               # macOS Safari / サーバー自動起動
│   └── sync-templates.js            # CLIテンプレート同期スクリプト
├── tests/
│   ├── client.test.js               # REST API クライアント単体テスト (タイムアウト/シグナル連携)
│   ├── cache.test.js                # インメモリSWRキャッシュ単体テスト (TTL/重複排除/LRU/mutate)
│   ├── swr.test.js                  # SWR非同期リソース単体テスト (0ms描画/再検証/自動同期)
│   ├── router-cleanup.test.js       # ルーターアンマウントクリーンアップ単体テスト
│   ├── position.test.js             # Safe Position Engine 単体テスト (Flip & Clamp)
│   ├── router.test.js               # Enhanced Router 単体テスト (動的パス/ゼロアロケーションクエリ)
│   ├── store.test.js                # Global Store 単体テスト (van.state永続化 & リアクティブ派生)
│   ├── stack.test.js                # @nkzw/stack 互換コンポーネント単体テスト
│   ├── core.test.js                 # @nkzw/core ユーティリティ連携テスト
│   ├── modal.test.js                # Portal Modal 単体テスト (A11y/ESC/Backdrop)
│   ├── popover.test.js              # Safe Popover 単体テスト (Light Dismiss/ESC)
│   ├── tabs.test.js                 # Tabs & Accordion 単体テスト (van.state駆動/O(1) Map)
│   ├── toast.test.js                # Toast 通知単体テスト (自動破棄/プログラマティック消去)
│   ├── events.test.js               # 組込みイベント単体テスト (STBリモコンBack/GhostClick)
│   └── cli.test.js                  # create-van-app CLI スキャフォールディング単体テスト
├── e2e/
│   ├── home.spec.js                 # ホーム画面・メトリクス・ナビゲーション E2E
│   ├── components.spec.js           # Modal・Popover・Tabs・Accordion・Toast 実機 E2E
│   ├── layout.spec.js               # Subset CSS & Stack レイアウト実機 E2E
│   ├── state.spec.js                # グローバル状態・動的ルーティング・パラメータ解析 E2E
│   ├── benchmark.spec.js            # Direct DOM 100件生成 & sortBy ソート実機 E2E (Web-first)
│   └── standalone.spec.js           # 単一自己完結HTML (file://) Safari 実機 E2E
├── packages/
│   └── create-van-app/              # 公式スキャフォールディング CLI パッケージ
│       ├── bin/index.js             # ゼロ依存 CLI コマンド実行ファイル
│       └── templates/               # full / minimal 配布テンプレート
└── src/
    ├── main.js                      # アプリケーション初期化・ルーティングマウント
    ├── bundle-core.js               # コアフレームワーク層（サイズ測定用エントリ）
    ├── core/
    │   ├── van.js                   # vanjs-core re-export
    │   ├── router.js                # 動的パス・クエリ・Hash/History両対応ルーター
    │   └── store.js                 # グローバル状態管理 & ストアファクトリ
    ├── styles/
    │   └── subset.css               # Strict Subset CSS (No gap, No grid, No CSS var)
    ├── utils/
    │   ├── position.js              # Safe Position Engine (Flip & Clamp: 約25行, @nkzw/core連動)
    │   └── events.js                # 組込み安全イベント (Touch/Click/ESC/STB Backキー)
    ├── components/
    │   ├── portal.js                # メモリ安全Portalエンジン
    │   ├── modal.js                 # Portal Modal (<dialog>非依存、直接ノードフォーカス)
    │   ├── popover.js               # Safe Popover (Safe Position連動)
    │   ├── tabs.js                  # Lightweight Tabs & Accordion (van.state駆動)
    │   ├── toast.js                 # Lightweight Toast (自動消去 & 手動Dismiss)
    │   └── stack.js                 # @nkzw/stack 思想の組込みセーフ Stack (No gap)
    └── pages/
        ├── HomePage.js              # 概要・アーキテクチャ特性・実測値表
        ├── ComponentsPage.js        # 各種UIコンポーネント実機動作検証
        ├── LayoutPage.js            # CSSレイアウト制約 & Stack コンポーネント検証
        ├── StatePage.js             # 状態管理・動的ルーティング・パラメータ解析
        └── BenchmarkPage.js         # 1,000 DOMノードレンダリング計測 (@nkzw/core連動)
```

---

## 4. テスト & Safari 実機検証コマンド

### 4.1 テストスイートの実行
```bash
# 1. ユニットテスト実行 (Vitest: happy-dom)
# -> 11 テストファイル / 38 テスト全合格 (~1.1s)
npm run test:unit

# 2. E2E テスト実行 (Playwright: WebKit デスクトップ Safari & Mobile Safari)
# -> 44 テスト全合格 (~6.5s)
npm run test:e2e

# 3. ユニットテスト + E2E テストの一括実行
npm run test:all

# 4. 超高速 Lint (Oxlint + @nkzw/oxlint-config: 182 rules)
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
# プロダクションビルド & 単一HTML生成 (Rolldown / Oxc / esbuild)
npm run build

# サイズ・バジェット自動計測 (zlib gzip/brotli)
npm run size
```

---

## 5. 究極のリファクタリング & 極限最適化の実績

1. **Zero-Allocation クエリパーサー (`src/core/router.js`)**:
   - `split('&')` による中間配列生成を完全廃止し、インデックスポインタ走査（`indexOf`）による真のゼロ配列アロケーションを実現。
2. **Direct Property アクセス (`src/core/store.js`)**:
   - ゲッター関数のオーバーヘッドを排除し、モジュールシングルトンの直接プロパティ参照によりコールスタックをゼロ化。
3. **Direct Node Focus モーダル (`src/components/modal.js`)**:
   - `querySelector` による DOM ツリー探索を全廃し、VanJS で生成したノード参照を直接保持してフォーカス。タイマーリークもゼロ。
4. **Programmatic Dismiss トースト (`src/components/toast.js`)**:
   - 自動消去タイマーをカプセル化した `dismiss` 関数を返却し、画面遷移時のタイマーリークを防止。不要な `<span>` ラッパーもゼロ。
5. **Web-First Playwright E2E (`e2e/benchmark.spec.js`)**:
   - 静的スリープ（`waitForTimeout`）をゼロ化し、`expect(...).toPass()` による web-first assertion へ刷新。テスト時間を約1秒短縮。
