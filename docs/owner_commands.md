# オーナー用コマンド早見表

まずここへ移動します。

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/flatup-ai-os"
```

コマンド一覧を見たいとき:

```bash
npm run list
```

基本形:

```bash
npm run dev -- コマンド名 "状況を書く"
```

## よく使う順

| やりたいこと | コマンド |
|---|---|
| LINE返信を作る | `npm run dev -- line_reply "問い合わせ文"` |
| 今日やることを整理する | `npm run dev -- daily_manager "今日の予定"` |
| 体験後のお礼・追客文を作る | `npm run dev -- followup "体験者の様子"` |
| SNS投稿を作る | `npm run dev -- sns_post "投稿テーマ"` |
| リスク事案を整理する | `npm run dev -- risk_check "匿名化した状況"` |
| Google口コミのお願い文を作る | `npm run dev -- review_request "相手の状況"` |
| 動画台本を作る | `npm run dev -- video_script "動画テーマ"` |
| スタッフ用マニュアルを作る | `npm run dev -- training_manual "指導テーマ"` |
| HP/LPの差別化文を作る | `npm run dev -- differentiation "伝えたい強み"` |
| 初心者向け案内文を作る | `npm run dev -- uizin "届けたい相手"` |

## コピペ用

### LINE返信

```bash
npm run dev -- line_reply "明日18時に体験できますか？女性で初心者です"
```

### 今日やること整理

```bash
npm run dev -- daily_manager "今日18:00から体験3名。SNS投稿予定。月末請求準備あり"
```

### 体験後フォロー

```bash
npm run dev -- followup "30代女性。初心者で不安そうだったが、ミット打ちは楽しそうだった"
```

### SNS投稿

```bash
npm run dev -- sns_post "初心者歓迎の体験紹介投稿。怖くない雰囲気を伝えたい"
```

### X投稿をTypefully用に作る

```bash
npm run dev -- sns_post "X向け。弱い自分と戦う人へ届ける短いスレッド"
```

Typefullyへの下書き保存・予約管理は [typefully_x_ops.md](typefully_x_ops.md) を見ます。

### リスクチェック

```bash
npm run dev -- risk_check "会員さん同士の距離感で少し心配なことがある。個人名は書かずに状況だけ整理"
```

### 口コミ依頼

```bash
npm run dev -- review_request "入会2ヶ月の男性。ミット打ちで自信がついた様子"
```

### 動画台本

```bash
npm run dev -- video_script "体験トレーニングの流れを紹介する短い動画"
```

### スタッフ用マニュアル

```bash
npm run dev -- training_manual "初心者へのミットの持ち方。怖がらせない声かけも入れる"
```

### HP/LP差別化文

```bash
npm run dev -- differentiation "ガチスパー強制なし。初心者・女性・キッズが安心できるジム"
```

### 初心者向け案内

```bash
npm run dev -- uizin "格闘技未経験のお母さん向け。キッズクラスの安心感を伝える"
```

## 忘れないルール

- AIKAは下書き担当です。送信・投稿は人間が確認してから。
- 本名、電話番号、住所などの個人情報は入れません。
- 料金やルールが変わったら `src/data/` を直します。
- 不安な話はまず `risk_check` にかけます。
- 良かった下書きは `src/data/templates.md` に足していきます。
- X投稿は1日5本まで。Typefully公開・予約は人間が確認してから。
