# 【別稿・B系】第1話「成田へ、引っ越します。」動画の絵コンテ

> ⚠️ **2026-10-30 JIN決定（設計書 #14）**：ジムの中は**2Dの漫画絵**（ペンのインク線＋彩色）で描く。このファイルにある「3D」「温かい3D」は、2Dに読みかえる（本文は次の改訂で直す）。参考：[manga_research/homage_guidelines.md](manga_research/homage_guidelines.md) §8。

**結論**: 引っ越し前の家で、保護者が6歳の息子を心配する約93秒の導入回。前半は親の不安（成田という街・格闘技）を劇画パロディで笑いに変え、後半で明るい3Dに戻り「世界一、初心者に優しい格闘技ジム」のタイトルのあと、**体験の案内（灯りのエンドカード）で終わる**。**15カット（Cut 1〜14 は6秒、Cut 15 のエンドカードは9秒）**。作り方は EP1 と同じ（FLUX で画像 → 必要なカットだけ動画化 → CapCut でつなぐ）。

> ⚠️ **このファイルは別稿（改善の提案・制作の設計）**。第1話の正本は [ep01_hikkoshi_canon_A.md](ep01_hikkoshi_canon_A.md)（A版・90秒・6パート、2026-10-30 JIN決定）。食い違ったら正本が勝つ。
> ⚠️ 2026-10-30 の新方針（マスタープロンプト・[omnibus_series_bible.md](omnibus_series_bible.md) v2）では、体験の予約の案内は体験回だけ。第1話は正本どおり**タイトルで終わる**ので、この別稿の Cut 15（灯りのエンドカード）は使わない。

> 📖 キャラ・世界観の正本 → [../flatup_animation_bible.md](../flatup_animation_bible.md)
> 🛠 制作手順・費用の目安 → [../flatup_anime_episode1.md](../flatup_anime_episode1.md)（cheap 方式なら画像15枚で約 $0.6）

---

## ⚠️ 公開前に JIN が確認すること

1. **実在のご家庭がモデルの場合**: 本人（保護者）の同意を JIN が確認してから使う（バイブル「実在会員」規定）。顔は実物に寄せず、名前も変えられるようにしておく。
2. **劇画パロディ（Cut 3〜4・8〜9）**: バイブルの「怖い顔・流血・暴力を描かない」に合わせ、**怖い顔はシルエットか後ろ姿、流血なし、ギャグとして描く**。それでもジムのブランドと合わないと判断したら、劇画カットだけ差し替える。
3. **成田いじり**: 「ママの思い込み」として描き、Cut 4 で「実は家族思い」に落とす。街そのものを笑いものにしない。実在店舗の名前・ロゴは出さない。
4. **タイトル**: 正本どおり「世界一、初心者に優しい格闘技ジム」。

---

## 基本仕様

| 項目 | 値 |
|---|---|
| タイトル | オムニバス第2話「成田へ、引っ越します。」 |
| 尺 | 約93秒（6秒×14カット＋Cut 15 は9秒） |
| 画面 | 縦 9:16 |
| 画風 | 現実パート＝温かい3D映画風（EP1と同じ）／妄想パート＝白黒の劇画パロディ（集中線・スクリーントーン） |
| 切り替え | 妄想に入るとき「ガガーン」の効果音＋白フラッシュ。戻るときはママの「……」で色が戻る |
| 芯のメッセージ | 不安は、見に行けば小さくなる。強さは、やさしさから。 |

## 登場人物（すべて架空。実在のご家庭がモデルなら名前は差し替え可）

| 名前 | 役どころ | 画像生成用の固定ブロック（毎カットに入れる） |
|---|---|---|
| 西村 栄光（えいこう）くん・6歳（保育園の年長さん） | やさしいけど泣き虫の保育園児。おもちゃを取られても言い返せない | `a gentle 6-year-old chibi boy, 2.5-head-tall, soft black bowl-cut hair, big round brown eyes, rosy cheeks, light-green dinosaur pajamas` |
| ママ | 心配性。夜中にスマホで調べて不安をふくらませる | `a Japanese mother in her early thirties, shoulder-length brown hair in a loose low ponytail, oversized beige cardigan, kind but worried eyes` |
| パパ | のんきに見えて、実は一番心配している | `a Japanese father in his mid thirties, short black hair, round glasses, gray hoodie, soft friendly face` |
| マサキ・メルティ | Cut 11〜12 のスマホ動画の中だけに登場 | バイブルの英語ブロックをそのまま使う。**canon画像を必ず添付** |
| アイカ | Cut 13 の声だけ（姿の正本画像がまだ無いため顔は出さない） | — |

> バイブルの主人公ツム（5歳）とは別のゲストキャラ。キッズクラスは6歳から（2026-10-30 JIN決定）なので、5歳のツムとキッズクラスで共演させるかは、バイブル側の年齢の扱いが決まってから。

---

## 絵コンテ（15カット）

| # | 尺 | パート | 画（何が見えるか） | 動き | セリフ・字幕（15字以内） |
|---|---|---|---|---|---|
| 1 | 6s | 現実 | 夜の団地の一室。段ボールの山。「成田」と書かれた引っ越しメモ | ゆっくり寄る | （ナレ）引っ越しまで、あと7日。 |
| 2 | 6s | 現実 | 寝ている栄光くんの横で、ママがスマホを見て顔をしかめる | スクロール→眉が寄る | 成田　ヤンキー　多い……？ |
| 3 | 6s | 妄想 | 劇画。夜の国道に黒いミニバンがずらっと並ぶ。青いLED | ライトが順に点く「ブォンッ」 | 世界の玄関口（ゲートウェイ）―― |
| 4 | 6s | 妄想 | 劇画。ミニバンの車内。後部座席にチャイルドシートとぬいぐるみ | カメラが車内へ寄る | ……チャイルドシート、付いてる。 |
| 5 | 6s | 現実 | ママ、ちょっと安心した顔。でも栄光くんの寝顔を見て曇る | 寝顔をなでる | でも、この子は大丈夫かな。 |
| 6 | 6s | 回想 | 保育園。栄光くんがブロックを取られて、黙ってうつむく | うつむく、涙がにじむ | 「かえして」が、言えない。 |
| 7 | 6s | 現実 | リビング。パパが麦茶を置いて隣に座る | 座って話しかける | 何か、習わせてみる？格闘技とか |
| 8 | 6s | 妄想 | 劇画。逆光のシルエットの大男コーチ。竹刀。顔は見えない | 竹刀がドンッと床をつく | （ママの声）先生、怖くない？ |
| 9 | 6s | 妄想 | 劇画ギャグ。リーゼント姿のちび栄光くんが腕組み。背景に「上等」っぽい書き文字（意味は読めない崩し） | ポーズを決める | 乱暴な子に、ならない？ |
| 10 | 6s | 現実 | ママ「やっぱり無理！」と頭を抱える。後ろで栄光くんが目をこすって起きてくる | 起き上がる | ……ママ、なに見てるの？ |
| 11 | 6s | 現実 | ママのスマホに FLATUP GYM の動画。マサキと子どもたちが笑顔でミット打ち | 画面の中で子どもがパンチ | 一歩ずつ、一緒にできるようになろう！ |
| 12 | 6s | 現実 | 栄光くんがスマホをのぞきこみ、目がキラッと光る。画面にはメルティの笑顔 | 目が輝く | ……ぼく、これ、やってみたい。 |
| 13 | 6s | 現実 | ママとパパが顔を見合わせて、少し笑う。スマホからアイカの声 | 見合わせる→ほほえむ | 強くなる前に、優しくなろう。 |
| 14 | 6s | タイトル | 黒い画面にタイトル→夜明けの成田の空に飛行機 | ロゴがドンッと出る | 世界一、初心者に優しい格闘技ジム |
| 15 | 9s | 灯りのエンドカード | 夕焼けのFLATUP GYMの窓に、温かい灯り。手前に、ミットを抱えた栄光くんの後ろ姿 | 灯りがふわっと強くなる。文字は後から重ねる | （マサキの声）こわかったら、まずは見るだけでいいよ。→ エンドカード（下のメモ） |

> エンドカード（Cut 15・9秒）：マサキの橋渡しのセリフ（約3秒）のあと、エンドカードを6秒止めて見せる（ブランドの行は Cut 14 のタイトルで出ているので省く）。「まずは、見るだけでも。」「初回体験 500円（30分）／見学OK」「キッズクラス：火・木 18:00〜19:00／土 13:00〜」「ご予約・ご相談は 公式LINE から」＋QRコード。エンドカードの文面と数字は [omnibus_series_bible.md](omnibus_series_bible.md) §4 の型を使い、公開前に `openqlow/src/shared/canon.ts` と照合する。

> 字幕メモ: Cut 11「一歩ずつ、一緒にできるようになろう！」、Cut 14のタイトル、Cut 15「こわかったら、まずは見るだけでいいよ。」は15字を超えるので、2行に分ける（「一歩ずつ、／一緒にできるようになろう！」「世界一、初心者に優しい／格闘技ジム」「こわかったら、／まずは見るだけでいいよ。」）。

### ナレーション・セリフ台本（声録り用）

> ⚠️ セリフの正本は [manga_ep02_hikkoshi.md](manga_ep02_hikkoshi.md)（Web漫画版。脚本A/Bの正本はJINの決定待ち）。下の台本は漫画版より前のもので、Cut2（漫画のコマ2〜3）、Cut5（コマ8・11）、Cut8〜9（不安の順番。漫画はケガ→乱暴→先生→6歳）、Cut14（漫画は夜明け→タイトル「成田へ、引っ越します。」の順）が漫画とちがう。漫画にしかないセリフ：コマ9・17・18・21・23・29・33（コマ17・18の「なんだコラ」「声が小せェ！」は、脚本の決定待ちの印つきで、ママの妄想の中だけ）。コマ27のパパのセリフは Cut13 に入れた。**声録りの前に、漫画版に合わせて直す**。

```
Cut1  ナレ   引っ越しまで、あと7日。
Cut2  ママ   （小声）成田……ヤンキー……多い……？
Cut3  ナレ   （劇画調・低く）成田――世界への玄関口（ゲートウェイ）。
             だが地元民（ジモティ）は、誰ひとり飛び立たねェ……。
Cut4  ママ   （素に戻って）……でも、チャイルドシート、ちゃんと付けてる。
Cut5  ママ   でも、この子は大丈夫かな。
Cut6  ナレ   「かえして」が、言えない子だった。
Cut7  パパ   心も体も強くなるように、何か習わせてみる？ 格闘技とか。
Cut8  ママ   ケガしない？ 先生、怖くない？
Cut9  ママ   乱暴な子に、ならない？ 6歳で、できるの？
Cut10 ママ   やっぱり無理！
      栄光   ……ママ、なに見てるの？
Cut11 マサキ 一歩ずつ、一緒にできるようになろう！
Cut12 栄光   ……ぼく、これ、やってみたい。
Cut13 パパ   ……見に行くだけ、行ってみる？
      アイカ 強くなる前に、優しくなろう。
Cut14 ナレ   世界一、初心者に優しい格闘技ジム。FLATUP GYM。
Cut15 マサキ こわかったら、まずは見るだけでいいよ。
      ナレ   初回体験、500円。ご予約は、公式LINEから。（エンドカードを止めている6秒の間に読む）
```

---

## カット別 FLUX 画像プロンプト（英語）

- **現実パートの共通接尾**: `warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, cinematic depth of field, vertical 9:16, no text, no tattoos, no brand logos`
- **妄想パートの共通接尾**: `black and white 1990s Japanese delinquent manga parody style, bold ink lines, speed lines, screentone shading, comedic and exaggerated, no blood, no violence, no scary faces, vertical 9:16, no readable text, no tattoos, no brand logos`
- 人物が出るカットは、上の表の固定ブロックを必ず入れる。

**Cut 1 — 段ボールの部屋**
```
A small cozy Japanese apartment living room at night, stacks of cardboard moving boxes, a handwritten moving memo on the table, warm lamp light, rain-free calm night outside the window, quiet and slightly lonely mood, no people, warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, cinematic depth of field, vertical 9:16, no text, no tattoos, no brand logos
```

**Cut 2 — 夜中の検索**
```
A Japanese mother in her early thirties, shoulder-length brown hair in a loose low ponytail, oversized beige cardigan, kind but worried eyes, sitting on a futon at night looking at her smartphone with a frowning face, the phone screen lighting her face, a gentle 6-year-old chibi boy, 2.5-head-tall, soft black bowl-cut hair, rosy cheeks, light-green dinosaur pajamas, sleeping peacefully next to her, moving boxes in the background, warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, cinematic depth of field, vertical 9:16, no text, no tattoos, no brand logos
```

**Cut 3 — 劇画・ミニバンの列（妄想）**
```
A long line of large black minivans parked side by side along a wide suburban national road at night, blue LED underglow, dramatic low angle, glowing headlights, an airplane flying in the night sky above, black and white 1990s Japanese delinquent manga parody style, bold ink lines, speed lines, screentone shading, comedic and exaggerated, no blood, no violence, no scary faces, vertical 9:16, no readable text, no tattoos, no brand logos
```

**Cut 4 — 劇画・車内のオチ（妄想）**
```
Inside a large minivan, the back seat with a cute child safety seat and a fluffy teddy bear, tiny sneakers on the floor, blue LED light glowing softly, comedic reveal composition with sparkle effects around the child seat, black and white 1990s Japanese delinquent manga parody style, bold ink lines, speed lines, screentone shading, comedic and exaggerated, no blood, no violence, no scary faces, vertical 9:16, no readable text, no tattoos, no brand logos
```

**Cut 5 — 寝顔をなでる**
```
The Japanese mother with shoulder-length brown hair in a loose low ponytail and an oversized beige cardigan, gently stroking the hair of the sleeping 6-year-old chibi boy with a soft black bowl cut and light-green dinosaur pajamas, her expression tender but anxious, dim warm night light, warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, cinematic depth of field, vertical 9:16, no text, no tattoos, no brand logos
```

**Cut 6 — 保育園の回想**
```
A bright Japanese nursery school playroom in soft hazy flashback tones, a gentle 6-year-old chibi boy, 2.5-head-tall, soft black bowl-cut hair, big round brown eyes, wearing a yellow nursery smock, looking down silently with teary eyes while another child walks away holding his toy blocks, soft pastel light, slightly blurred dreamy edges, warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, cinematic depth of field, vertical 9:16, no text, no tattoos, no brand logos
```

**Cut 7 — パパの提案**
```
A Japanese father in his mid thirties, short black hair, round glasses, gray hoodie, soft friendly face, sitting next to the worried mother on the living room floor among moving boxes, placing a glass of barley tea in front of her and talking gently, warm lamp light, warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, cinematic depth of field, vertical 9:16, no text, no tattoos, no brand logos
```

**Cut 8 — 劇画・怖そうなコーチ（妄想）**
```
A huge silhouetted martial arts coach seen from behind in a dramatic backlit old dojo, holding a bamboo sword planted on the floor, face completely hidden in shadow, dust floating in the light, over-the-top dramatic composition played for comedy, black and white 1990s Japanese delinquent manga parody style, bold ink lines, speed lines, screentone shading, comedic and exaggerated, no blood, no violence, no scary faces, vertical 9:16, no readable text, no tattoos, no brand logos
```

**Cut 9 — 劇画・リーゼントのちび栄光くん（妄想）**
```
A tiny 2.5-head-tall chibi 6-year-old boy with a huge exaggerated pompadour hairstyle, wearing a long delinquent school coat that is far too big for him, arms crossed trying to look tough but looking adorable, sparkle and speed lines behind him, black and white 1990s Japanese delinquent manga parody style, bold ink lines, speed lines, screentone shading, comedic and exaggerated, no blood, no violence, no scary faces, vertical 9:16, no readable text, no tattoos, no brand logos
```

**Cut 10 — 「やっぱり無理！」**
```
The Japanese mother holding her head in both hands in a comedic panic on the living room floor, the father beside her with an awkward smile, in the background the 6-year-old chibi boy in light-green dinosaur pajamas sitting up on the futon and rubbing his sleepy eyes, warm lamp light, warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, cinematic depth of field, vertical 9:16, no text, no tattoos, no brand logos
```

**Cut 11 — スマホの中のFLATUP**（マサキの canon 画像を添付）
```
Close-up of a smartphone screen held in a mother's hands, on the screen a bright clean gym with white floor and green wall mats, a cheerful young male kickboxing instructor with spiky black hair, black sleeveless FLAT UP GYM tank top, blue and white muay thai shorts, black wristwatch on left wrist, barefoot, holding a focus mitt while smiling chibi kids punch it happily, warm glow from the screen in a dark room, warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, cinematic depth of field, vertical 9:16, no text, no tattoos, no brand logos
```

**Cut 12 — 目がキラッ**（メルティの canon 画像を添付）
```
The gentle 6-year-old chibi boy with a soft black bowl cut and light-green dinosaur pajamas peeking at his mother's smartphone, his big round brown eyes sparkling with excitement, the phone screen showing a friendly female kickboxing instructor with short wavy light-blonde hair, a soft red headband, and a warm smile, glow from the screen lighting his face, warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, cinematic depth of field, vertical 9:16, no text, no tattoos, no brand logos
```

**Cut 13 — 両親が見合わせる**
```
The Japanese mother and father sitting on the living room floor among moving boxes, looking at each other and starting to smile softly, the 6-year-old chibi boy in light-green dinosaur pajamas between them holding the smartphone with both hands, warm hopeful lamp light, warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, cinematic depth of field, vertical 9:16, no text, no tattoos, no brand logos
```

**Cut 14 — 夜明けとタイトル**
```
Dawn sky over a quiet Japanese suburban town with a pagoda-style temple roof silhouette and fields, an airplane rising into the pink and gold sunrise, hopeful new-beginning mood, empty space at the center for a title logo, warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, cinematic depth of field, vertical 9:16, no text, no tattoos, no brand logos
```

**Cut 15 — 灯りのエンドカード**
```
Exterior of a cozy martial arts gym at sunset with warm light glowing from the windows, a small 6-year-old chibi boy with a soft black bowl cut seen from behind hugging a focus mitt and looking at the gym, large empty space in the upper half for text and a QR code, gentle hopeful mood, warm 3D animation movie style, Pixar/Illumination quality, soft warm lighting, vertical 9:16, no text, no tattoos, no brand logos
```

---

## カット別 動画プロンプト（英語・I2V用）

共通ルール: `one gentle motion only, fixed camera, background unchanged, 6 seconds`。cheap 方式なら動画化はせず、ゆっくり寄るだけで十分。動画化するなら **Cut 3・9・12** を優先する（動きで笑い・感動が増えるカット）。

- **Cut 1**: `Slow subtle dolly-in toward the moving boxes, lamp light flickers softly, quiet night.`
- **Cut 2**: `The mother scrolls her phone with one thumb and her eyebrows slowly knit together, the boy breathes softly in his sleep.`
- **Cut 3**: `The minivan headlights turn on one by one down the line, blue glow pulses, speed lines intensify, the airplane crosses the sky.`
- **Cut 4**: `Slow push-in toward the child seat, sparkles pop around the teddy bear in a comedic reveal.`
- **Cut 5**: `The mother gently strokes the boy's hair once, her smile fades into a worried look.`
- **Cut 6**: `The boy lowers his head slowly, a small tear forms in his eye, the other child walks out of frame.`
- **Cut 7**: `The father sets down the glass of tea and turns to the mother, speaking gently with a small hand gesture.`
- **Cut 8**: `The bamboo sword taps down on the floor once with a dramatic dust puff, the silhouette stays still, comedic drama.`
- **Cut 9**: `The tiny pompadour boy strikes a tough pose, then his oversized coat slips off one shoulder, comedic.`
- **Cut 10**: `The mother shakes her head in comedic panic, the boy in the background sits up and rubs his eyes.`
- **Cut 11**: `On the phone screen a kid punches the mitt and the instructor cheers, the screen glow flickers softly.`
- **Cut 12**: `The boy's eyes widen and sparkle, a small smile spreads across his face.`
- **Cut 13**: `The parents turn to look at each other and smile softly, the boy hugs the phone.`
- **Cut 14**: `The airplane rises slowly into the sunrise, the light brightens, the title space glows gently.`
- **Cut 15**: `The window light of the gym slowly grows warmer and brighter, the boy hugs the mitt a little tighter, fixed camera.`（Cut 15 は9秒。動かさず静止画でもよい）

---

## 編集メモ（CapCut）

- **BGM**: Cut 1〜2 と 5〜7 は静かなピアノ。妄想カット（3・4・8・9）は90年代ロック風のギターを一瞬だけ入れ、戻ったら止める（落差で笑わせる）。Cut 11 から明るい曲に切り替え、Cut 14 で盛り上げる。
- **効果音**: 妄想に入るとき「ガガーン」、Cut 3「ブォンッ」、Cut 8「ドンッ」、Cut 12「キラッ」。
- **ルビ**: 「玄関口（ゲートウェイ）」「地元民（ジモティ）」は字幕でもルビ風に（小さい文字を上に重ねる）。
- **ロゴ**: Cut 14 の最後の2秒と、Cut 15 のエンドカード（Cut 15 では、ブランドの2行の文字は省き、ロゴだけ置く）。
- **エンドカード**: 文字・QRコードは CapCut で重ねる（画像AIに描かせない）。エンドカードの文面と数字は [omnibus_series_bible.md](omnibus_series_bible.md) §4 の型を使い、公開前に `openqlow/src/shared/canon.ts` と照合する。
- **次回予告**: 入れない（オムニバスの帰着点は体験の案内なので、動画の最後は Cut 15 のエンドカードで終える）。次の話（例：第3話「『かえして』が言えた日」・[manga_ep03_kaeshite.md](manga_ep03_kaeshite.md)）を知らせたいときは、投稿文に書く。
