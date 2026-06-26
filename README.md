# FLATUP AI OS

地図: この箱はAIKAのお客様対応・LLM下書き口です。
地図: 事実の正本は `openqlow/src/shared/canon.ts` で、直書きしません。
地図: 触る前に `openqlow/src/shared/canon.ts` と `src/safety/receptionist.ts` を読みます。

FLATUP GYM を AI スタッフ「AIKA」と一緒に回すための運用 OS。
本番 LINE Bot と同じく **OpenRouter 経由 / Claude Haiku 4.5** で動く TypeScript プロジェクトです（依存ゼロ・fetch 直叩き）。

AIKA は LINE 返信 / 体験予約案内 / SNS 投稿 / 追客 / 口コミ依頼 /
動画マニュアル / スタッフ指導マニュアル / 差別化原稿 / 日報 / リスクチェック を
**下書きする**役割を担います。
**最終的な送信・投稿・請求・契約変更・規約判断は必ず人間オーナーが行います。**

X 投稿は Typefully と連携して下書き・予約管理します。運用ルールは
[docs/typefully_x_ops.md](docs/typefully_x_ops.md) を参照してください。

Obsidian Vaultとの統合ルールは [docs/obsidian_vault_integration.md](docs/obsidian_vault_integration.md) を参照してください。
FLATUPGYM AI全体の正本は `/Users/jin/Documents/Obsidian Vault/00_CORE/FLATUPGYM_AI_HOME.md` です。

## コンセプト
- ジム名: FLATUP GYM
- 所在地: 千葉県成田市土屋 516-4 2F
- ブランドライン: 世界一やさしい格闘技ジム
- 重点対象: 初心者・女性・キッズ・保護者・運動不足の大人
- 運用原則: 安心感、安全第一、押し売りしない、褒めて伸ばす

## セットアップ

オーナー向けのやさしい説明は [docs/easy_start.md](docs/easy_start.md)、
コマンドだけ見たいときは [docs/owner_commands.md](docs/owner_commands.md) を見てください。

```bash
cp .env.example .env
# .env を編集して OPENROUTER_API_KEY を入れる(本番と同じキーを共有可)
npm install
npm run list                 # 利用可能なルートを表示
npm run dev -- line_reply "体験したいのですが初心者でも大丈夫ですか？"
```

API キー未設定でも、生成プロンプトの **dry-run プレビュー** が表示されます（コスト発生なし）。
本番運用に入る前に各ルートの出力イメージを確認できます。

## ルート一覧

| ルート | 用途 |
|--------|------|
| `line_reply` | LINE / DM 返信下書き |
| `sns_post` | Instagram 投稿セット（本文・短文・ストーリー・リール台本・タグ・LINE 配信文） |
| `followup` | 体験者・見込み客への追客文 |
| `review_request` | Google 口コミ依頼文 |
| `daily_manager` | オーナー向け朝会用「今日やること」 |
| `risk_check` | 事案のリスク判定 + 即対応案 + 文章下書き |
| `training_manual` | スタッフ指導マニュアル |
| `video_script` | 動画マニュアル台本（撮影 / 編集に渡せる粒度） |
| `differentiation` | HP / LP 用差別化原稿 |
| `uizin` | 初心者向けのやさしい案内文 |

```bash
npm run dev -- sns_post        "初心者歓迎の体験紹介投稿"
npm run dev -- followup        "先週体験した30代女性、まだ返信なし"
npm run dev -- review_request  "入会2ヶ月の男性。ミット打ちで自信がついた様子"
npm run dev -- daily_manager   "今日18:00から体験3名、SNS投稿予定、月末請求準備"
npm run dev -- risk_check      "男性会員から女性会員への私的な声かけが多い"
npm run dev -- video_script    "体験トレーニング編"
npm run dev -- training_manual "ミットの持ち方"
npm run dev -- differentiation "ガチスパー強制なし"
npm run dev -- uizin           "格闘技未経験のお母さん向けKidsクラス紹介"
```

## Typefully / X 投稿

ローカルPCでは Typefully API の接続確認済みです。

- 設定ファイル: `/Users/jin/.config/typefully/config.json`
- default social set ID: `307036`
- username: `flatupgym`
- APIキー本体はGit・Obsidian・READMEに書かない

AIKA/Codex は下書き作成まで。公開・予約の最終確定は人間オーナーがTypefully画面で行います。

## アーキテクチャ

```
src/
├── index.ts            # CLIエントリ。引数パース + saveLog
├── ai/
│   ├── client.ts       # Anthropic SDK 呼び出し（プロンプトキャッシュ + adaptive thinking）
│   ├── prompts.ts      # AIKA システムプロンプト組み立て（不変ペルソナ + 固定知識 + タスク区分）
│   └── router.ts       # ルート名 → モジュール のルーティング
├── modules/            # 業務別の user prompt 生成
│   ├── line_reply.ts
│   ├── sns_post.ts
│   ├── followup.ts
│   ├── review_request.ts
│   ├── daily_manager.ts
│   ├── risk_check.ts
│   ├── training_manual.ts
│   ├── video_script.ts
│   ├── differentiation.ts
│   └── uizin.ts
├── data/               # FLATUP GYM の固定知識（キャッシュされる）
│   ├── gym_profile.md
│   ├── pricing.md
│   ├── rules.md
│   ├── brand_voice.md
│   ├── trial_flow.md
│   ├── sparring_policy.md
│   ├── differentiation.md
│   ├── visual_brand.md
│   ├── training_manual.md
│   ├── templates.md
│   └── faq.md
└── utils/
    ├── loadKnowledge.ts
    └── saveLog.ts

logs/                   # 出力の自動保存先（route ごとにディレクトリ分け）
tasks/                  # today.md / backlog.md / completed.md
```

## スタック

本番 LINE Bot (`/root/line_webhook.py`) と完全に同じスタックで動きます:

- **API ゲートウェイ**: OpenRouter (`https://openrouter.ai/api/v1/chat/completions`)
- **モデル**: `anthropic/claude-haiku-4-5` (Haiku 4.5)
- **温度**: 0.4
- **thinking**: 未使用(Haiku は十分に賢く、用途には不要)
- **依存**: なし(Node 18+ の標準 `fetch` を直叩き)

## 最適化ポイント
- **ドライラン**: API キー未設定時はプロンプトのプレビューを返すだけ。
  メッセージ設計の検証時にコストを発生させません。
- **例外ハンドリング + リトライ**: 429 / 5xx / 529 / 接続エラー / タイムアウトは指数バックオフで最大 3 回再試行。
  400 系は即時 throw。エラー詳細を stderr に吐くので原因追跡できます。
- **usage ログ**: 1 リクエスト = 1 行で `logs/usage.jsonl` に追記。
  prompt/completion トークン・所要時間・リトライ回数を後から集計できます。

### usage ログの集計例
```bash
# 直近 10 件の概要
tail -10 logs/usage.jsonl | jq '{ts, route, input_tokens, output_tokens, duration_ms, retry_count}'

# route 別の合計出力トークン
jq -s 'group_by(.route) | map({route: .[0].route, total_output: map(.output_tokens) | add})' logs/usage.jsonl

# モデル別コスト試算(Haiku 4.5: $1/$5 per 1M)
jq -s 'map(.input_tokens * 1 + .output_tokens * 5) | add / 1000000' logs/usage.jsonl
```

## 環境変数

| 変数 | 説明 |
|------|------|
| `OPENROUTER_API_KEY` | OpenRouter API キー(必須・本番運用時) |
| `OPENROUTER_BASE_URL` | エンドポイント(既定: `https://openrouter.ai/api/v1`) |
| `OPENROUTER_REFERER` | OpenRouter アトリビューション(既定: `https://line.flatupnarita.jp`) |
| `OPENROUTER_TITLE` | OpenRouter アトリビューション(既定: `FLATUP AI OS`) |
| `AIKA_MODEL` | 使用モデル(既定: `anthropic/claude-haiku-4-5`) |
| `AIKA_TEMPERATURE` | サンプリング温度(既定 0.4 — 本番と揃える) |
| `AIKA_MAX_TOKENS` | 出力トークン上限(既定 4096) |
| `AIKA_LOG_OUTPUT` | `false` にすると `logs/` への保存を無効化 |
| `AIKA_SANITIZE_PII` | `false` にすると PII マスクを無効化(既定 true) |
| `AIKA_SANITIZE_NAMES` | `true` にすると氏名+敬称もマスク(誤検知あり、opt-in) |

Typefully APIキーは `.env` ではなく、`/Users/jin/.config/typefully/config.json` に保存します。
Git管理されるファイルには書きません。

## PII サニタイズ

本番 LINE Bot (`line_webhook.py`) と同じ「ログ保存時のみ部分マスク」をデフォルトに揃えています。

### 既定の挙動
- **AI 投入前**: マスクしない(AIKA は元の文脈で判断できる)
- **画面出力**: マスクしない(オーナーがレビューしやすいため)
- **ログ保存前**: 部分マスク(本番 `mask_pii()` 互換)
  - `090-1234-5678` → `090-****-5678`
  - `tanaka@example.com` → `t****@example.com`
  - `4111-1111-1111-1234` → `****-****-****-1234`(本番未対応のクレカも拾う)
  - `1234-5678-9012` → `****-****-9012`(本番未対応のマイナンバー)
  - `+81-90-1234-5678` → `[phone-intl]`(国際表記は redact に倒す)

### モード切替(`.env`)
- `AIKA_SANITIZE_BEFORE_AI=true` → AI 投入前もマスクする(より安全寄り、完全消去)
- `AIKA_PII_STYLE=redact` → ログも `[phone]` / `[email]` 形式に完全消去
- `AIKA_SANITIZE_PII=false` → 全部オフ(デバッグ用)
- `AIKA_SANITIZE_NAMES=true` → 「田中さん」「鈴木様」もマスク(opt-in、誤検知あり)

## テスト

```bash
npm run test         # typecheck + PII + routes すべて
npm run test:safety  # openQLOW正本 + 受付門番の回帰
npm run test:pii     # PII パターン回帰 (25 ケース)
npm run test:routes  # 全 10 ルート dry-run + OpenRouter/モデル検証 (15 ケース)
```

`test:routes` は **実 API を絶対に叩かない**よう `OPENROUTER_API_KEY=` で起動します。
モデル ID やエンドポイントが想定外に変わると落ちるので、`client.ts` を弄った時の安全網になります。

## 運用ルール（必読）
- AIKA の出力はすべて **下書き**。
- 送信・投稿・請求・契約変更・クレーム返信・規約判断は必ず人間オーナーが確認してから実行。
- 個人情報・会員氏名は出力に含めない方針(モジュールも user prompt 側で除外している)。
- 差別化原稿は「他ジムを直接悪く言わない」ルールを徹底。
- スパーリング指導は **初心者にいきなり強い相手をつけない** を全資料で前提とする。

## 次のロードマップ
- `data/*.md` を実運用ベースで更新する仕組み(SOP)
- LINE Webhook と連携した半自動下書きキュー
- 動画台本 → 撮影 → 編集 までを管理するボード
- リスク事案のテンプレ集(`logs/risks/` を蓄積し AIKA に学習させる)
