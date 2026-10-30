# FLATUPアニメ オープニング「世紀末ナリタ」制作仕様（下書き）

**結論**：シリーズの予告（単独で投稿する。本編とは別）。48秒・縦9:16。引っ越し前の夜、ママがスマホで見た「ネットの成田」が、AIで世紀末になった荒野として劇画でふくらむ →「……と、ネットに書いてあった。」で崩す → 現実の FLATUP GYM（こわもての三人も、つまずいたら受け止めてもらえる。子どもがミットを鳴らす）→ 入口から中をのぞく栄光くんとママ → 題名。**世紀末はネットの噂とママの想像の中だけ**。劇画は15秒（約31%）。誰も殴られない・飛びかからない。予約の案内はしない。

- 本編（三人衆の主役回）→ [manga_seikimatsu_narita_ep1.md](manga_seikimatsu_narita_ep1.md)（扉・半歩・礼の素材を共有する）
- 第1話の正本 → [ep01_hikkoshi_canon_A.md](ep01_hikkoshi_canon_A.md)（夜のスマホの場面と、Scene 5 のミット打ちの素材を使い回す）
- 設計の正本 → [omnibus_series_bible.md](omnibus_series_bible.md) v2／いちばん上の正本 → [master_prompt_2026-10-30.md](master_prompt_2026-10-30.md)
- 線引き → [manga_research/homage_guidelines.md](manga_research/homage_guidelines.md)（世紀末モードは §1。研究の行はDBの「北斗の拳シリーズ」）
- キャラの正本 → [../flatup_animation_bible.md](../flatup_animation_bible.md)

## ⚠️ 公開前に確認すること

- 町を語る言い切り「そして成田。こわもての集う地——」と崩し「……と、ネットに書いてあった。」は、**同じカット・同じ字幕・同じ大きさ**（Cut 4）。片方だけ切り出さない（設計書 §6）
- 三人衆は怖くなく、間抜けに。町の住人で、保護者でもある。「雑魚」と呼ばない。人に飛びかからない。叫び「ヒャッハー」は小声の1回だけ（公開版に使うかはJIN確認）
- 原作の冒頭ナレーション・決めゼリフ・やられ声、七つの傷、トゲの肩パッド、拳法名、主題歌、ロゴの書体は使わない
- **家族（栄光くん・ママ）の姿は参照待ち**。正本の姿が決まるまで、Cut 1・5・13 は画像生成しない（文字と音で仮の編集だけ。第1話の正本 §5）
- シリーズ名（仮題）は画面・表紙・投稿文に出さない（設計書 §10 #11）
- AI生成の表示（InstagramはラベルON）。他社のロゴ・車種が分かる車体が写っていないか、人間が全カットを見る

## 絵コンテ（48秒）

字幕は横書き、1秒7字まで（いちばん多いところで6.2字）。字幕は画面の上から11〜62%の間。絵柄は温かい2D（家族）・劇画（ネットの中の荒野と町）・温かい3D（ジムの中）の3種類（設計書 §1-8。ジムの中を3Dにするかの最終は §10 #14）。

| # | 秒 | 絵柄 | 画 | セリフ・字幕 | 効果音・BGM |
|---|---|---|---|---|---|
| 1 | 0–3 | 温かい2D | 夜。段ボールの積まれた部屋。スマホの青白い光。となりで栄光くんが眠っている（第1話 Scene 1 の素材を使い回す。姿が決まるまでは、スマホを持つ手と光、毛布と寝息だけ） | なし | スマホの「ポチ」、時計の「コチコチ」 |
| 2 | 3–7 | 劇画パロディ（白黒） | スマホの画面から砂があふれ、白黒の荒野へ。砂に半分うまったオフィス街。回転いすに座ったまま、真顔でゆっくり砂にしずむネクタイの男たち（汗、ずれた眼鏡）。大きく「202X年」（置く文字） | ナレ（低く重く）「202X年。人間は、座りっぱなしになった。」 字幕：「人間は、座りっぱなしになった。」 | 風、低い太鼓「ドォン」 |
| 3 | 7–10 | 劇画パロディ（白黒） | 雷の荒野。空に白抜きの大文字「力と技の時代」（置く文字）。ネクタイの男が腕立て伏せ1回で、ぺしゃっとつぶれる（汗。痛がる顔にしない） | ナレ「体を動かせる人が、いちばんかっこいい。」 | 雷「ゴロゴロ……」→「ぺしゃ」 |
| 4 | 10–15 | リアル劇画（町の比喩） | 夕方の成田。国道、遠くに寺の屋根、うなぎを焼く煙。黒いミニバンが、ウインカーを出して、白線の内側にきっちり止まる。人の顔・道路の番号・お店の看板は描かない | ナレ「そして成田。こわもての集う地——」（急に早口・小声で）「……と、ネットに書いてあった。」 字幕は**2つとも同じ大きさで、このカットの中に**出す | 「カチ、カチ」、最後に音楽がピタッと止まる |
| 5 | 15–17 | 温かい2D | ママの手元。スマホを、そっと伏せる。となりの寝息 | なし | 時計の「コチコチ」、寝息 |
| 6 | 17–20 | リアル劇画（町） | 2階の扉の前。黒ずくめにサングラスの3人（三人衆）が、両手を上げて口を大きく開ける。ポーズは大きいのに、声は小さい。汗、ずれたサングラス | 三人「……ひゃっはー……」 | 低い「ゴゴゴ」が、ささやき声でしぼむ |
| 7 | 20–23 | 温かい3D | 扉が開く。温かい光の中に、マサキの笑顔 | マサキ「いらっしゃい！」 | 明るい音 |
| 8 | 23–25 | 温かい3D | 足元と腰のアップ。くつを脱いだ黒田の腰のチェーンが、扉の取っ手に引っかかって、体がかたむく | 黒田「あ。」 | 「ガチッ」 |
| 9 | 25–27 | 温かい3D | マサキの裸足が、半歩だけ前へ（足元のアップ） | なし | 「スッ」 |
| 10 | 27–30 | 温かい3D | マットに寝た黒田の頭の下に、マサキの手。マサキがのぞきこんで笑う | マサキ「おっと、あぶない。頭、打ってない？」 | 「ポスッ」 |
| 11 | 30–34 | 温かい3D | ジムの中。サングラスを外した3人（おだやかな目）が、貸し出しのグローブをつけて、立って礼。ミットを持ったマサキが礼を返す | 三人「よろしくお願いします」 | 静かな間 |
| 12 | 34–38 | 温かい3D | 子どもたちのミット打ち（第1話 Scene 5 の素材を使い回す。6歳以上に見える、名前のない子）。まっすぐのパンチが、ミットのまん中に | なし | 「パスン」、子どもたちの笑い声 |
| 13 | 38–43 | 温かい2D | 夕方。ジムの入口の外。ママの手をにぎった栄光くんが、扉のすきまから中をのぞく（2人とも後ろ姿。外観は描かず、扉からもれる光だけ）。栄光くんが、ママの手を、きゅっとにぎり直す | なし | 中から小さく「パスン」 |
| 14 | 43–48 | 黒 → 文字 | 扉の光が画面いっぱいに広がる → 黒 → 題名 | 置く文字「世界一、初心者に優しい格闘技ジム」「FLATUP GYM」→ 小さく「FLATUP GYM（成田）」「第1話『成田へ、引っ越します。』」 | 温かい曲 → 題名で「ドンッ」 |

- 劇画は Cut 2〜4・6 の15秒（48秒の約31%）。手引き §4 の「3分の1まで」に収まる
- 動画生成は Cut 8・9（足元）と Cut 12（使い回し）だけ。ほかは静止画にゆっくり寄るカメラワーク
- 「世界一、初心者に優しい格闘技ジム」は理念のコピー（第1話の正本 §4-20 の表記）。事実の順位のように使わない

## 冒頭フック3案（マスタープロンプト §7）

| 案 | 方向 | 映像（0〜3秒） | 短い字幕 | 音 | 回収 |
|---|---|---|---|---|---|
| **A（本編で使う）** | 親子のあるある | Cut 1。夜、段ボールの部屋で、スマホの光だけが明るい。となりに寝息 | なし（入れるなら「引っ越し前夜。」6字） | スマホの「ポチ」、時計 | Cut 13：同じママと栄光くんが、ジムの入口の光の前にいる。そのまま第1話へ |
| B | 意外性と笑い | Cut 6。劇画の三人衆が、ポーズは大きく、声は小さく | 「……ひゃっはー……」 | 「ゴゴゴ」がしぼむ | Cut 7〜11：扉が開いて、受け止められて、礼 |
| C | 意味を知りたくなる行動 | 暗い画面に、子どもの小さな手。扉のすきまからもれる光に、そっとふれる | なし | 小さく「パスン」 | Cut 13：のぞいていたのは栄光くん |

- B・C を使うときは、そのカットを 0〜3 秒に移し、残りを3秒詰める（Cut 5 を外し、Cut 13 を4秒にする）。劇画の割合は変わらない

## 画像プロンプト（英語）

- **劇画パロディ（Cut 2・3）の共通接尾**: `black and white Japanese action manga parody, heavy black ink, dramatic hatching, harsh rim light, sand storm, comedic exaggeration, faces made silly with sweat drops and slipping glasses, no blood, no violence, no scary faces, no weapons, no spiked shoulder pads, no tattoos, no brand logos, no readable text, vertical 9:16`
- **リアル劇画（Cut 4・6）の共通接尾**: 手引き §7 のブロック ＋ `desaturated colors, an ordinary calm Japanese town (not a wasteland, not dangerous), no road numbers, no shop signs, no readable text, vertical 9:16`。顔が見えるカットは `comedic nervous expression, sweat drops, sunglasses slipping, silly rather than scary` を足す
- **温かい3D（Cut 7〜12）の共通接尾**: `warm 3D animation movie style, soft warm lighting, no tattoos, no brand logos, no text, vertical 9:16`（バイブルと同じ言い方。他社のスタジオ名は入れない）
- **温かい2D（Cut 1・5・13）**: 家族の姿の正本が決まるまで生成しない

| # | プロンプト |
|---|---|
| 1 | 第1話 Scene 1 の素材を使う（家族の姿が決まってから） |
| 2 | `Office district half buried in desert sand, rows of office chairs on the dunes, men in loose neckties sitting still and slowly sinking into the sand with dead-serious faces, played for comedy, empty space in the upper half for a large title` ＋劇画パロディ接尾 |
| 3 | `Vast wasteland under a stormy sky with lightning, a man in a necktie doing a push-up and flopping flat on the first try, sweat drops, glasses slipping, comedic, empty space in the upper half for a large title` ＋劇画パロディ接尾 |
| 4 | `Ordinary Japanese town at dusk seen along a main road, a distant silhouette of a traditional temple roof, smoke from grilling eel drifting, a big black minivan with no logos, no emblems and no recognizable model design, parked neatly inside white lines with its turn signal blinking, no people's faces` ＋リアル劇画接尾 |
| 5 | 第1話 Scene 1 の素材の、手元とスマホだけ（家族の姿が決まってから） |
| 6 | `Three comedic tough-looking local men in all-black outfits and sunglasses (one big man with a square crew cut, round sunglasses and a wallet chain; one lanky hunched man with narrow sunglasses and a black hoodie; one small skinny young man with oversized sunglasses and a baggy black leather jacket), standing in front of a plain second-floor door, raising both arms with mouths wide open but looking nervous, sweat drops, sunglasses slipping, silly rather than scary, no signs` ＋リアル劇画接尾 |
| 7 | マサキの canon 画像を添付。`A door swinging open with warm light pouring out, the cheerful young kickboxing instructor smiling and welcoming, spiky black hair, black sleeveless FLAT UP GYM tank top, blue and white muay thai shorts, black wristwatch on left wrist, barefoot` ＋3D接尾 |
| 8 | `Close-up of feet and waist only: a big man in socks stepping forward through a doorway, the wallet chain on his belt catching on the door handle, his body starting to tilt, no faces` ＋3D接尾 |
| 9 | `Close-up of bare feet only on a white gym mat: the instructor calmly taking one small half step forward, no faces` ＋3D接尾 |
| 10 | マサキの canon 画像を添付。`A big man in black lying safely on a soft white gym mat, the instructor's hand gently placed under his head, the instructor leaning in with a kind smile, gym class room with off-white floor and pale green padded walls` ＋3D接尾 |
| 11 | マサキの canon 画像を添付。`Inside a bright clean gym with off-white floor and pale green padded walls, three burly men in black with their sunglasses taken off and gentle calm eyes, wearing rental boxing gloves, bowing politely in a row while standing, the smiling instructor holding focus mitts and bowing back, warm hopeful mood` ＋3D接尾 |
| 12 | 第1話 Scene 5 の素材（マサキと子どもたちのミット打ち）を使い回す |
| 13 | 家族の姿が決まってから：`Dusk, a parent and a small child seen from behind, holding hands, peeking through a slightly open door, warm light spilling out onto them, no signs, no building exterior details` |
| 14 | 文字だけ（編集で重ねる） |

## Instagram版とX版（マスタープロンプト §11 ⑦）

**Instagram（リール）**

- 動画：48秒をそのまま（フックA）
- 表紙：絵は Cut 13（扉からもれる光と、手をつないだ2人の後ろ姿）。劇画の画面は表紙にしない。見出し（1行18字まで・2行まで）：「親の想像は、大げさ。／現実は、あったかい。」
- 投稿文（案）：

```
引っ越し前の夜、
スマホで調べすぎて、こわくなったこと、ありませんか。

親の想像は、ちょっと大げさ。

FLATUPアニメ、はじまります。
第1話「成田へ、引っ越します。」
FLATUP GYM（成田）
※この物語はフィクションです（AIで制作）
```

- AI生成ラベルをONにする。予約・料金・時間は書かない。プロフィールの体験の導線（公式LINE）はそのまま

**X**

- 動画：48秒をそのまま使う。短くすると、劇画の世紀末だけが残って「現実は温かい」が切れるため（マスタープロンプト §9「短縮で意味が壊れるなら共通本編」）
- 投稿文（案）：

```
調べれば調べるほど、こわくなる夜。ありませんか。
FLATUPアニメ、はじまります。
※AIで作ったアニメです
```

- AI生成の表示は公開時のXの仕様に合わせる

## 閉じ方（2026-10-30 の新方針）

- オープニングは**シリーズの予告・単独投稿用**（本編とは別）。体験の予約の案内は付けない（案内は12話中の体験回だけ）。題名のあとに、小さく「FLATUP GYM（成田）」と、次の話への期待（「第1話『成田へ、引っ越します。』」）を出して終える
- 最後にナレーションは入れない（「この荒野に、ひとつだけ灯りがある」は、町を暗いもの扱いするのでやめた。設計書 §2）

---

## 直しの記録（2026-10-30・採点 r0 の指摘から）

本編（`manga_seikimatsu_narita_ep1.md`）と同じ問題は、同じ直し方にそろえた。

1. **OPを「シリーズの予告」に組み直した**。前は三人衆とマサキだけで、中心の人物（栄光くん一家）が1カットも出ず、三人衆で引きつけてから第1話（ママと5歳の子の話）へ送るので、期待と中身がずれていた（マスタープロンプト §7「関係のない事件で釣らない」）。ママの夜のスマホで始まり、ママと栄光くんがジムの光の前に立って終わる。第1話へそのままつながる
2. **世紀末を「ママがスマホで見たネットの噂」にした**。スマホの画面から砂があふれて劇画になり、「……と、ネットに書いてあった。」でママの手元に戻る（マスタープロンプト §2「劇画的な怖さは、想像や誤解として明確に描く」）
3. **失業の話をやめた**（前の Cut 1〜3「仕事を覚えてしまった」「ホワイトカラーは職を失った」「職を失ったエンジニアたちは、抗争を繰り返した」）。設計書 §2 の案「座りっぱなし → 体を動かせる人がかっこいい」にした。AIを敵にしない
4. **黒田が飛びかかる場面をやめた**。ていねいにくつを脱いで入ろうとして、チェーンが取っ手に引っかかる → マサキが半歩前に出て受け止める、にした。前の結論「不良はアスリートに勝てない」も消した（町の住人で保護者でもある人を、不良として扱わないため）
5. **前の Cut 7（6秒に4〜5つの動き）を、Cut 8・9・10 の3つに分けた**。足元のアップで1カット1つの動きにし、場所も砂煙の外からジムの扉の内側にした（裸足のマサキと合う）
6. **危ない運転をやめた**。原付で両手を離して叫ぶ場面をやめ、ミニバンは白線の内側にウインカーを出して止める
7. **「雑魚」「minor thugs」をやめた**（町の住人で、保護者でもあるため）。プロンプトは `comedic tough-looking local men` にした
8. **劇画を75%から約31%にした**（手引き §4）。ミットの「パスン」は Cut 12 で第1話 Scene 5 の素材を使い回して足した。設計書 §10 #9 の2つの問い（パスンを足すか／75%を例外にするか）は、この下書きでは両方とも不要になった（採るかはJIN）
9. **冒頭6秒の黒い画面をやめ、フック3案を足した**。0〜3秒で、人物（ママ）・状況（引っ越し前の夜）・気になること（何を見ている？）が分かる
10. **前の Cut 4 のナレーションの長さを直した**（約48字で6秒に入らなかった）。字幕は1秒7字までにした
11. **町の言い切りと崩しを、同じカット・同じ字幕の大きさにした**（Cut 4）。「不良の多い荒れた土地」をやめ、「こわもての集う地」にした
12. **滑走路をやめ、寺の屋根・うなぎの煙・夕方の国道にした**（本編と同じ。第1話と見た目がそろう）
13. **前の Cut 8 の、屋外での正座・体験者がミットを持つ絵を直した**。ジムの中で立って礼、体験者は貸し出しのグローブ、ミットはマサキ（`trial_flow.md`・`canon.ts`）。外観は描かない（実際は2階。`gym_profile.md`）
14. **「ケガしない転び方から教えよっか」を「おっと、あぶない。頭、打ってない？」にした**（設計書 §10 #8 が未決のため）
15. **プロンプトから他社のスタジオ名（Pixar/Illumination）を消した**。バイブルと同じ `warm 3D animation movie style` にそろえた
16. **最後のナレーション「この荒野に、ひとつだけ灯りがある」を消した**（設計書 §2：町は暗い、灯りはジムだけ、と言い切らない）
17. **Instagram版とX版を足した**

**取り入れなかった指摘（理由）**

- 保育園の門で頭を下げる黒田のカメオを入れる案（審査員1）：かえして回のコマ8と同じ場面になり、「怖そう→実は家族思い」の見せ方がまた増えるため。三人衆は、扉の前とジムの中だけにした
- OPを「世紀末ナリタ伝説の予告」に改める案（審査員2のもう1つの案）：設計書 v2 §5-1 で OP の役割は「シリーズの予告」なので、シリーズの予告として組み直した
- 劇画の「202X年」の語り出しをやめる案：手引き §1 で使ってよい型で、JINの要望（202X年、AIで世紀末）でもあるので残した。寄りすぎかどうかはJINが決める
