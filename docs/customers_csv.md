# customers.csv 運用ガイド

引き継ぎ正本 §7「LINE公式 無料プラン対応版」のデータ構造を実装したもの。

## なぜ必要か

LINE公式アカウント（無料プラン）は **1人につきタグを優先1個** しか付けられない。
一方で運用上は「キッズ」「レディース」「紹介候補」など複数の分類を持ちたい。
そこで **customers.csv 側で複数分類を持ち、LINEには優先1タグだけを反映** する。

## ファイルの場所

- `data/customers.template.csv` … 列定義＋ダミー例（Git管理下・サンプルのみ）
- `data/customers.csv` … 実データ。**PII のため `.gitignore` 済み。コミットしない。**
  - テンプレをコピーして作る: `cp data/customers.template.csv data/customers.csv`

## 列の意味

| 列 | 値の例 | 説明 |
|---|---|---|
| `id` | m-001 | 会員/見込みの識別子（本名は入れない） |
| `nickname` | たろう | 呼び名。本名フルネームは避ける |
| `member_type` | kids / ladies / men / (空) | 種別。空は見込み客 |
| `funnel_stage` | 新規 / 体験予約済み / 体験済み未入会 / 会員 / 休眠 / 退会 | ファネル段階 |
| `last_visit` | 2026-07-05 | 最終来館日（YYYY-MM-DD）。会員の休眠判定に使う |
| `owner_review` | yes / no | 要オーナー確認フラグ（退会・違約金・クレーム・持病など） |
| `review_candidate` | yes / no | 口コミ候補フラグ |
| `line_tag` | 体験予約済み | **今LINEに付いているタグ**（人間が最後に付けた値） |
| `sub_tags` | キッズ;紹介候補 | 補助分類。`;` 区切り。LINEには反映しない |
| `notes` | 土曜13時希望 | 自由メモ |

## LINE優先タグの優先順位（1人1タグ）

`src/modules/customers.ts` の `deriveLineTag()` が、各行から「本来付くべきタグ」を機械的に決める。
上から順に、最初に当てはまったものを採用する。

1. **要オーナー確認** … `owner_review = yes`
2. **体験予約済み** … `funnel_stage = 体験予約済み`
3. **体験済み未入会** … `funnel_stage = 体験済み未入会`
4. **2週間来ていない** … `funnel_stage = 会員` かつ `last_visit` が14日以上前
5. **口コミ候補** … `review_candidate = yes`
6. （どれにも当てはまらなければタグなし）

## 「タグ付け替えが必要な人」

`findRetagNeeded()` は、`line_tag`（今LINEに付いている値）と `deriveLineTag()`（本来のタグ）が
食い違う人を一覧にする。これを毎朝レポートに載せる想定。

**重要（AI安全ルール）**: このモジュールは判定して一覧を出すだけ。
実際のLINEタグの付け替えは、人間がスマホで行う。AIはLINEを操作しない。

## テスト

```
npm run test:customers
```

判定ロジックとテンプレCSVの整合（付け替え対象がダミー例で3件になること）を検証する。
`npm test` にも組み込み済み。

## 次の実装候補（未着手）

- 毎朝レポート（`daily_manager`）に `findRetagNeeded()` の結果を差し込む
- `funnel_stage` 別の件数集計（会員100人までの進捗）
