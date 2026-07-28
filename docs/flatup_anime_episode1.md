# FLATUP アニメ EP1「世界一やさしい格闘技ジム」制作仕様

**結論**: 45秒のEP1を、このリポジトリの実パイプライン（fal.ai 画像=FLUX、動画=Hailuo I2V、6秒/カット、CapCutでつなぐ）で作れるように、**8カット×約6秒**に落とした完成仕様。上から順に画像→動画→編集で作れば、環境構築ゼロでEP1が完成する。

## 💰 費用（2026-07-27 実測）

| 作り方 | 費用の目安 | 中身 |
|---|---|---|
| **cheap（推奨）** | **約 $0.3（¥50）** | 画像8枚 + ffmpegでゆっくり動かす。**動画AIを使わない** |
| full | 約 $13（¥2,000） | 画像8枚 + 動画AI 8本。動きは自然だが**約40倍高い** |
| images_only | 約 $0.3 | 画像だけ（絵柄の確認用） |
| dry_run | **無料** | 生成せず中身の確認だけ |

> ⚠️ 旧記載の「1カット¥40」は誤り。実測は `seedance-2.0/image-to-video` で
> **動画1本あたり約$1.5（¥230）**、EP1一式で約$13だった。
> まず `cheap` で作り、動きに不満があるカットだけ `full` で作り直すのが最も無駄がない。

---

> 📖 **キャラ・世界観・シリーズ構成の正本** → [flatup_animation_bible.md](flatup_animation_bible.md)（v3.0）
>
> 📱 **スマホだけで作りたい / PCが無いとき** → [anime_ep1_smartphone.md](anime_ep1_smartphone.md)
> GitHub Actions の「🎬 アニメEP1を作る」をタップするだけで、①画像→②動画→③連結まで
> クラウドで走り、完成した45秒動画をスマホにダウンロードできる。
>
> 💻 PCなら3コマンド: `npm run anime:ep1:images` → `anime:ep1:video` → `anime:ep1:stitch`

> もとの絵コンテ（オープニング＋Scene1〜7＋ナレーション＋ロゴ）を、
> 1カット=1アクション=6秒の作りやすい単位に割り直したもの。
> キャラの一貫性は `flatup_anime_studio.md` のキャラバイブル（先生・子ども・あぷちゃん）に従う。

## 基本仕様

| 項目 | 値 |
|---|---|
| タイトル | FLATUP GYM アニメ EP1「世界一やさしい格闘技ジム」 |
| 尺 | 約45秒（6秒×8カット、編集でつなぐ） |
| 画面 | 縦 9:16 |
| 画風 | 温かい3D映画風（Pixar/Illumination級の可愛さ＋ジブリの空気感）。怖くしない |
| ライティング | ゴールデンアワー〜夜。暖色、柔らかい影、逆光が綺麗な時間帯 |
| 芯のメッセージ | 「強さとは、人を倒すことじゃない。人を守れる優しさ」 |

## 制作フロー（`flatup_anime_studio.md` の7段階に対応）

1. **03 CHARACTER_STUDIO**: 先生・子どもの基準画像を1枚ずつ確定（`npm run img`）。以後**全カットで同じ基準画像を参照**して顔ブレを防ぐ。
2. **05 IMAGE_STUDIO**: 下のカット別FLUXプロンプトを `npm run img -- "<プロンプト>" --count 4` に入れ、各カット1枚採用。
3. **06 VIDEO_STUDIO**: 採用画像＋下のHailuoプロンプトを fal Playground（Hailuo 2.3 Fast I2V）または `npm run reel -- ... --image` で6秒動画化。
4. **07 FINAL_EDIT**: CapCutで8本を順に連結。字幕は下の「セリフ/字幕」をコピペ。BGMはピアノ＋ストリングスの優しい曲。ロゴは最後の1秒のみ。

---

## 絵コンテ（8カット）

| # | 尺 | 画（何が見えるか） | 動き | セリフ/字幕（日本語15字以内） |
|---|---|---|---|---|
| 1 | 6s | 夜の商店街に建つFLATUP GYM外観。窓から暖かい光。ロゴ看板 | カメラがゆっくり寄る（スローパン） | FLATUP GYM |
| 2 | 6s | ジム内。先生と子どもたちが向き合って笑顔で挨拶 | 先生が手を上げて挨拶、子どもが応える | こんばんは！ |
| 3 | 6s | 先生が子どもたちに語りかける。子どもは正座で聞く | 先生の穏やかな表情、子どもが元気に返事 | 今日は「優しくなること」 |
| 4 | 6s | 子どもたちが横一列でジャブ〜ワンツーの基本練習 | パンチを出す→先生が笑顔で見守る | まっすぐ、いいね！ |
| 5 | 6s | 先生がミットを構え、子どもがミット打ち | パン！パン！と当たり、先生が褒める | ナイス！ |
| 6 | 6s | ヘッドギア姿の子ども2人がマススパー。当てない軽い動き | 構え→タッチ→お互いに礼・握手・笑顔 | 勝ち負けじゃない |
| 7 | 6s | 全員で整列・正座して礼 | 深く礼をする | ありがとうございました！ |
| 8 | 6s | 夜のジム外観に戻り、窓に子どもたちの笑顔。最後にロゴ | 引きの画→ロゴがふわりと出る | 世界一やさしい格闘技ジム |

> **安全メモ**: カット6の「スパーリング」は当てない**マススパーリング**として描く（`src/data/sparring_policy.md` 準拠）。殴り合い・痛がる顔・流血は描かない。礼と握手で「思いやり」を見せるのが狙い。

---

## カット別 FLUX 画像プロンプト（英語）

各カット、まず基準画像で先生と子どもの顔を固定してから生成する。共通接尾: `warm 3D animation movie style, Pixar/Illumination quality, soft golden-hour lighting, cinematic depth of field, vertical 9:16, FLATUP GYM interior (white floor, green mats, potted plants, one yellow and one neon pink punching bag, white wall FLATUP GYM sign)`。

**Cut 1 — 夜の外観**
```
Warm 3D animation movie establishing shot, a cozy two-story martial arts gym named "FLATUP GYM" on a quiet Japanese town street at night, warm light glowing from the second-floor windows, a wooden "FLAT UP GYM" sign lit softly, wet asphalt reflecting streetlights, punching bags visible through the window, heartwarming Ghibli-like evening mood, no people visible, cinematic wide shot, vertical 9:16
```

**Cut 2 — 挨拶**
```
Warm 3D animation movie still, a cheerful young male coach in his late twenties (short black hair, shonen-hero look, black FLAT UP GYM hoodie) smiling and greeting a small group of 2.5-head-tall chibi kids in FLAT UP GYM t-shirts, bright clean gym interior, white floor, green mats, potted plants, yellow and neon pink punching bags, warm evening light, everyone smiling, vertical 9:16
```

**Cut 3 — テーマ提示**
```
Warm 3D animation movie still, the young male coach kneeling and speaking gently to chibi kids sitting in seiza on the white gym floor, kids listening with sparkling big eyes, soft warm light, potted plants and punching bags in the background, tender heartwarming mood, vertical 9:16
```

**Cut 4 — 基本練習**
```
Warm 3D animation movie still, a row of 2.5-head-tall chibi kids in FLAT UP GYM t-shirts and muay thai shorts throwing gentle jab punches in unison, barefoot on white floor, green wall mats, the coach watching with a proud smile, bright clean gym, warm light, playful energetic mood, vertical 9:16
```

**Cut 5 — ミット打ち**
```
Warm 3D animation movie still, the young coach holding a yellow-and-black focus mitt while a happy chibi kid punches it, motion of a clean light hit, coach smiling and cheering, bright clean gym with white floor and punching bags, warm golden light, joyful mood, vertical 9:16
```

**Cut 6 — マススパー（礼・握手）**
```
Warm 3D animation movie still, two friendly chibi kids wearing soft headgear and oversized boxing gloves facing each other in a gentle no-contact light spar, then bowing and touching gloves with big smiles, safe playful atmosphere, bright clean gym, warm light, absolutely no aggression or pain, vertical 9:16
```

**Cut 7 — 整列・礼**
```
Warm 3D animation movie still, a group of chibi kids in FLAT UP GYM t-shirts kneeling in a neat row in seiza and bowing respectfully, the coach bowing with them, bright clean gym floor, warm evening light, calm grateful heartwarming mood, vertical 9:16
```

**Cut 8 — 外観に戻り＋ロゴ**
```
Warm 3D animation movie still, exterior night view of FLATUP GYM, warm light from the windows with silhouettes of smiling kids inside, empty quiet street, gentle magical evening mood, space at center for a logo, cinematic, vertical 9:16
```

---

## カット別 Hailuo 動画プロンプト（英語）

> **②動画化も自動化できる**: 各カットで採用した1枚を `output/clips_src/` に `cut1.png … cut8.png` の名前で置き、
> `.env` に `FAL_VIDEO_MODEL=<Hailuo等のI2Vモデル>` を設定して `npm run anime:ep1:video` を実行すると、
> 下の8プロンプトで一気に6秒動画化され `output/clips/cut1.mp4 … cut8.mp4` に保存される（そのまま `anime:ep1:stitch` へ）。
> 下記プロンプトはそのバッチに内蔵済み。fal Playground で手動I2Vする場合の参照用でもある。

各カット、採用したFLUX画像を入れて I2V。共通ルール: `one gentle motion only, fixed camera, background unchanged, soft warm lighting, 6 seconds`。

- **Cut 1**: `Slow subtle dolly-in toward the gym, warm window light flickers gently, faint steam rises from the wet street, cozy calm night.`
- **Cut 2**: `The coach raises one hand in a friendly greeting and the kids wave back with bright smiles, gentle breathing and blinking, warm and lively.`
- **Cut 3**: `The coach speaks warmly with a soft gesture, the seated kids nod and their eyes light up, gentle breathing, tender mood.`
- **Cut 4**: `The row of kids throws one clean jab punch forward in unison, the coach nods with a proud smile, light hair and clothing motion.`
- **Cut 5**: `The kid throws one straight punch into the focus mitt with a soft impact, the coach reacts with a cheerful "nice" expression, gentle motion.`
- **Cut 6**: `The two kids touch gloves and bow to each other with big warm smiles, no impact, only a friendly respectful gesture, soft motion.`
- **Cut 7**: `The kneeling kids bow forward together in a respectful gesture, the coach bows with them, slow calm synchronized motion.`
- **Cut 8**: `Very slow pull-back from the gym exterior, the window silhouettes stay smiling, warm light glows steadily, magical calm ending.`

---

## 編集メモ（CapCut）

> **③つなぐは自動化できる**: 6秒クリップ8本を `output/clips/` に順番の名前（cut1.mp4…cut8.mp4）で入れ、
> `npm run anime:ep1:stitch` を実行すると `output/ep1/flatup_ep1_YYYYMMDD.mp4` に1本化される（要 ffmpeg）。
> そのあとCapCutで開き、④の「文字・音楽・ロゴ」だけ足せば公開用EP1になる。

- **つなぎ順**: Cut1→8をそのまま連結。カット間は0.2秒の柔らかいクロスディゾルブ（自動連結は今はハードカット。ディゾルブが欲しければCapCutで足す）。
- **BGM**: ピアノ＋ストリングスの優しい曲。Cut6〜7で少し盛り上げ、Cut8で余韻を残して収束。
- **効果音**: 子どもの笑い声（全体うっすら）、パンチ音・ミット音（Cut4-5）、環境音（Cut1・8の夜の街）。
- **字幕**: 上表の「セリフ/字幕」をコピペ。画面下1/4に大きめ・白フチ。1カット1行。
- **ナレーション**（Cut8前後に重ねる）: 「強さとは、人を倒すことじゃない。人を守れる優しさ。」
- **ロゴ**: 最後の1秒だけ、Cut8の中央に「FLATUP GYM／世界一やさしい格闘技ジム」をふわりと表示。

---

## 投稿セット

**IGキャプション案**
> 夜のFLATUP GYM。ここで最初に教わるのは、パンチより先に「優しさ」。
> 強い人ほど、優しい。──世界一やさしい格闘技ジムのショートアニメ、はじまります。🥊✨
> 体験・見学はプロフィールのリンクから。

**ハッシュタグ（1行・15〜20個）**
`#FLATUPGYM #世界一やさしい格闘技ジム #成田キックボクシング #成田習い事 #キッズ格闘技 #キックボクシング #子どもの習い事 #格闘技アニメ #ショートアニメ #親子で通える #初心者歓迎 #成田市 #千葉ジム #護身術 #優しさは強さ #アニメ広告 #AI動画`

**注意**: 投稿時はAI生成ラベルON。投稿前に人間確認は必須。

---

## 人間確認ポイント

- 先生・子どもの基準画像がバイブルとブレていないか（顔・服・舞台の一貫性）
- カット6が「当てないマススパー・礼・握手」に見えるか（暴力・痛がる描写ゼロ）
- 実在会員の顔に寄せていないか（キャラはすべてオリジナル）

---

## シリーズ・ロードマップ（旧8話版・**v3.0で置き換え済み**）

> ⚠️ **この表は旧版**。現行の正本は [flatup_animation_bible.md](flatup_animation_bible.md) の**全10話構成**。
> 新規制作はバイブル側の話数・タイトルに従うこと。以下は経緯の記録として残す。

NetflixやDisney+のような統一感で、FLATUP GYMのブランドストーリーを継続配信する。全話EP1と同じ舞台・同じキャラバイブル・同じ画風で作る。

| 話 | タイトル | 芯のメッセージ | 制作メモ |
|---|---|---|---|
| EP1 | はじめてのキックボクシング | 強さより優しさ（本ファイル） | 完成仕様あり |
| EP2 | ありがとうが言える子 | 感謝を言葉にする | 礼・挨拶を軸に |
| EP3 | 負けても泣かない勇気 | 失敗から立ち直る | マススパーで負けても握手 |
| EP4 | 仲間を応援する心 | 応援・協力 | 見学・声かけの描写 |
| EP5 | 強さより優しさ | シリーズ主題の再確認 | EP1と対になる回 |
| EP6 | 悪い誘惑と正しい選択 | 正しい選択をする勇気 | **暗黒面はメタファーのみ**。実在の善悪・暴力に寄せず、心の中の「怠け影」を優しく描く（怖くしない） |
| EP7 | 家族との約束 | 家族への思いやり | 親子・保護者の見守り |
| EP8 | 卒業、そして新しい夢 | 成長と旅立ち | シリーズの締め。あぷちゃんが見送る |

> **展開先**: YouTube Shorts / TikTok / Instagram Reels。1話45秒・縦9:16で共通。
> **運用ルール**: `flatup_anime_studio.md`「運用ルール（アニメ広告版）」に全話従う（怖くしない／公式アカウント専用／AI生成ラベルON／投稿前に人間確認）。
