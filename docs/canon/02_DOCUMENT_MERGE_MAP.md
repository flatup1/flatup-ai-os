# 02_DOCUMENT_MERGE_MAP — 資料の分類と統合先マップ

作成: 2026-07-19（Fable 5正本化セッション）
状態: **提案のみ。削除・移動・書き換えは一切実行していない。**

分類の意味:

| 記号 | 分類 | 意味 |
|---|---|---|
| ◎ | **正本** | この論点の答えはここだけを見る。更新はここを直す |
| ○ | **補助資料** | 正本を読みやすくする説明・手順。事実は持たない（持っていたら剥がす） |
| △ | **統合後にアーカイブ候補** | 内容は正本へ吸収済み／吸収可能。JIN承認後に `5_アーカイブ/` へ |
| ？ | **内容確認が必要** | 古い値・二重正本・実態不明。触る前にJIN確認 |

---

## 1. 事実（料金・スケジュール・住所・クラス）

| 資料 | 分類 | 統合先・扱い |
|---|---|---|
| `openqlow/src/shared/canon.ts` | ◎ | **事実の唯一の正本**。数値変更はここ1か所 |
| `openqlow/port/aika/flatup_canon.ts` | ○ | canon.tsの配布用複製。canon.ts更新時に同一PRで追随（現状は同期済み） |
| `flatup-ai-os/src/data/pricing.md` | ？ | ビジター料金の単位が canon.ts と食い違う（01表 A-5）。確定後に canon.ts へ寄せる |
| `flatup-ai-os/src/data/gym_profile.md` / `faq.md` / `trial_flow.md` | ○ | 案内文の骨格。数値は canon.ts 準拠に保つ |
| `flatup-ai-os/src/data/line_flows_100.md` | ○ | 100パターンの言い回し集。現時点で最も新しい値を持つ（14:30・24時間セルフ）。**文例の供給源として維持** |
| `openqlow/knowledge/wiki/flatup-canonical-faq.md` | ？ | 「単一正本」を自称しながらレディース14:00・営業時間の旧表現が残る（01表 A-2/A-3）。**自称正本の撤回 → ○へ降格、または△** |

## 2. 退会・休会・会費

| 資料 | 分類 | 統合先・扱い |
|---|---|---|
| `flatup-ai-os/src/data/cancellation_rules.md` | ◎（推奨） | 届出文面・入会時チェック・要確認一覧を持つ**詳細正本**。§11の空欄6項目をJINが埋めれば確定 |
| `openqlow/src/shared/cancellation_rules.md` | ○（推奨） | AIKA向け要約。冒頭に「詳細正本は flatup-ai-os 版」と明記して従属させる（01表 A-4・**JIN確認要**） |
| `openqlow/src/shared/canon.ts` の `cancellation` / `suspension` | ○ | 1行要約。詳細は上記へリンク済み（現状の書き方でよい） |

## 3. 憲法・役割・境界

| 資料 | 分類 | 統合先・扱い |
|---|---|---|
| `flatup-ai-os/docs/canon/00_FLATUP_AI_OS_CANON.md`（本セッション作成） | ◎（承認後） | 役割・承認ゲート・優先順位の**上位正本**。事実は持たない |
| `flatup/00_CORE/AIKA_OS_CONSTITUTION_v1.md` | ？ | 承認ゲート（§8 Lv1-3）は今も有効で価値が高い。ただし §16 のopenQLOW記述が実装と矛盾（01表 C-1）、AIKAの定義が対JIN秘書寄り（C-2）。**該当章のみ改訂提案 → 残りは◎** |
| `flatup/1_AIKA人格_本番.md` | ◎（人格） | 本番Botの人格正本。ただし**時刻2件が古い**（A-1/A-3）。事実部分は canon.ts 参照に置き換えるのが理想 |
| `openqlow/src/safety/forbidden_actions.ts` | ◎ | openQLOWの禁止行為の**実装レベル正本**。文書より強い |
| `openqlow/knowledge/wiki/aika-vs-openqlow.md` / `forbidden-actions.md` / `openqlow-safety-rules.md` | ○ | 境界の解説。実装とズレたら実装に合わせる |
| `flatup/6_システム/FLATUPGYM_AI_OPENQLOW_憲法.md` | ？ | 本セッションでは未精査。00_CANONと重複する可能性 → 次回確認 |
| `flatup/00_CORE/FLATUPGYM_AI_HOME.md` | ◎ | Vaultの入口。00_CANONへのリンクを1行追加する提案 |
| `flatup/6_システム/FLATUPGYM_AI_正本マップ.md` | ◎ | Vault内の地図。今回の canon/ ディレクトリを追記する提案 |

## 4. 顧客対応（AIKA・守り）

| 資料 | 分類 | 統合先・扱い |
|---|---|---|
| `docs/canon/10_AIKA_SAFETY_CASEBOOK_50.md`（本セッション作成） | ◎（承認後） | 事故防止の**事例正本**。50件 |
| `docs/canon/11_AIKA_SAFE_REPLY_TEMPLATES.md`（本セッション作成） | ○ | 10のテンプレート。文面の供給源 |
| `docs/canon/12_AIKA_REGRESSION_TEST_CASES.jsonl`（本セッション作成） | ○ | 将来のBot回帰テスト入力（架空データのみ） |
| `flatup-ai-os/src/data/templates.md` | ○ | 既存テンプレ。11と重複する箇所は11へ寄せる |
| `flatup-ai-os/src/safety/receptionist.ts` / `openqlow/src/aika/receptionist.ts` | ◎ | 受付ゲートの実装正本 |
| `flatup/01_SKILLS_CUSTOMER/**` | ○ | 成約率ガイド等。背景知識として維持 |

## 5. 売上・経営（openQLOW・攻め）

| 資料 | 分類 | 統合先・扱い |
|---|---|---|
| `openqlow/docs/canon/20〜23`（本セッション作成） | ◎（承認後） | 週次運用の正本 |
| `flatup-ai-os/src/data/canon_2026.md` | ◎ | 2026年の戦略・目標（会員100人）。20のスコアボードはこの目標に紐づく |
| `openqlow/docs/REFERRAL_PLAYBOOK.md` | ○ | 紹介の具体策。23の実験に供給 |
| `flatup-ai-os/docs/handoff/FLATUP_100人作戦基地_引き継ぎ正本_2026-07-07.md` | ？ | 20〜23と目的が重なる可能性。次回に突き合わせて統合先を決める |

## 6. 引き継ぎ・状態（時限資料）

| 資料 | 分類 | 統合先・扱い |
|---|---|---|
| `openqlow/docs/HANDOFF_*.md`（10本以上） | △ | 日付つきの一時文書。役目を終えたものは順次アーカイブ候補。**ただし今回は精査していないため一括処理は禁止** |
| `openqlow/docs/CODEX_*.md` | △ | 同上 |
| `openqlow/docs/STATUS_AND_GAPS.md` | ◎ | 現在の残作業（G7b）の正本。生きている |
| `flatup-ai-os/docs/handoff/HANDOFF_NEXT_AI.md` | ○ | 03_NEXT_AI_START_PROMPT.md と役割が重なる → 03へリンクを追加する提案 |
| `flatup/5_アーカイブ/**` | △ | 既にアーカイブ。触らない |
| `flatup/99_REFERENCE/**` | ○ | 背景資料。現行判断に使わない（Vault CLAUDE.md §3のとおり） |

---

## 7. 実行してよい順（すべてJIN承認後）

1. **A-1/A-3の修正**（`1_AIKA人格_本番.md` の時刻2件）— お客様への誤案内を止める。最優先。低リスク。
2. **A-2の修正**（wiki `flatup-canonical-faq.md` の自称正本を撤回、値を canon.ts に合わせる）
3. **A-4の従属明記**（`openqlow/src/shared/cancellation_rules.md` 冒頭に1行）— JINが詳細正本を決めた後
4. **00〜03、10〜12、20〜23の正本昇格**（本ディレクトリのドラフトを承認）
5. **Vault側のリンク追加**（`FLATUPGYM_AI_HOME.md` / `正本マップ.md` に canon/ を追記）
6. **C-1/C-2の憲法改訂**（影響範囲が広い。単独のPRで）
7. **G7b の履歴書き換え**（不可逆。手順書に従い単独で）

## 8. いま統合しない方がよいもの

- `openqlow/docs/HANDOFF_*` の一括アーカイブ — 生きている手順が混在している可能性がある。1本ずつ確認してから。
- `flatup/5_アーカイブ/` と `99_REFERENCE/` — 現行判断に使わないので、統合作業のコストに見合わない。
- 動画・広告・アニメ関連資産（`animation-studio/`, `girl-power-op/`, `anime_ad`）— 今回のスコープ外。正本化とは別軸。
- 実装コード（`src/**/*.ts`）の構造変更 — 本セッションは文書の正本化のみ。テストが緑の状態を壊さない。
