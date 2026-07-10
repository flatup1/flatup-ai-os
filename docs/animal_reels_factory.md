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

## 最短ワークフロー(1本 約5分)

1. **ツールを1つ選ぶ**(迷ったら上から)
   - **Sora アプリ(iPhone)** — 縦動画が簡単、量産向き
   - **Veo(Gemini アプリ / Google Flow)** — 物理挙動と毛並みが最強、効果音も同時生成
   - **Kling / Hailuo** — クレジットが安い、動物モーションが得意
2. 下のプロンプト銀行からコピペ → **1プロンプトにつき2テイク生成** → 良い方を採用
3. キャプション・ハッシュタグを付ける。手動でもいいが、量産するなら:
   ```bash
   npm run dev -- animal_reel "猫×ボクシング"
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

### 次の弾(組み合わせマトリクス)

| 動物 | 相性のいい競技・技 | 演出メモ |
|------|--------------------|----------|
| 猫(キジトラ) | ボクシング(ジャブ・スリップ) | 俊敏・クール。基本の主役 |
| 柴犬 | キックボクシング(ローキック) | 熱血・直情。掛け声が似合う |
| コーギー | ムエタイ(テンカオ・首相撲) | 短足ギャップで笑い |
| ハムスター | ミット打ち(超高速ラッシュ) | 小ささ×手数で笑い |
| カピバラ | 構えるだけで動かない | 「やる気ゼロ」ネタ枠 |
| パンダ | 空手の型(正拳突き) | ゆっくり・重量感 |
| うさぎ | フットワークだけ異常に速い | 技を出さないのがオチ |

**派生の作り方**: ①同じ動物×技違い ②同じ技×動物違い ③同じ組み合わせ×舞台違い(リビング→ジム→リング→畳)。
1つ伸びたら3方向に即展開する。

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
