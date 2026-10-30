# FLATUPアニメ オープニング「世紀末ナリタ」制作仕様

**結論**：『北斗の拳』風の世紀末パロディで始まり、温かい3DのFLATUP GYMで終わる、約48秒のオープニング。6秒のカット×8。「不良はアスリートに勝てない」を、**殴らずに**見せる（よける→相手を守る）。

- 漫画版 → [manga_seikimatsu_narita_ep1.md](manga_seikimatsu_narita_ep1.md)
- 線引き → [manga_research/homage_guidelines.md](manga_research/homage_guidelines.md)（『北斗の拳』の研究行はDBの「北斗の拳シリーズ」）
- キャラの正本 → [../flatup_animation_bible.md](../flatup_animation_bible.md)

## ⚠️ 公開前に確認すること
- 「成田は不良の多い荒れた土地」は、言い切った直後に「……と、ネットに書いてあった」で必ず崩す。街を事実として悪く言わない
- 雑魚は**怖くなく、間抜けに**描く。誰も殴られない・血が出ない
- 原作の冒頭ナレーション、決めゼリフ、やられ声、七つの傷、トゲ付き肩パッド、拳法名、主題歌、ロゴ書体は使わない

## 絵コンテ

| # | 秒 | 画 | ナレーション・セリフ | 効果音・BGM |
|---|---|---|---|---|
| 1 | 0–6 | 真っ黒な画面に、1文字ずつ「202X年」 | （ナレ・低く重く）202X年。AIは、人間の仕事を、ぜんぶ覚えてしまった。 | 風、低い太鼓「ドォン」 |
| 2 | 6–12 | 砂に埋もれたオフィス街。割れたモニター。ネクタイ姿の男たちが荒野をさまよう | ホワイトカラーは職を失い、街は荒野と化した。 | 砂嵐、オリジナルの壮大なコーラス |
| 3 | 12–18 | パーカー姿のエンジニアたちが、ノートPCを盾、キーボードをヌンチャクのように構えてにらみ合う。全員が同時にCtrl+Z | 職を失ったエンジニアたちは、抗争を繰り返した。（字幕だけ小さく）※全員、元に戻しただけ | 「カタカタッ！」→脱力音「ポコン」 |
| 4 | 18–24 | 荒野の空に、白抜きの大文字（後から重ねる）「力と技の時代」 | AIに奪えないもの——それは、鍛えた体と、磨いた技だった。世界は、フィジカルとテクニックが支配する戦国時代へ。 | 雷「ゴロゴロ…ドンッ」 |
| 5 | 24–30 | 砂嵐の滑走路。遠くに寺の屋根のシルエット。看板「NARITA」 | そして、成田。古来より、不良の多い荒れた土地である。（急に早口・小声で）……と、ネットに書いてあった。 | 音楽がピタッと止まる |
| 6 | 30–36 | 黒ずくめにサングラスとチェーンの雑魚三人衆が、原付とミニバンで砂煙を上げて登場 | 三人衆：ヒャッハー！！ 黒田：ここが噂の、初心者でも入れる格闘技ジムかぁ!? | エンジン「ブォンブォン」、ロック調ギター |
| 7 | 36–42 | 砂煙の向こうにマサキのシルエット。黒田が飛びかかる→マサキは半歩よけるだけ→黒田は自分のチェーンにつまずく→マサキが腕を支え、頭を打たないようにそっと寝かせる | マサキ（にっこり）：むしろ大歓迎！ まずは、ケガしない転び方から教えよっか。 | 風切り「シュッ」→「ポスッ」 |
| 8 | 42–48 | 3Dに戻る。夕焼けのFLATUP GYM。三人衆がサングラスを外し、正座して礼。手にミット。タイトル | （ナレ）この荒野に、ひとつだけ灯りがある。**世界一、初心者に優しい格闘技ジム ── FLATUP GYM** | 温かい曲へ、タイトルで「ドンッ」 |

## 画像プロンプト（英語）

- **劇画パート（Cut 1–6）の共通接尾**: `post-apocalyptic 1980s Japanese action manga parody style, heavy black ink, dramatic hatching, harsh rim light, sand storm, comedic exaggeration, no blood, no violence, no weapons hitting anyone, no spiked shoulder pads, no tattoos, no brand logos, no readable text, vertical 9:16`
- **3Dパート（Cut 7–8）の共通接尾**: `warm 3D animation movie style, Pixar/Illumination quality, warm sunset light, no tattoos, no brand logos, no text, vertical 9:16`

| # | プロンプト |
|---|---|
| 1 | `Pitch black screen with faint drifting sand particles and a distant glowing horizon line, ominous mood` ＋劇画接尾 |
| 2 | `Ruined office district half buried in desert sand, cracked computer monitors in the dunes, men in loose neckties wandering aimlessly under a blood-orange sky` ＋劇画接尾 |
| 3 | `Two rival groups of unemployed engineers in hoodies facing off in a wasteland, holding laptops like shields and keyboards like nunchaku, dead-serious faces played for comedy` ＋劇画接尾 |
| 4 | `Vast wasteland under a stormy sky with lightning, empty space in the upper half for a large title, epic scale` ＋劇画接尾 |
| 5 | `Abandoned airport runway in a sand storm, a distant silhouette of a traditional Japanese temple roof, a weathered road sign, desolate epic mood` ＋劇画接尾 |
| 6 | `Three comedic minor thugs in all-black outfits, sunglasses and chains, riding scooters and a big black minivan through a dust cloud, all raising both arms and shouting with huge open mouths, silly rather than scary` ＋劇画接尾 |
| 7 | マサキの canon 画像を添付。`A cheerful young kickboxing instructor with spiky black hair, black sleeveless FLAT UP GYM tank top, blue and white muay thai shorts, black wristwatch on left wrist, barefoot, calmly stepping half a step aside while gently catching the arm of a clumsy thug in black who tripped over his own chain, protecting his head as he lands softly, dust cloud, kind smile` ＋3D接尾 |
| 8 | `Exterior of a cozy martial arts gym at sunset, three former thugs in black with sunglasses pushed up, kneeling politely in a row and bowing, holding focus mitts, the smiling instructor bowing back, warm hopeful mood, empty space at top for a title` ＋3D接尾 |

動きをつけるのは Cut 6 と Cut 7 だけで十分。残りは、ゆっくり寄るカメラワークで見せる。

## 体験への案内（オムニバス共通のルール）

- **各話の頭に付けるとき**：Cut 8 で終える（案内は各話の最後に入る）。
- **オープニングだけを単独で投稿するとき**：Cut 9（6秒・計54秒）として「灯りのエンドカード」を足す。橋渡しのセリフは、三人衆が声をそろえて「オレたちにも、できたんスから。」。
- エンドカードの文面と数字は [omnibus_series_bible.md](omnibus_series_bible.md) §4 の型を使い、公開前に `openqlow/src/shared/canon.ts` と照合する。
