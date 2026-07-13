# 第0話「今日のチャンピオン」制作実行キット（コピペ用プロンプト集）

正本 [emotional_movie_ep0.md](emotional_movie_ep0.md) の実行版。
上から順にコピペすれば Day 1〜4 が回るように並べてある。

**⚡ 全自動モード（推奨・fal.aiで一括生成）**

このキットのプロンプトはすべて `npm run movie` に内蔵済み。手でコピペしなくても回せる:

```bash
npm run movie -- list                 # ショット一覧
npm run movie -- refs                 # Day1: 正本8枚を生成（各2テイク）
# → 採用画像を assets/movie/ep0/refs/ に保存（JIN承認ゲート①）
npm run movie -- scenes               # Day2: シーン静止画12枚（正本を毎回自動添付）
# → 採用画像を assets/movie/ep0/stills/C1.png 等の名前で保存
npm run movie -- cuts                 # Day4: 優先4カットを image-to-video
npm run movie -- scenes --only C5c --takes 3   # リテイクは個別に
```

- ジムの基準写真は `assets/movie/ep0/base.jpg` に置く（[GYM]を含むショットに自動添付）
- `FAL_KEY` 未設定なら DRY-RUN（プロンプトのプレビューのみ・コストゼロ）
- エンドポイントは `.env` の `MOVIE_IMAGE_ENDPOINT` / `MOVIE_I2V_ENDPOINT` で差し替え可
- 以下の手動プロンプトは、別ツール（Midjourney等）で回す場合とリテイク調整用

**使い方（共通ルール）**
- 静止画生成: Nano Banana Pro（Gemini）または Midjourney（`--cref` でキャラ参照）
- **毎回添付するもの**: ①ジムの基準写真（背景用） ②採用済みキャラ設定画（正本、Day 1で確定後）
- 1プロンプトにつき**2テイク生成して良い方を採用**
- 生成画像・動画内に**文字を絶対に入れない**（字幕・ロゴはCapCutで後入れ）
- キャラの説明文（下の DNA ブロック）は**一字も変えずに毎回同じものを使う**。これがキャラ固定の生命線

---

## 0. 共通ブロック（全プロンプトの部品。ここだけ読めば仕組みが分かる）

### STYLE（毎回末尾に付ける）
```
Warm, expressive, theatrical 3D animated film quality. Rounded friendly shapes,
realistic material textures (worn leather, soft fabric, rubber, metal), cinematic
lighting, shallow depth of field, subtle and restrained emotional expressions.
Completely original character design, not based on any existing animated film or
franchise. No text, no letters, no logos anywhere in the image. Vertical 9:16.
```

### LIGHT-NIGHT（夜シーン用）
```
Night interior lighting: soft contrast of cool moonlight blue from the windows
and one warm amber security light. Quiet, secret, cozy atmosphere.
```

### LIGHT-DAY（昼の回想用）
```
Daytime lighting: bright natural window light, airy, clean and welcoming.
```

### GYM（舞台）
```
the interior of a bright, friendly, spotlessly clean small kickboxing
gym in Japan, with training mats, hanging heavy bags and focus mitts on the
wall. Nothing intimidating: a space where children and beginners feel safe.
```

### 参照画像を添付したときだけ、末尾に足す一文
**注意: 画像を添付していないのに書くとモデルが混乱する。添付した回だけ足すこと**
（`npm run movie` は添付の有無で自動的に付け外しする）

ジム基準写真を添付した回:
```
Match the layout, equipment and color scheme of the attached reference photo of the real gym.
```
キャラ正本画像を添付した回:
```
Keep every character exactly consistent with the attached character reference sheets:
same colors, same proportions, same stitching, same eye placement.
```

### キャラDNA（一字も変えない）

GLOVE:
```
GLOVE — a single cherry-red boxing glove (one glove only, not a pair), about
25 cm tall, standing upright. Worn soft leather with visible white stitching.
Its eyes are two small gentle folds in the leather that open like sleepy
eyelids (no cartoon googly eyes). A curved seam forms its subtle mouth. Two
tiny stubby red leather arms. Toy-like simplicity, cute but restrained.
```

MITT:
```
MITT — a rounded cream-and-red focus punch mitt, slightly larger than the
glove (about 30 cm), standing upright. A soft motherly face suggested by its
padded contours: calm kind half-closed stitched eyes and a warm smile line
formed by a seam. Gentle, warm, reassuring.
```

TIMER:
```
TIMER — a small yellow digital gym interval timer, about 15 cm tall, standing
on little black rubber feet. Its rectangular LED display is its face: the
glowing segments form its eyes and expressions. Earnest, tidy, secretly kind.
```

人間キャラ（Scene 4〜7 のみ。実在人物に似せない）:
```
GIRL — an original 3D animated character: a small Japanese girl about 5 years
old, shy, wearing a plain pastel t-shirt and shorts, hair in two small buns.
Not resembling any real person or any existing animated character.
MOTHER — her mother, early 30s, gentle face, casual clothes. Original character.
COACH — a kind male coach in his 30s in a plain dark staff polo shirt, warm
smile, friendly posture. Original character.
```

---

## 1. Day 1 — 正本4点＋α（ここの採用画像がシリーズ全体の資産）

### M1 夜のFLATUP GYM全景（基準写真を添付）
```
Wide establishing shot of [GYM] at night, empty, after all the children have
gone home. [LIGHT-NIGHT] A wall clock reads late evening. Everything is still.
[STYLE]
```

### M2 グローブ設定画
ターンアラウンド:
```
Character design sheet, plain light-gray studio background: [GLOVE]
Three views of the exact same character side by side: front view, side view,
back view. Neutral standing pose, eyes open. Consistent proportions. [STYLE]
```
表情シート:
```
Expression sheet, plain light-gray studio background: [GLOVE]
The exact same character six times in a 2x3 grid, only the expression changes:
(1) asleep, eyelid folds closed (2) just waking up, one eye half open
(3) curious and alert (4) deeply moved, eyes glistening but not crying
(5) warm gentle smile (6) determined and proud. [STYLE]
```

### M3 ミット設定画
```
Character design sheet, plain light-gray studio background: [MITT]
Three views of the exact same character: front, side, back. [STYLE]
```
```
Expression sheet, plain light-gray studio background: [MITT]
The exact same character four times in a 2x2 grid, only the expression changes:
(1) calm listening (2) gentle knowing smile (3) proud quiet nod, eyes closed
(4) tender, almost tearful warmth. [STYLE]
```

### M4 タイマー設定画
```
Character design sheet, plain light-gray studio background: [TIMER]
Three views of the exact same character: front, side, back. The LED display
shows an abstract neutral pattern of glowing segments (no readable numbers or
letters). [STYLE]
```
```
Expression sheet, plain light-gray studio background: [TIMER]
The exact same character four times in a 2x2 grid; only the glowing LED
segment pattern changes to suggest: (1) neutral attention (2) surprise
(3) busy counting (4) quiet pride. Abstract segments only, no readable text.
[STYLE]
```

### M5 身長比較
```
Lineup on a plain light-gray studio background, all three characters standing
side by side on the same floor line, correct relative sizes (MITT 30cm >
GLOVE 25cm > TIMER 15cm): [GLOVE] [MITT] [TIMER] Front view, neutral poses.
[STYLE]
```

**Day 1 承認基準（JINチェック）**: ①怖くない・幼稚すぎない ②「目がフォールド（折り目）」が守られている（ギョロ目NG） ③既存キャラの誰にも似ていない ④3体並べたとき家族感がある。
→ 採用した画像を `正本/` フォルダに保存し、**以後の全生成に添付**。

---

## 2. Day 2 — シーン静止画（毎回、正本＋ジム写真を添付）

### C1（Scene 1 / 0-3s）グローブの目覚め・寄り
```
Close-up on the floor of [GYM] at night: [GLOVE] lying on the mat, eyelid
folds still closed, asleep. In the soft-focus background, [TIMER] glows
faintly. [LIGHT-NIGHT] Quiet, secret mood. [STYLE]
```

### C2（Scene 2 / 3-7s）夜の全景＋小さな3体
```
Wide shot of [GYM] at night, empty and still. Tiny in the frame, on the mats:
[GLOVE] [MITT] [TIMER] beginning to stir. [LIGHT-NIGHT] [STYLE]
```

### C3（Scene 3 / 7-13s）秘密の会議
```
Medium shot: [GLOVE] [MITT] [TIMER] gathered in a small circle on the mat of
[GYM] at night, as if holding a secret meeting. In the soft background, a
heavy bag and a jump rope hang still, as if asleep. [LIGHT-NIGHT] Warm,
slightly humorous, conspiratorial mood. [STYLE]
```

### C4（Scene 4 / 13-17s）昼の回想・強い子
```
Daytime flashback in [GYM]: [COACH] holding a focus mitt while an energetic
boy about 8 years old (original character) throws a strong confident punch
into it. Dynamic but safe and joyful, nothing aggressive. [LIGHT-DAY] [STYLE]
```

### C5a（Scene 5 / 17-26s）母の後ろに隠れる女の子
```
Daytime in [GYM]: [GIRL] hiding behind [MOTHER]'s legs near the entrance,
peeking out shyly at the gym. [LIGHT-DAY] Gentle, empathetic mood. [STYLE]
```

### C5b 先生が目線を合わせる
```
Daytime in [GYM]: [COACH] kneeling down to the eye level of [GIRL], gently
holding out a focus mitt toward her, patient warm smile. The girl hesitates.
[LIGHT-DAY] [STYLE]
```

### C5c 手元クローズアップ（最重要カット・全身や顔を入れない）
```
Extreme close-up, only two hands in frame against a soft-focus gym background:
a mother's hand holding a small child's hand. The child's small fingers are
just beginning to slip out of the mother's hand. No faces, no bodies, hands
only. [LIGHT-DAY] Tender, quiet, emotional. [STYLE]
```

### C5d 一歩前へ
```
Daytime in [GYM], low camera at child height: [GIRL] alone in the frame,
taking one small brave step forward, slightly nervous but determined.
[MOTHER] out of focus far behind her. [LIGHT-DAY] [STYLE]
```

### C5e はじめてのミット
```
Daytime in [GYM]: [GIRL] softly touching a focus mitt held by kneeling
[COACH] with her small gloved fist — a first gentle punch, weak but hers.
[LIGHT-DAY] Joyful, tender. [STYLE]
```

### C5f 母の表情
```
Daytime in [GYM], portrait shot: [MOTHER] watching from a distance, a subtle
complex expression — slight surprise, quiet joy and a touch of loneliness at
the same time, a soft smile, absolutely no tears. [LIGHT-DAY] [STYLE]
```

### C6（Scene 6 / 26-31s）決定の瞬間
```
Medium close shot of the night meeting in [GYM]: [GLOVE] smiling with eyes
glistening (moved, not crying), [MITT] nodding warmly with eyes closed,
[TIMER] standing straight with a single proud glowing segment lit on its
display (abstract, no readable text). [LIGHT-NIGHT] [STYLE]
```

### C7（Scene 7 / 31-35s）朝
```
Wide shot of [GYM] in the early morning: golden sunlight streaming through
the windows, dust motes in the light. On the mat, [GLOVE] [MITT] [TIMER] sit
perfectly still, ordinary objects again. The entrance door is half open and
[GIRL] is stepping in by herself, [MOTHER] visible small and out of focus
outside the door. [STYLE]
```

**Day 2 チェック**: 全カットでキャラの色・目の位置・サイズ比が一致しているか。ズレたカットは正本を添付し直してリテイク。

---

## 3. Day 3 — 仮編集（静止画アニマティック）

CapCut に C1→C2→…→C7 を台本の秒数どおり並べ、字幕（§5）を仮で乗せる。
**無音で再生して意味が分かれば合格。** 分からなければ動画化に進まずカットを差し替える。

静止画のまま使うカットの動かし方（CapCut指定）:
- C2: 2%/秒のスロー・ズームイン
- C3: ゆっくり左→右パン
- C4: 打撃の瞬間に軽いプッシュイン
- C5a/C5b/C5e/C5f: 呼吸感のある微ズーム（3%以内）
- C6: 固定＋グローブの目にキャッチライトを足す

---

## 4. Day 4 — 優先4カットの動画化（image-to-video / Seedance 2.0）

起点は必ず採用済み静止画。**1カット1動作**、尺は各3〜5秒。

### V1（起点C1）グローブが目を開ける
```
The red boxing glove's leather eyelid folds slowly open, like someone gently
waking up. It blinks once. Nothing else moves. Static camera, night gym
lighting unchanged, character keeps exactly the same shape and colors,
4 seconds.
```

### V2（起点C5c）手がそっと離れる
```
The child's small hand slowly and gently slips out of the mother's hand,
fingertips lingering for a moment before letting go. Hands only, no faces.
Very slow, tender motion. Static camera, same soft lighting, 4 seconds.
```

### V3（起点C5d）一歩前へ
```
The little girl takes one single small step forward, slightly hesitant,
then stands firm. One step only. Static low camera at child height,
background unchanged, 4 seconds.
```

### V4（起点C7）朝日が差し込む
```
Morning sunlight slowly grows brighter through the windows, dust motes
drifting in the light beams. The three objects on the mat stay perfectly
still. Very subtle, slow change. Static camera, 5 seconds.
```

リテイク基準: キャラの形・色が1フレームでも崩れたら不採用（seed違いで再生成）。

---

## 5. 字幕データ（CapCut後入れ・セーフゾーン内）

| # | IN-OUT | テキスト | 備考 |
|---|--------|---------|------|
| T1 | 0.3-1.8s | 閉館後のジムで、毎晩ひらかれる—— | フック1行目 |
| T2 | 1.8-3.0s | 秘密の会議。 | フック2行目 |
| T3 | 3.5-6.5s | 子どもたちが帰ったあと—— | |
| T4 | 5.0-6.8s | グローブ「みんな、起きて。」 | セリフ字幕 |
| T5 | 8.0-12.5s | タイマー「今夜の議題。『今日いちばん強くなった子』は？」 | 2行 |
| T6 | 13.5-15.5s | グローブ「あの、パンチが一番強かった子？」 | |
| T7 | 15.8-16.8s | ミット「ううん。」 | 直後1拍無音 |
| T8 | 21.0-25.5s | ミット「今日、はじめて『ひとりで前に出た』子。」 | 感情の核 |
| T9 | 26.5-28.5s | タイマー「本日のチャンピオン、決定。」 | |
| T10 | 28.8-30.8s | グローブ「ほんの少し。でも、ちゃんと、強くなった。」 | 2行 |
| T11 | 31.5-33.5s | 強さは、勝つことだけじゃない。 | 締め |
| T12 | 33.5-35.0s | （ロゴ）FLATUP GYM ＋ 世界一初心者に優しい格闘技ジム | ロゴは素材後入れ |

ルール: 1行13文字以内・最大2行・画面下部20%と右端15%に置かない・セリフ字幕はキャラ名の色分け（グローブ=赤/ミット=クリーム/タイマー=黄）。

---

## 6. 公開素材

### SNS投稿文（オーガニック版・Instagram/TikTok共通）
```
閉館後のFLATUP 第0話「今日のチャンピオン」

子どもたちが帰ったあとのジムで、
道具たちが毎晩ひらいている秘密の会議。
選ばれるのは、いちばん強い子じゃありません。

#閉館後のFLATUP #FLATUPGYM #成田市 #キッズキックボクシング
#習い事 #子育て #格闘技ジム #キッズ格闘技 #千葉ママ #AIアニメ
```
※ Instagram は **AI生成ラベルON**。プロフィールリンク＝LINE予約。動画内にCTAは入れない。

### YouTube Shorts タイトル案
```
夜のジムで道具たちが選ぶ「今日のチャンピオン」の意外な基準
```

### ホームページ掲載文（横型16:9版に添える）
```
FLATUP GYMの道具たちは、子どもたちの小さな一歩を全部覚えています。
怖くても前に出た日。失敗してももう一回やった日。
勝ち負けよりも大切なその瞬間を、私たちは見逃しません。

世界一初心者に優しい格闘技ジム FLATUP GYM（千葉県成田市）
キッズ体験 初回500円｜火・木 18:00-19:00／土 13:00-
```

### 広告版CTA（35-38s・後入れテロップ）
```
キッズ体験 500円
火・木 18:00-19:00 ／ 土 13:00-
成田市 FLATUP GYM
親子で、最初の一歩を。
[LINEで予約]
```

---

## 7. 進行チェックリスト

- [ ] Day 1: 正本4点＋身長比較を生成 → **JIN承認**（ここだけは人間の目が必須）
- [ ] Day 2: シーン静止画12枚（C1〜C7）→ キャラ一致チェック
- [ ] Day 3: 静止画アニマティック35秒 → **無音テスト合格**
- [ ] Day 4: V1〜V4動画化 → 差し替え → BGM/SE → 字幕T1〜T12
- [ ] Day 5: セルフ採点85点以上 → AI生成ラベルON → **JINが投稿**

---

**Last Updated**: 2026-07-13 ／ 正本: [emotional_movie_ep0.md](emotional_movie_ep0.md)
