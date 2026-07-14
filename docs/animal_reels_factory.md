# 動物×格闘技リール量産ファクトリー

参考: simba.show1 系の「実写風の猫がシャドーボクシングするリール」(いいね8.9万・シェア6.5万クラス)。
このドキュメントは **今夜からコピペで量産を始めるため** の手順書 + プロンプト銀行です。

---

## バズの型(参考動画の分解)

| 要素 | 中身 |
|------|------|
| 主役 | 実写風(photorealistic)の家猫。二足立ちで人間のボクシング構え |
| 舞台 | 普通の家のリビング(キャットタワーが見切れる)= 日常×本気のギャップが笑い |
| カメラ | 固定・目線の高さ・縦9:16。演出を盛らないほうがリアルに見える |
| 尺 | 5〜8秒。ループ再生で視聴完了率が稼げる |
| キャプション | 英語短文("Jab! Jab! Hook!")+ 英語ハッシュタグ → 海外リーチ狙い |

**鉄則**: 「動物が本気で練習している」だけにする。動物同士の殴り合い・ダメージ描写は
プラットフォーム規約・ブランド安全の両面でNG。技はシャドー / サンドバッグ / ミット限定。

---

## 全自動モード(最速・最安。Seedance 2.0 API)

fal.ai の API キー1つで「プロンプト生成→動画生成→MP4保存→投稿用キャプション出力」まで全自動。
1コマンドで3本(テイク指定で最大30クリップ)できる。

```bash
# 準備(初回のみ): https://fal.ai/dashboard/keys でキー取得 → .env に FAL_KEY=... を追加

npm run reel -- "にゃん術"                    # 3本生成(既定)
npm run reel -- "キックドクシング" --count 5   # 5本
npm run reel -- "猫×柔術" --takes 2           # 各プロンプト2テイク(seed違い)
npm run reel -- --list                        # シリーズ一覧
```

- 出力: `output/reels/YYYY-MM-DD/にゃん術_1.mp4` + `manifest.md`(キャプション・ハッシュタグ付き投稿チェックリスト)
- FAL_KEY 未設定なら DRY-RUN でプロンプトのプレビューのみ(コストゼロ)
- 既定は **Seedance 2.0 Fast**(約$0.02/秒 → 6秒1本 約20円)。伸びた企画の決定版だけ
  `.env` の `SEEDANCE_ENDPOINT` を品質版に切り替える
- 格闘モーション(パンチ・キックの重さ)は2026年比較で Seedance が最強評価。プロンプトは
  `src/reel/promptBank.ts` の静的銀行から機械生成するので、プロンプト側のAI費用もゼロ

### モデル切替(text-to-video ⇄ image-to-video / Hailuo 2.3 Fast)

`FAL_VIDEO_MODEL` で fal のモデルを差し替えられる。モデルパスに `image-to-video` を含めると、
**起点画像1枚から生成する I2V モード**に自動で切り替わる(同じ主役キャラを毎回使い回せる)。

```bash
# .env
FAL_VIDEO_MODEL=fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video

# 起点画像を1枚渡して生成(I2V では --image が必須)
npm run reel -- "ニャクシング" --count 1 --image ./NYANJUTSU_TSUMU_BASE_001.png
```

- **Hailuo 2.3 Fast [Standard] I2V**: 768p / 6秒 約 **$0.19**(10秒 約$0.32)・商用利用可。
  実際の請求額は fal Dashboard → Usage で確認する(価格記事ではなく実請求が正解)。
- 起点画像は 9:16 縦型・猫が全身・二足立ち・グローブ着用・背景シンプル・文字/ロゴなしが理想
  (推奨 1080×1920)。出力は 768p でも入力は縦長で鮮明なものを使う。
- `--image` はローカルファイル(png/jpg/jpeg/webp。base64 data URI にして送る)でも、
  公開 URL(`https://...`)でも渡せる。
- 解像度は standard=768p 固定・アスペクト比は入力画像に従うため送らない。秒数は `"6"` か `"10"`。
- プロンプトは技(モーション)中心に。被写体・背景は起点画像が決めるので、
  「1技だけ・カメラ固定・二足姿勢維持」を明示すると崩れにくい。
- プロンプト最適化は既定 ON。切るなら `.env` に `FAL_PROMPT_OPTIMIZER=false`。
- API キー未設定なら DRY-RUN(コストゼロ)。I2V で `--image` 未指定のときは、
  DRY-RUN は警告付きでプレビュー、本番実行は生成前にエラーで止める。

### プロバイダ切替(fal ⇄ Seedance 公式)

fal を挟まず ByteDance 公式(BytePlus ModelArk)と直接つなぐこともできる。`.env` に:

```bash
SEEDANCE_PROVIDER=byteplus
ARK_API_KEY=BytePlusで発行したキー
```

コマンドは同じ `npm run reel`。ただし料金は fal Fast 層(6秒 約20円)のほうが
公式レート(約$0.14/秒 → 6秒 約125円)より大幅に安い。公式は法人請求書・SLA が
必要な場合や無料トークン枠(新規200万)を使い切りたい場合向け。

## 手動ワークフロー(アプリでコピペ・1本 約5分)

1. **ツールを1つ選ぶ**(迷ったら上から)
   - **Sora アプリ(iPhone)** — 縦動画が簡単、量産向き
   - **Veo(Gemini アプリ / Google Flow)** — 物理挙動と毛並みが最強、効果音も同時生成
   - **Kling / Hailuo** — クレジットが安い、動物モーションが得意
2. 下のプロンプト銀行からコピペ → **1プロンプトにつき2テイク生成** → 良い方を採用
3. キャプション・ハッシュタグを付ける。手動でもいいが、量産するなら:
   ```bash
   npm run dev -- animal_reel "にゃん術"        # シリーズ名でOK
   npm run dev -- animal_reel "猫×ボクシング"   # 組み合わせ指定でもOK
   npm run dev -- animal_reel "おまかせ"        # 名鑑からAIKAが選ぶ
   ```
   → 英語プロンプト3案 + IGキャプション + ハッシュタグ30個 + 派生案が一発で出る
4. Instagram に投稿。**「AI生成」ラベルを必ずON**。1日1〜3本、時間帯は 19〜23時
5. 伸びた組み合わせは「同じ動物×技違い」「同じ技×動物違い」で即・横展開

### キャラ固定(中級テク)
同じ猫を毎回出すとアカウントが「シリーズ化」して伸びる。
最初に「主役のキジトラ猫」の静止画を1枚生成 → 以降は image-to-video でその画像を起点にする。

---

## プロンプト銀行(コピペ用・英語)

### 基本テンプレート
```
A photorealistic [ANIMAL] standing upright on its hind legs like a human athlete,
[MOVE SEQUENCE] in [SETTING]. Fixed camera at eye level, vertical 9:16 format,
natural lighting, realistic fur and physics, believable weight and balance,
no humans visible, 6 seconds.
```

### 猫×ボクシング
```
A photorealistic gray tabby cat standing upright on its hind legs in a boxing stance,
throwing a quick left jab, another jab, then a right hook, keeping its guard up between punches,
in a bright Japanese apartment living room with a cat tower in the background.
Fixed camera at eye level, vertical 9:16, natural window light, realistic fur and physics,
no humans visible, 6 seconds.
```
```
A photorealistic gray tabby cat standing on its hind legs doing boxing head movement,
slipping left and right, then throwing a fast one-two combination at a small hanging punching bag,
in a clean modern boxing gym with a heavy bag. Fixed camera, eye level, vertical 9:16,
soft gym lighting, realistic fur and physics, no humans visible, 6 seconds.
```
```
A photorealistic gray tabby cat wearing a tiny red headband, standing upright on its hind legs,
shadowboxing with quick jabs and ending with a slow-motion victory pose, arms raised,
in a Japanese living room at golden hour. Fixed camera, vertical 9:16,
realistic fur and physics, no humans visible, 6 seconds.
```

### 犬×キックボクシング
```
A photorealistic Shiba Inu standing upright on its hind legs in a kickboxing stance,
throwing a left jab, a right cross, then a fast roundhouse kick with its right leg,
in a bright Japanese living room with a sofa in the background. Fixed camera at eye level,
vertical 9:16, natural lighting, realistic fur and physics, no humans visible, 6 seconds.
```
```
A photorealistic Corgi standing on its short hind legs, throwing an enthusiastic teep front kick
and a low kick at a heavy bag, the bag barely moving, in a kickboxing gym with a ring in the background.
Fixed camera, eye level, vertical 9:16, gym lighting, realistic fur and physics,
no humans visible, 6 seconds.
```
```
A photorealistic golden retriever standing upright, doing kickboxing warm-up: bouncing on its feet,
two quick knees, then a spinning back kick that makes it lose balance and wobble comically before recovering,
in a Japanese living room. Fixed camera, vertical 9:16, natural light,
realistic fur and physics, no humans visible, 6 seconds.
```

---

## シリーズ名鑑(ダジャレ連載ラインナップ)

単発ではなく **シリーズ名を付けて連載化** するとアカウントが伸びる。キャプション冒頭に
「にゃん術 第3話」のように話数を入れ、同じ主役キャラを image-to-video で使い回す。

| シリーズ名 | 組み合わせ | 主役キャラ | 定番の画・オチ |
|-----------|-----------|-----------|---------------|
| **にゃん術** | 猫×ブラジリアン柔術 | キジトラ。小さい白道着+白帯 | 畳でエビ・前転受け身・正座して一礼 |
| **キックドクシング** | 柴犬×キックボクシング | 熱血柴犬 | ジャブ→クロス→ローキック。ハイキックでよろけて照れる |
| **ニャンフー** | 猫×カンフー | 白猫。身のこなしが異常 | 鶴の構え→型の演武。竹林・中華風中庭 |
| **犬道(けんどう)** | ゴールデンレトリバー×剣道 | 礼儀正しい大型犬 | 竹刀の素振り→残心。道場で正座 |
| **ハムスリング** | ハムスター×レスリング | ゴールデンハムスター | 超高速タックルの構え。回し車でフットワーク |
| **ムエコギ** | コーギー×ムエタイ | 短足コーギー。モンコン着用 | 短足テンカオ。ワイクルーの舞 |
| **にゃんMA** | 猫×総合格闘技 | 黒猫。クールで無口 | ケージ前シャドー→スプロール練習 |
| **カピバラ道** | カピバラ×不動の構え | 微動だにしない | 温泉で構えたまま動かない。頭にゆず |
| **ラビットワーク** | うさぎ×フットワーク | ロップイヤー | ステップだけ異常に速い。技は出さないのがオチ |
| **パンダ拳** | パンダ×空手の型 | 巨体・超スロー | ゆっくり正拳突き→瓦割り失敗して座り込む |

**派生の作り方**: ①同じシリーズ×技違い(話数を進める) ②同じ技×動物違い(別シリーズ開始)
③同じ組み合わせ×舞台違い(リビング→ジム→リング→畳)。1つ伸びたら3方向に即展開する。

### にゃん術(猫×柔術)コピペ用
```
A photorealistic gray tabby cat wearing a tiny white jiu-jitsu gi with a white belt,
doing solo Brazilian jiu-jitsu drills on green tatami mats: hip escape shrimping movements
across the mat, quick and precise, in a traditional Japanese dojo. Fixed camera at eye level,
vertical 9:16, soft natural light, realistic fur and physics, no humans visible, 6 seconds.
```
```
A photorealistic gray tabby cat in a tiny white jiu-jitsu gi performing a slow careful
forward roll breakfall on tatami mats, then kneeling in seiza and giving a small polite bow,
in a quiet Japanese dojo with wooden walls. Fixed camera, vertical 9:16, warm afternoon light,
realistic fur and physics, no humans visible, 6 seconds.
```
```
A photorealistic gray tabby cat in a tiny white jiu-jitsu gi playfully practicing guard position
with a soft plush grappling dummy, hugging it and rolling sideways on tatami mats,
in a bright Japanese living room. Fixed camera at eye level, vertical 9:16, natural window light,
realistic fur and physics, no humans visible, 6 seconds.
```

### キックドクシング(柴犬×キック)コピペ用
```
A photorealistic Shiba Inu standing upright on its hind legs in a kickboxing stance,
throwing a left jab, a right cross, then a sharp low kick, tail wagging with focus,
in a bright Japanese living room with a sofa in the background. Fixed camera at eye level,
vertical 9:16, natural lighting, realistic fur and physics, no humans visible, 6 seconds.
```
```
A photorealistic Shiba Inu standing on its hind legs throwing a determined teep front kick
at a heavy punching bag, the bag swaying slightly, tail wagging, in a clean kickboxing gym
with a ring in the background. Fixed camera, eye level, vertical 9:16, gym lighting,
realistic fur and physics, no humans visible, 6 seconds.
```
```
A photorealistic Shiba Inu standing upright attempting a high kick, wobbling comically
and almost falling, then recovering with a proud confident expression, slow motion on the recovery,
in a Japanese living room at golden hour. Fixed camera, vertical 9:16,
realistic fur and physics, no humans visible, 6 seconds.
```

### その他シリーズ1本目コピペ用
```
ニャンフー: A photorealistic white cat standing upright in a crane kung fu stance on one leg,
flowing through slow graceful kung fu forms, in a bamboo grove courtyard with stone floor.
Fixed camera, vertical 9:16, misty morning light, realistic fur and physics, no humans visible, 6 seconds.
```
```
犬道: A photorealistic golden retriever standing upright in a kendo stance holding a bamboo shinai
with both front paws, performing three focused overhead practice swings, in a traditional Japanese
kendo dojo with wooden floor. Fixed camera, vertical 9:16, soft light, realistic fur and physics,
no humans visible, 6 seconds.
```
```
ハムスリング: A photorealistic golden hamster in a wrestling stance doing rapid tiny footwork drills,
then a lightning-fast takedown practice motion onto a soft mini mat, on a desk setup that looks like
a tiny wrestling gym. Fixed macro camera, vertical 9:16, bright light, realistic fur and physics,
no humans visible, 6 seconds.
```
```
ムエコギ: A photorealistic Corgi wearing a small muay thai mongkol headband, standing on its short
hind legs performing a slow ceremonial wai kru dance, then one enthusiastic knee strike,
in a muay thai gym with a ring. Fixed camera, vertical 9:16, warm gym lighting,
realistic fur and physics, no humans visible, 6 seconds.
```
```
にゃんMA: A photorealistic black cat standing upright shadowboxing MMA style, two punches
then a quick sprawl to the mat and back up, in front of an octagon cage fence. Fixed camera,
vertical 9:16, dramatic gym lighting, realistic fur and physics, no humans visible, 6 seconds.
```
```
カピバラ道: A photorealistic capybara sitting completely still in a fighting stance pose,
absolutely motionless, in a steaming outdoor hot spring with a yuzu citrus on its head,
gentle steam rising. Fixed camera, vertical 9:16, soft winter light, realistic fur, 6 seconds.
```
```
ラビットワーク: A photorealistic lop-eared rabbit standing upright doing impossibly fast boxing
footwork, bouncing side to side with blinding speed but never throwing a single punch,
in a boxing gym. Fixed camera, vertical 9:16, gym lighting, realistic fur and physics,
no humans visible, 6 seconds.
```
```
パンダ拳: A photorealistic giant panda standing upright performing an extremely slow karate kata,
one deliberate heavy punch forward, then attempting to chop a stack of tiles, failing,
and slowly sitting down defeated, in a karate dojo. Fixed camera, vertical 9:16, natural light,
realistic fur and physics, no humans visible, 6 seconds.
```

---

## キャプション・ハッシュタグの型

- キャプション: 技の掛け声を英語短文で。`Jab! Jab! Hook! 🥊` / `Low kick training day 🐕`
- ハッシュタグ(コピペ用ベース):
```
#cat #dog #funny #funnyanimals #boxing #kickboxing #muaythai #catsofinstagram #dogsofinstagram #reels #viral #cute #catlover #doglover #fyp #boxingtraining #martialarts #aivideo #猫 #犬 #格闘技
```

## 運用ルール

- **AI生成ラベルON**(Instagram規約)。プロフィールに AI generated 明記推奨
- 実在アカウント(simba.show1等)の動画の転載・複製はしない。**型だけ借りて自作**する
- 動物が痛がる・傷つく・動物同士が殴り合う描写は作らない
- FLATUP GYM への導線はプロフィールリンクのみ。動画内に宣伝を入れない(伸びなくなる)
- 投稿前の最終確認は必ず人間(JIN)が行う

---

**Last Updated**: 2026-07-10
