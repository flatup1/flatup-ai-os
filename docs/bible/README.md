<!-- この巻は「索引」であり正本ではない。内容を書き写して増やさないこと。
     正本と食い違ったら必ず正本が勝つ。全体の使い方は README.md を読む。 -->

# FLATUP GYM Animation Bible（索引）

**この 18 巻は正本ではない。正本の場所を指す索引である。**

FLATUP GYM のアニメ制作は、すでに 10万文字以上のドキュメントと、
45個のテストが検査する実行可能な正本（`src/movie/*.ts`）を持っている。
それを書き写して 18 巻に作り直すと、**正本が二重になり、どちらが正しいか
分からなくなる**。このプロジェクトが最も避けている失敗がそれ。

だからこの索引は、各テーマについて次の 3 つだけを書く。

1. **正本はどこか**（読むべきファイルと節）
2. **絶対に破ってはいけないこと**（そのテーマ固有のもの）
3. **まだ決まっていないこと**（JIN の判断が要る質問）

3 が空でない巻は、**そこがこのプロジェクトの未完成部分**である。
勝手に埋めないこと。埋めた瞬間、それは事実ではなく創作になる。

## 巻の一覧

| 巻 | テーマ | 正本の充足度 |
|---|---|---|
| [00_PROJECT_OVERVIEW](00_PROJECT_OVERVIEW.md) | 何を作っているか | ✅ 十分 |
| [01_BRAND_BIBLE](01_BRAND_BIBLE.md) | ブランド・トーン | 🟡 一部 |
| [02_WORLD_BUILDING](02_WORLD_BUILDING.md) | 世界観・ルール | ✅ 十分 |
| [03_CHARACTER_BIBLE](03_CHARACTER_BIBLE.md) | 登場人物 | 🟡 一部（後述） |
| [04_GYM_REFERENCE](04_GYM_REFERENCE.md) | ジムの実物再現 | ✅ 十分 |
| [05_STORY_BIBLE](05_STORY_BIBLE.md) | シリーズ構成 | 🟡 タイトルのみ |
| [06_SCREENPLAY](06_SCREENPLAY.md) | 脚本 | 🟡 第0話のみ |
| [07_PROMPT_LIBRARY](07_PROMPT_LIBRARY.md) | プロンプト部品 | ✅ 十分 |
| [08_IMAGE_GUIDE](08_IMAGE_GUIDE.md) | 画像生成 | ✅ 十分 |
| [09_VIDEO_GUIDE](09_VIDEO_GUIDE.md) | 動画生成 | ✅ 十分 |
| [10_ANIMATION_RULE](10_ANIMATION_RULE.md) | 動きの原則 | 🟡 一部 |
| [11_SOUND_GUIDE](11_SOUND_GUIDE.md) | 音 | ✅ 第0話は十分 |
| [12_WEB_SYSTEM](12_WEB_SYSTEM.md) | Webシステム | ❌ 存在しない |
| [13_AI_PIPELINE](13_AI_PIPELINE.md) | 生成パイプライン | ✅ 十分 |
| [14_MARKETING](14_MARKETING.md) | 集客 | 🟡 一部 |
| [15_GITHUB_STRUCTURE](15_GITHUB_STRUCTURE.md) | リポジトリ構成 | ✅ 十分 |
| [16_DEVELOPMENT_RULES](16_DEVELOPMENT_RULES.md) | 開発規約 | ✅ 十分 |
| [MASTER_PROMPT](MASTER_PROMPT.md) | 他AIへ渡す一文 | ✅ |

✅ = そのまま作業できる ／ 🟡 = 部分的、未確定あり ／ ❌ = 素材ゼロ

## 他のAIに渡すとき

`../flatup_handoff.md` 1枚を渡せばよい（4,000文字）。
この索引全体を読ませる必要はない。詰まったときに該当の巻を開く。
