# Fable タスク割り当て表（設計 + 担当モデル振り分け）

**作成日**: 2026-07-11
**設計者**: Fable（最上位モデル。設計・レビュー・エスカレーション判断を担当）
**対象**: flatup1/flatup のオープン Issue 全 6 件（openqlow / flatup-ai-os はオープン Issue なし）

---

## 運用ルール（このワークフローの憲法）

1. **Fable の仕事は「設計・レビュー・判断」だけ**。実装の大量トークン（ファイル探索・diff・テストループ）は下位モデルに流す。
2. **担当の初期割り当て基準**:
   - **Sonnet**: 仕様が明文化済み・変更範囲が閉じている・既存テストで検証できるタスク
   - **Opus**: 本番挙動に直結する / 複数リポジトリ横断 / 並行性・状態管理などの設計判断を実装中に迫られるタスク
   - **Fable**: セキュリティ判断・誤検知の切り分け・destructive 操作の提案書作成
   - **人間（JIN）**: VPS 実機操作・LINE 実機確認・承認ゲート（削除 / force-push / デプロイ / 顧客影響の最終判断）
3. **レビュー**: Opus / Sonnet の PR は必ず Fable がレビュー。合格基準は各 Issue の受け入れ基準。
4. **エスカレーション**: レビューで品質不足が 2 回続いたら担当を 1 段上げて再実行（Sonnet → Opus → Fable）。Fable でも解けない・判断が割れるものは人間へ。
5. **PR は小さく保つ**（1 PR = 1 サブタスク）。レビューコストが下がり、エスカレーション時の作り直しトークンも最小になる。

---

## 割り当てサマリ

| Issue | タイトル | 優先度 | 担当（実装） | 検収 | 依存 |
|---|---|---|---|---|---|
| #3 | user_state / conversation_history の永続化 | P2 | **Opus** | 人間（実機再起動確認） | なし（最優先） |
| #8-a | プロンプトルール追加（クラス推薦≤2 / punt制限 / 絵文字 / フレーズ多様化） | HIGH | **Sonnet** | Fable レビュー + 人間 A/B | なし |
| #8-b | 共通プロンプト正本化（Python / TS 両系統の統合） | HIGH | **Opus** | Fable レビュー | #8-a 完了後 |
| #8-c | 同一 webhook event への二重応答の排他制御 | HIGH | **Opus** | 人間（LINE 実機） | #3 の state store |
| #8-d | 「AIKA に投げるボタン」経路の実機確認 | HIGH | **人間** | — | なし（今すぐ可能） |
| #4 | 手動モード改善（/manual_off・キュー化） | P3 | **Sonnet** | Fable レビュー + 人間実機 | #3 完了後 |
| #5 | 監視体制（health-check / 通知 / 日次KPI） | P4 | **Sonnet** | 人間（env 設定） | なし |
| #6 | Git 履歴の秘密候補 48 件棚卸し | security | **Fable** | 人間（処置の最終判断） | なし |
| #7 | requirements.txt 本番同期 | maint | **人間 → Sonnet** | Fable レビュー | 人間の pip freeze 待ち |

---

## 各 Issue の設計

### #3 state 永続化 — 担当: Opus（最優先で着手）

**設計判断（Fable 決定）: SQLite を採用。Redis は不採用。**

- 理由: VPS 上の単一 Flask プロセスに Redis サービスを追加するのは運用負荷過剰。SQLite（WAL モード）なら追加デーモンなし・バックアップは 1 ファイルコピー・依存は標準ライブラリのみ。
- gunicorn を複数 worker で動かす場合も WAL + busy_timeout で足りる規模（ジム 1 店舗のトラフィック）。

**実装方針**:
- 新規 `6_システム/code/lib/state_store.py`: `get_state(user_id)` / `set_state(user_id, dict)` / `append_history(user_id, role, text)` / `get_history(user_id, days=7)` の 4 API に閉じる
- `line_webhook.py` のインメモリ dict 参照をこの 4 API に置換（ロジック変更なし、置換のみ）
- history は 7 日で自動 purge（起動時 + 日次）
- DB パスは env（`AIKA_STATE_DB`）、Rule 8 準拠
- `/health` にレイテンシ計測を追加して移行前後を比較

**Opus に任せる理由**: 本番 Bot の全会話状態を握る中核。置換漏れ 1 箇所が顧客対応の文脈喪失に直結し、並行アクセスの判断を実装中に迫られる。

---

### #8 AIKA 返信品質 — 4 分割（8-a〜8-d）

前提: datetime 注入は完了済み（flatup-ai-os `e354966`、line_webhook.py は元から注入済み）。残作業を独立 PR に分割する。

**8-a プロンプトルール追加 — 担当: Sonnet**
- 対象: `line_webhook.py` の SYSTEM_PROMPT と `flatup-ai-os/src/ai/prompts.ts` の両方に同一ルールを追記
  1. クラス推薦は最大 2 件、相手の目的・属性で絞る
  2. 担当者 punt は契約・医療・例外・料金トラブルのみ（data で確認できる情報は punt 禁止）
  3. 絵文字 0〜1 個。強調記号（‼️ !! ♡ 等）も絵文字としてカウント。連続レスで同じ絵文字禁止
  4. 出だしフレーズ 5 パターン以上を例示し、直前と同じ出だしを禁止
- 検証: flatup-ai-os は `npm run test:safety` に回帰ケース追加。両系統の DRY-RUN 出力を Fable がレビューし、人間がサンプル A/B で「FLATUP らしさ」を確認
- Sonnet で足りる理由: 変更はプロンプト文言 + テスト追加に閉じており、受け入れ基準が明文化済み

**8-b 共通プロンプト正本化 — 担当: Opus**
- 設計: ルール部分だけを共通 Markdown 正本（vault `6_システム/code/prompts/aika_rules.md`）に切り出し、Python は直接読み込み、TypeScript 側は同内容のコピーを保持して **CI でチェックサム照合するテスト**を追加（ランタイムでヴォールトのパスに依存させない — Desktop 環境とVPS 環境でパスが違うため）
- 8-a のルールが両系統で確定してから着手（先にやると統合対象が動く）
- Opus の理由: 2 リポジトリ横断 + キャッシュ breakpoint を壊さない配置判断が必要

**8-c 二重応答の排他制御 — 担当: Opus**
- 設計: LINE webhook の `event.message.id`（または replyToken）を #3 の SQLite に記録し、処理済み event は即 return（冪等化）。手動モードフラグも同 DB に置き、wait template 送出と AIKA 自動応答が同一 event で両方走らないよう、応答パスの入口を 1 関数に集約
- #3 の state store が前提。**顧客信頼を直接毀損している HIGH バグ**なので #3 完了後すぐ着手
- 検証: 同一 event の二重 POST をローカルで再現し、応答が 1 回だけであることをテスト化。最終確認は人間が LINE 実機で

**8-d ボタン経路の実機確認 — 担当: 人間（JIN）**
- LINE OA Manager で「AIKA に投げるボタン」を 2〜3 回押し、曜日付き日付が正しいか確認するだけ。正しければ経路特定が完了し #8 の前提が固まる。**AI には代替不可能・5 分で終わる・今すぐ可能**

---

### #4 手動モード改善 — 担当: Sonnet（#3 完了後）

- #3 の state store と #8-c の入口集約が済めば、残りは「`/manual_on` / `/manual_off` のフラグ読み書き + 手動中の問い合わせを queue テーブルに記録 + JIN が読み出すコマンド」だけの定型実装
- 検証: フラグの on/off とキュー読み出しのユニットテスト + 人間の LINE 実機テスト

### #5 監視体制 — 担当: Sonnet（依存なし・並行着手可）

- 設計: GitHub Actions の cron（15 分毎）で `/health` を ping、失敗時は LINE push で JIN に通知（Slack 新規導入より既存 LINE 経路を再利用）。日次 23 時の KPI 集計も同じ Actions から `/KPI` ロジックを叩く
- URL / トークンは全て GitHub Secrets（Rule 8 準拠）
- 人間の担当: Secrets の登録と通知先の実機確認

### #6 秘密候補 48 件の棚卸し — 担当: Fable（実装ではなく判断業務)

- `git log -p` + パターン検出で 48 件を再現し、1 件ずつ「受容 / ID 変更要請 / filter-repo / 誤検知」を判定した表を作成
- **下位モデルに出さない理由**: 誤検知の切り分けと「compromise の証拠が無いから受容」という判断はレビューで担保できない種類の仕事。間違えたときの被害が非対称
- filter-repo は destructive（force-push）なので、判定表を人間が承認してから別 Issue で実施

### #7 requirements.txt 同期 — 担当: 人間 → Sonnet

- **人間が先**: 本番 VPS で `pip freeze > freeze_prod.txt` を取得（AI は VPS に入れない）
- その後 Sonnet: import 文の棚卸しと突き合わせ、`~=`（パッチ許容・マイナー固定）で pinning、ローカル venv で `pip install -r` 検証
- freeze が届くまでブロック。人間タスクの中では 8-d の次に軽い

---

## 着手順（推奨）

```
今すぐ並行:  #3(Opus)  #8-a(Sonnet)  #5(Sonnet)  #6(Fable)  #8-d(人間)  #7前半(人間)
#3 完了後:   #8-c(Opus) → #4(Sonnet)
#8-a 完了後: #8-b(Opus)
```

全 PR は Fable レビューを通過後、人間が merge（Rule 1: 最終判断は人間）。
