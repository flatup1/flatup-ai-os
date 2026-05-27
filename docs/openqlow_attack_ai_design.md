# OPENQLOW Attack AI Design

作成日: 2026-05-17

## 目的

OPENQLOWは、FLATUP GYMのYouTube/SNS集客を進めるための「攻めのAI」です。

既存のFLATUP AI OS / AIKAは、LINE返信、体験案内、リスクチェック、日報、下書きなどの守りを担当します。OPENQLOWは、YouTubeチャンネル運用、短尺動画展開、SNS投稿案、LINE承認、投稿予約、反応分析を担当します。

最終形はClawX上で動く承認付き下書き生成システムです。ただし初期実装は、勝ちコンテンツの量産と安全な承認フローを優先します。

OPENQLOWは、SNSへ直接投稿するシステムではありません。営業の代理として企画、下書き、承認依頼、下書き保存までを行い、最終公開は人間が判断します。

## 基本方針

OPENQLOWは最初から完全自動投稿を狙いません。

理由は、YouTube、Instagram、TikTok、X、LINE VOOMを一気に接続すると、API制限、ログイン制限、規約変更、誤投稿、アカウント制限、個人情報・会員映り込みリスクが同時に増えるためです。

そのため、設計思想は本格型、実装順は最小勝ち筋型にします。

```text
Phase 1:
企画、台本、SNS展開、LINE承認、X下書き、Obsidianログ

Phase 2:
YouTube投稿下書き、Shorts用メタデータ生成

Phase 3:
Instagram、TikTok、LINE VOOM投稿補助

Phase 4:
反応分析、勝ちパターン抽出、翌週企画の自動改善

Phase 5:
ClawX常駐エージェント化を強化
```

## 実行環境

初期環境はJinさんのMacローカルです。

```text
Jin's Mac
  ├─ ClawX
  │   └─ OPENQLOW agents
  ├─ flatup-ai-os
  ├─ Obsidian Vault
  ├─ Typefully config
  └─ OPENQLOW専用LINE公式アカウント / Webhook
```

Macローカルで始める理由は、撮影素材、Obsidian Vault、既存AIOS、Typefully設定にアクセスしやすく、最初の検証が速いからです。24時間稼働が必要になった段階でVPS移行を検討します。

LINEは既存のFLATUP公式LINEとは分けます。OPENQLOW専用のLINE公式アカウントを用意し、Jinさんの承認・修正・却下だけを扱う運用チャンネルにします。

## 役割分担

```text
OPENQLOW
├─ Strategy Agent
│  YouTube/SNSの週次テーマ、企画、投稿カレンダーを作る
│
├─ Content Agent
│  台本、タイトル、概要欄、サムネ文言、投稿文を作る
│
├─ Video Agent
│  既存動画の切り抜き案、Shorts/Reels/TikTok化、字幕方針を作る
│
├─ Distribution Agent
│  YouTube、Instagram、TikTok、X、LINE VOOM、LINE配信用に変換する
│
├─ Approval Agent
│  LINEへ承認依頼を送り、JinさんのY / 修正 / ×を受け取る
│
├─ Publish Agent
│  Y承認済みの投稿だけ、下書き保存へ進める
│
└─ Analytics Agent
   再生数、反応、クリック、体験予約への貢献を見て次の企画に反映する
```

## 初期MVP

最初に作るMVPは、以下に絞ります。

1. 毎朝8:00にMacのlaunchdで起動する
2. `data/*.md` とObsidian Inboxから今日の角度を選ぶ
3. MMAネタを1日3本作る
4. X / Instagram / Threads / LINE配信用に展開する
5. 安全チェックを通す
6. OPENQLOW専用LINEでJinさんに承認依頼を送る
7. `Y` が返ったX投稿だけTypefullyへ下書き保存する
8. Instagram / Threadsは下書きDBへ保存する
9. Obsidian Vaultへ企画、承認、投稿ログを残す

YouTube、Instagram、TikTok、LINE VOOMへの直接投稿はMVPでは行いません。APIやログイン状況が安定したものから順番に接続を検討します。

## 承認フロー

OPENQLOWの全投稿は、公開前に必ず承認を通します。

```text
OPENQLOWが投稿案を生成
  -> 安全チェック
  -> LINEで承認依頼
  -> Jinさんが Y / 修正 / × を返信
  -> Yのみ下書き保存
  -> ログ保存
```

承認メッセージには、以下を含めます。

- 投稿先
- 投稿本文
- タイトル / 概要欄 / ハッシュタグ
- 画像・動画ファイルパス
- 安全チェック結果
- 想定CTA
- `Y` / `修正: ...` / `×` の返信方法

## 安全ルール

以下は初期実装から必須です。

- AIだけで即時公開しない
- LINEで明示的な `Y` が出たものだけ進める
- Typefullyは下書き保存のみ。即時公開や予約投稿APIは呼ばない
- Instagram / Threadsは当面API連携せず、下書きDB保存に留める
- YouTubeは投稿せず、タイトル・概要欄・Shorts用メタデータの下書きまで
- TikTokとLINE VOOMはPhase 3以降に検討する
- 子ども、女性、会員、体験者の映り込みを必ずチェックする
- 個人情報、会員氏名、電話番号、メールアドレス、住所を投稿しない
- 他ジムを直接悪く言わない
- 炎上を狙う煽り、過度な断定、誇大広告を禁止する
- 自動リプライ、自動いいね、自動フォローをしない
- APIキーはObsidian、Git、README、ログに書かない
- 1日のX投稿は最大5本まで
- 公開前にFLATUPらしさを確認する

## コンテンツ戦略

OPENQLOWが優先するテーマは以下です。

1. 弱い自分と戦う人へ
2. 世界一やさしい格闘技ジム
3. 初心者・女性・子ども・保護者が安心できる
4. 怒鳴らない、威圧しない
5. 勝ち負けより、挑戦する勇気
6. 格闘技は人生を変える
7. 成田 FLATUP GYMのリアルな日常

投稿は売り込みだけにしません。価値観、日常、学び、体験前の不安解消、親目線、女性目線、初心者目線を中心にします。

MMAネタは、FLATUP独自の価値観に接続できるものを優先します。格闘技ニュースや試合情報を扱う場合も、単なる速報ではなく「初心者・女性・子ども・保護者に何を伝えるか」「FLATUPの安全思想や挑戦する勇気にどうつながるか」を必ず入れます。

## 下書きDB

Instagram / Threads / YouTubeメタデータは、最初は人間が読めるMarkdownを正本にします。将来API化しやすいように、同じ内容をJSONまたはSQLiteにも保存できる構造にします。

```text
drafts/
├─ instagram/
│  ├─ 2026-05-17-topic.md
│  └─ index.jsonl
├─ threads/
│  ├─ 2026-05-17-topic.md
│  └─ index.jsonl
└─ youtube/
   ├─ 2026-05-17-topic.md
   └─ index.jsonl
```

承認待ち、承認済み、却下、再生成中などの状態管理はSQLiteで行います。同じ投稿案が二重処理されないよう、投稿案ごとに一意のIDを持たせます。

## データとログ

正本はObsidian Vaultに置きます。

```text
/Users/jin/Documents/Obsidian Vault/02_SKILLS_MARKETING/video_factory/
/Users/jin/Documents/Obsidian Vault/02_SKILLS_MARKETING/SNS/
/Users/jin/Documents/Obsidian Vault/4_日記/FLATUPGYM_AI_学習ログ.md
```

AIOS側には実行ログと操作メモを置きます。

```text
/Users/jin/Desktop/OPENQLOW HelMES/flatup-ai-os/logs/
/Users/jin/Desktop/OPENQLOW HelMES/flatup-ai-os/docs/
```

## リスク評価

### 高リスク

- SNSへの直接自動投稿
- 子どもや会員が映る動画の自動処理
- 複数SNS APIを同時に接続すること
- ClawXに全機能を強く依存すること

### 中リスク

- LINE承認Botの誤解釈
- 投稿予約日の重複
- 同じテーマの投稿乱発
- 伸びた投稿の過剰模倣

### 低リスク

- 企画生成
- 台本生成
- SNS文面の下書き
- Obsidianへのログ保存
- TypefullyへのX下書き保存

## コード配置

既存の `flatup-ai-os` はAIKAの守りのAIとして維持します。OPENQLOWは新規ディレクトリとして分けます。

```text
/Users/jin/Desktop/OPENQLOW HelMES/
├── flatup-ai-os/
│   └── 既存AIKA下書きエンジン
│
└── openqlow/
    ├── README.md
    ├── package.json
    ├── src/
    │   ├── scheduler/
    │   ├── sources/
    │   ├── generators/
    │   │   ├── daily_three.ts
    │   │   └── mma_topic.ts
    │   ├── adapters/
    │   │   ├── x_typefully.ts
    │   │   ├── instagram_draft.ts
    │   │   └── threads_draft.ts
    │   ├── safety/
    │   ├── line_bot/
    │   ├── state/
    │   ├── clipper/
    │   └── bridge/
    ├── drafts/
    ├── logs/
    └── obsidian-bridge/
```

Phase 1では `clipper/` は空の骨組みに留めます。試合動画切り抜きはPhase 2で実装します。

## 最適化された結論

OPENQLOWは、FLATUP GYMのYouTube/SNS集客を、企画から承認付き下書き保存まで進める攻めAIです。

ただし、最初に狙うべき成果は「全SNS完全自動投稿」ではありません。

最初の成果は、毎朝安定して3本のネタを作り、投稿文を量産し、JinさんがOPENQLOW専用LINEで承認でき、承認済みの投稿が安全に下書き保存されることです。

この順番なら、攻めのスピードを出しながら、ブランド毀損、誤投稿、BAN、個人情報漏えい、構築疲れを避けられます。
