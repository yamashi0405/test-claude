# CLAUDE.md

このファイルは、リポジトリで作業する Claude Code (claude.ai/code) へのガイダンスを提供します。

## アプリの起動

ビルド不要。`index.html` をブラウザで直接開く（`file://` プロトコルで動作）。

## アーキテクチャ

フレームワーク・外部依存なしのシングルページアプリ。3ファイル構成：

- `index.html` — 3つの `<section id="tab-*">` パネルと固定ボトムナビを持つ静的シェル
- `style.css` — ダークテーマ、モバイルファースト（max-width 480px）、BEM風クラス命名
- `app.js` — すべてのロジックをプレーンJS（`'use strict'`、モジュールなし）で実装

### タブシステム

`.tab-panel` と `.tab-btn` に `.active` を付け外しすることでタブを切り替える。`switchTab(name)` がこれを担い、切り替え時に対応する描画関数を呼び出す。タブ名: `today`、`history`、`settings`。

### データ層（localStorage）

`KEYS` 定数で定義された3つのキー：

| キー | 値 |
|------|----|
| `smoking_records` | JSONオブジェクト: `{ "YYYY-MM-DD": ["HH:MM:SS", ...] }` |
| `smoking_price_per_pack` | 文字列整数（デフォルト 570） |
| `smoking_cigs_per_pack` | 文字列整数（デフォルト 20） |

読み込みはすべて `loadRecords()` / `getPricePerPack()` / `getCigsPerPack()` 経由。書き込みはすべて `saveRecords()` または直接の `localStorage.setItem` 経由。

### 費用計算

`pricePerCig()` = 1箱の値段 ÷ 1箱の本数。`calcCost(count)` は最も近い円に丸める。設定変更後は今日タブが即座に再描画されるため費用は常に最新状態を保つ。

### カレンダー状態

`calYear` と `calMonth`（0始まり）はモジュールレベルの `let` 変数で、現在月に初期化される。`renderCalendar()` がこれらを参照してグリッドを構築する。ナビゲーションは `calPrev()` / `calNext()` で行い、現在月では次へボタンが無効になる。
