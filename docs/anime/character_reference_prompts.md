# 基準画像のプロンプト（採用ずみの見た目）

**状態**：見た目は決定ずみ（2026-11-02 JIN）。**画像の生成は、費用がかかるため、JINの承認を待つ**（まだ生成していない）。生成したら、採用した1枚を基準画像として `assets/` に置き、以後の全話で、文章だけで毎回作り直さず、この画像を参照する（マスタープロンプト §8、設計書）。

- 絵柄：ペンのインク線＋彩色の2D漫画絵（#14）。参考は [manga_research/homage_guidelines.md](manga_research/homage_guidelines.md) §8（8枚目の方向）。
- 実在の人に似せない。参考画像（他作品のキャラ）は生成に渡さない。
- 文字・ロゴ・タトゥーは入れない。服に読める文字を入れない（ジムのジャケットも、胸の小さなロゴ位置を空けた無地）。
- **仮の前提（JINの返事待ち）**：①家族（栄光・ママ・パパ）の絵柄は、ジムの中と同じペン線の2D漫画絵にそろえる ②栄光くんの6歳の誕生日は、引っ越し（第1話）の約3か月後 ③画像の生成は費用の承認待ち（まだ生成していない）

## 共通ブロック（英語）
```
Japanese manga illustration with bold pen-and-ink outlines, fine crosshatching and flat vivid color fills,
character reference sheet on a plain off-white background: front view, left side view, right side view, back view,
and a row of five facial expressions, consistent proportions and outfit across all views,
original character design, not based on any real person,
no logos, no readable text on clothing, no tattoos, no blood
```

## 1. 栄光（えいこう）くん（採用：B 前髪で半分かくれた目）
- **5歳版と6歳版を、別のシートで作る**。6歳版は、背が少し伸び、乳歯が1本抜けている（口を開けたときだけ見える）
- 4頭身。髪は短めの茶色、前髪が目にかかる。**小さい画面でも見えるように、前髪のすき間から片目が必ず見える形にして、目に白いハイライトを入れる**（審査での注意：目が隠れすぎない）
- 服（案B）：家＝水色のくまのパジャマ／保育園＝オレンジのスモック／ジム＝灰色のTシャツと黒のショーツ、裸足
- 小物（企画表 §2-5・設計書 §5-4 の【提案】。JIN採用待ち。基準画像には入れず、承認後に別カットで足す）：5歳版＝通園かばん／6歳版＝水筒。読める文字・ロゴは入れない
- シルエットの目印：前髪で半分かくれた目
- 表情5種：①ふつう（口は小さく結ぶ）②不安（口元に両手）③びっくり（目を丸く）④ほっとする（目を細める）⑤決意（頬に手、眉に力）。**泣き顔のアップは使わない**
```
[共通ブロック], a gentle shy [5-year-old | 6-year-old] boy, about 4 heads tall,
short brown hair with long bangs covering part of his eyes but one eye clearly visible with a white highlight,
[home: light blue bear pajamas | nursery: orange smock | gym: gray t-shirt and black shorts, barefoot],
small mouth, soft worried eyebrows, rosy cheeks,
[6-year-old only: one baby tooth missing, visible when he opens his mouth]
```

## 2. ママ（採用：A 低い一つ結び＋スマホ）
- 6.5頭身。肩までの茶色の髪を、低い位置でゆるく一つ結び。大きめのベージュのカーディガン、白いTシャツ、デニム
- **スマホをいつも片手に持つ**。目が大きく、感情が全部、目に出る
- シルエットの目印：低い一つ結びと、スマホを持つ手
- 表情5種：①ふつう ②心配（眉が上がり、汗のしずくが1つ）③妄想（目が点）④安心（目を細め、口元がゆるむ）⑤おどろき（目を見開き、口が小さく丸く）
```
[共通ブロック], a gentle worried Japanese mother in her early thirties, about 6.5 heads tall,
shoulder-length brown hair in a loose low ponytail, oversized beige cardigan over a white t-shirt and jeans,
wide expressive eyes, holding a smartphone in one hand
```

## 3. パパ（採用：B 寝ぐせ＋ゆるいジャージ）
- 7頭身。短い黒髪に少しの寝ぐせ、無精ひげが少し。ネイビーのシャツとゆるいジャージ。少しがっしりした体つき
- 目はのんびり、口はいつも半開き。**「実は一番心配している」は、顔ではなく手元で見せる**（麦茶を飲まずに持つ、スマホを伏せる）
- シルエットの目印：寝ぐせと、のんびりした目
- 表情5種：①のんき ②考え中（目がななめ上）③心配（本人はかくしているつもり。手元に出る）④照れ ⑤静かな笑い
```
[共通ブロック], a laid-back gentle Japanese father in his mid thirties, about 7 heads tall,
short black hair with a slight bed-head, faint stubble, navy shirt and loose track pants, slightly sturdy build,
relaxed half-open mouth and sleepy kind eyes, holding a glass of barley tea
```

## 4. アイカ（採用：A 耳にかけた髪＋まくった袖。**シリーズの正本になる**）
- 7頭身、背が高く姿勢がよい。肩までの濃い茶色の髪、ゆるいウェーブ、片側を耳にかける
- 服：紺の無地のジップジャケット（袖をまくる。胸に小さなロゴ位置を空けるだけで、文字は入れない）、白いTシャツ、黒いパンツ、裸足
- 目は静かで、口元だけ少しほほえむ。**怒らない。下から見上げる構図が似合う**（手引き §8 の2枚目の方向）
- シルエットの目印：耳にかけた髪と、まくった袖
- 表情5種：①静かなほほえみ ②聞いている（まゆが少し下がる）③おどろき（小さく）④やさしい笑い ⑤きびしいのではなく、まっすぐ（怒りなし）
```
[共通ブロック], a calm trustworthy Japanese woman in her mid thirties who owns a martial arts gym, about 7 heads tall,
shoulder-length dark brown wavy hair tucked behind one ear, navy plain zip jacket with sleeves rolled up (blank chest, no lettering) over a white t-shirt,
black pants, barefoot, quiet kind eyes with a slight smile, upright posture
```

## 生成の前に確かめること
1. JINの承認（費用）。1人ずつ、まず1枚だけ生成して、見た目を確かめてから、シート全体に進む
2. 生成した絵に、他の作品のキャラに似た特徴（髪型・服の組み合わせ）がないか、人が見る
3. 採用した1枚は、全話で参照する（文章だけで毎回作り直さない）
4. 実在の人に似ていないか、人が見る

## 直しの記録（2026-11-02・採点 r2 の指摘から）

1. **アイカの服から「FLAT UP GYM」の文字を外した**（日本語の説明を「紺の無地のジップジャケット」に、英語プロンプトに "blank chest, no lettering" を足した）。胸の小さなロゴ位置を空けた無地にする決まりを、冒頭の注意にも足した
2. **仮の前提3つを冒頭に「仮」と書いた**（家族の絵柄はペン線の2D／6歳の誕生日は約3か月後／画像生成は費用の承認待ちで、まだ生成していない）
3. **栄光くんの小物（通園かばん・水筒）を【提案】として足した**（2026-11-02・独立審査員 79点のあと）。基準画像のプロンプトには入れない（採用されていないため）
