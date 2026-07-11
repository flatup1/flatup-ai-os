# flatup-ai-os — Claude Code Guide

**Project**: FLATUP GYM AI スタッフ「AIKA」の運用 OS  
**Language**: TypeScript / Node.js (tsx)  
**Owner**: flatupgym@gmail.com  
**Branch**: `claude/<feature-name>`

---

## Project Identity

AIKA は FLATUP GYM（千葉県成田市の格闘技ジム）の AI スタッフで、以下を**下書きする**役割を担います。
- LINE 返信 / 体験予約案内
- SNS 投稿（X/Typefully連携）/ 追客 / 口コミ依頼
- 動画マニュアル / スタッフ指導マニュアル
- 差別化原稿 / 日報 / リスクチェック

**⚠️ 運用原則**: 全て下書き。送信・投稿・請求・契約変更・規約判断は必ず人間オーナーが実行。

---

## 快速ガイド

### Setup
```bash
cp .env.example .env
# .env を編集して OPENROUTER_API_KEY を入れる
npm install
npm run list  # 利用可能なルートを表示
```

### Development
```bash
npm run dev -- line_reply "メッセージ"       # ドライラン（API キー未設定でもプレビュー可）
npm run test                               # typecheck + test:safety + test:pii + test:routes
npm run build                              # TypeScript コンパイル
```

### Available Routes
| Route | Purpose |
|-------|---------|
| `line_reply` | LINE/DM 返信下書き |
| `sns_post` | Instagram 投稿セット |
| `followup` | 体験者・見込み客への追客 |
| `review_request` | Google 口コミ依頼文 |
| `daily_manager` | オーナー向け朝会「今日やること」 |
| `risk_check` | 事案リスク判定 + 対応案 |
| `training_manual` | スタッフ指導マニュアル |
| `video_script` | 動画台本（撮影/編集向け） |
| `differentiation` | HP/LP 差別化原稿 |
| `uizin` | 初心者向けやさしい案内文 |
| `animal_reel` | 動物×格闘技のAI動画リール素材（Sora/Veo用プロンプト+IG投稿セット） |

動画の**全自動生成**（Seedance 2.0 / fal.ai）はルートではなく専用コマンド:
```bash
npm run reel -- "にゃん術" --count 3   # FAL_KEY 未設定なら DRY-RUN
```

---

## Directory Guide

```
src/
├── index.ts              # CLI エントリ（引数パース + ログ保存）
├── ai/
│   ├── client.ts         # Anthropic SDK（OpenRouter経由）
│   ├── prompts.ts        # AIKA システムプロンプト
│   └── router.ts         # ルートのマッピング
├── modules/              # 業務別 user prompt 生成（10 ルート）
│   ├── line_reply.ts
│   ├── sns_post.ts
│   ├── followup.ts
│   ├── risk_check.ts
│   └── ...
├── data/                 # FLATUP GYM の知識（キャッシュ対象）
│   ├── gym_profile.md
│   ├── pricing.md
│   ├── rules.md
│   ├── brand_voice.md
│   └── ...
├── safety/               # 受付・安全チェック
│   └── receptionist.ts
└── utils/
    ├── loadKnowledge.ts
    ├── sanitizePii.ts    # PII マスク（ログ保存時のみ）
    └── saveLog.ts

logs/                    # 出力の自動保存（route ごと）
docs/                    # ドキュメント（easy_start.md, owner_commands.md 参照）
tasks/                   # today.md / backlog.md / completed.md
```

---

## Key Technologies

| Item | Value |
|------|-------|
| API Gateway | OpenRouter (`https://openrouter.ai/api/v1`) |
| Model | `anthropic/claude-haiku-4-5` |
| Temperature | 0.4 （本番と揃える） |
| Dependencies | ❌ ゼロ（Node 18+ 標準 fetch のみ） |
| Tests | typecheck + 25 PII patterns + 15 routes |

---

## Claude Code Workflow

### /verify — Runtime Validation
Before committing, verify the change works end-to-end:
```bash
npm run typecheck  # TypeScript
npm run test       # All tests
npm run dev -- line_reply "初心者 OK?"  # Dry-run
```

### /code-review — Safety Checks
Use when modifying ai/, modules/, safety/:
```
/code-review --fix
```
Focus on: prompt injection risk, PII leak, business logic correctness.

### /loop — Recurring Tasks
Monitor logs or run periodic checks:
```
/loop 5m npm run test
```

### /run — Development Server
To start a web dev server (if applicable):
```
npm run dev -- [route] "[message]"
```

---

## Testing & Dry-Run

**Key**: API キー未設定時も **プレビュー動作**（コスト発生なし）

```bash
# Typecheck
npm run typecheck

# Test suite
npm run test                       # すべて

npm run test:safety                # AIKA システムプロンプト + 受付門番の回帰
npm run test:pii                   # 25 個の PII パターン
npm run test:routes                # 15 個のルート dry-run（OPENROUTER_API_KEY= で無API実行）

# ドライラン（プロンプトプレビュー）
npm run dev -- line_reply "体験したいのですが初心者でも大丈夫ですか？"
# → API キー未設定時は、プロンプトの最終形と推定トークン数を表示
```

---

## Environment Variables

| Variable | Default | Note |
|----------|---------|------|
| `OPENROUTER_API_KEY` | (required) | OpenRouter キー（本番運用時） |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | エンドポイント |
| `AIKA_MODEL` | `anthropic/claude-haiku-4-5` | 使用モデル |
| `AIKA_TEMPERATURE` | `0.4` | 本番と揃える |
| `AIKA_MAX_TOKENS` | `4096` | 出力トークン上限 |
| `AIKA_SANITIZE_PII` | `true` | ログ保存時 PII マスク |
| `AIKA_SANITIZE_NAMES` | `false` | 氏名+敬称もマスク（opt-in） |

---

## Documentation References

- **はじめて**: [docs/easy_start.md](docs/easy_start.md)
- **オーナーコマンド**: [docs/owner_commands.md](docs/owner_commands.md)
- **Typefully/X 連携**: [docs/typefully_x_ops.md](docs/typefully_x_ops.md)
- **Obsidian Vault 統合**: [docs/obsidian_vault_integration.md](docs/obsidian_vault_integration.md)
- **動物×格闘技リール量産**: [docs/animal_reels_factory.md](docs/animal_reels_factory.md)

---

## Common Patterns

### PII サニタイズ（ログ保存時のみ）
- 電話: `090-1234-5678` → `090-****-5678`
- Email: `tanaka@example.com` → `t****@example.com`
- 信用: `4111-1111-1111-1234` → `****-****-****-1234`

### エラーハンドリング
API エラー (429/5xx/接続エラー) → 指数バックオフで最大 3 回再試行。400 系は即時 throw。

### ログ集計
```bash
# 直近 10 件の概要
tail -10 logs/usage.jsonl | jq '{ts, route, input_tokens, output_tokens, duration_ms}'

# route 別合計出力トークン
jq -s 'group_by(.route) | map({route: .[0].route, total: map(.output_tokens) | add})' logs/usage.jsonl

# コスト試算 (Haiku: $1/$5 per 1M)
jq -s 'map(.input_tokens * 1 + .output_tokens * 5) | add / 1000000' logs/usage.jsonl
```

---

## When to Use Claude Code Skills

| Skill | Use When |
|-------|----------|
| `/verify` | Before commit: typecheck + test + dry-run |
| `/code-review` | After ai/, modules/, safety/ changes → safety checks |
| `/run` | Need to see live output of a route |
| `/loop` | Monitor logs or run periodic lint |

---

## Next Deployment Checklist

- [ ] `npm run test` passes (typecheck + PII + routes)
- [ ] `npm run dev -- [route]` dry-run shows expected output
- [ ] `.env` has valid `OPENROUTER_API_KEY` (production)
- [ ] Commit message: route/module name + change description
- [ ] Final review by human before sending/posting to users

---

**Last Updated**: 2026-07-07  
**Maintainer**: flatupgym@gmail.com
