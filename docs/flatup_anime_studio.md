# FLATUP アニメスタジオ（7段階・Colab不要版）

「夜のジムでミットが話し始める」ような **温かい3D映画風のブランド広告** を、
Colab/ComfyUI なしで作るための手順書。実行基盤は fal.ai（画像=FLUX、動画=Hailuo I2V）と
このリポジトリのコマンドだけ。

> 提案されていた7段階構成（01_SETUP〜07_FINAL_EDIT）をそのまま、
> 環境構築ゼロのコマンドにマッピングしてある。

| 段階 | 内容 | 使うもの |
|---|---|---|
| 01 SETUP | 環境構築 | `.env` に `FAL_KEY` を書くだけ（済んでいれば何もしない） |
| 02 BRAND_SETUP | 世界観・色・理念 | `src/data/`（既存のジム知識）+ このファイルのキャラバイブル |
| 03 CHARACTER_STUDIO | キャラの基準画像 | `npm run img -- "<英語プロンプト>" --count 4` で候補4枚→1枚採用 |
| 04 STORYBOARD | 物語・絵コンテ・カット別プロンプト | `npm run dev -- anime_ad "テーマ"` |
| 05 IMAGE_STUDIO | カット別の基準画像 | 04で出たFLUXプロンプトを `npm run img` へ |
| 06 VIDEO_STUDIO | 6秒動画化 | 04で出たHailuoプロンプトを `npm run reel` の `--image` へ、またはfal Playground |
| 07 FINAL_EDIT | BGM・字幕・書き出し | CapCut（字幕は04の絵コンテのセリフをコピペ） |

---

## キャラクターバイブル（JINが確定させる欄）

キャラの一貫性は「毎回同じ基準画像を使う」ことで作る。まず下を埋め、
03で基準画像を確定し、以後**全カットでその画像を参照**する。

### あぷちゃん（マスコット・設定未確定）
- 種族/姿: （例: 赤いグローブの妖精? 子グマ? → 未定）
- 色: （FLATUPブランド色: 黄色/蛍光ピンク/緑?）
- 性格: （例: 応援好き、恥ずかしがり）
- 口癖: （例: 「いっぽずつ、いこ」）

### ミットくん
- 姿: 白×緑のフォーカスミットに大きな優しい目
- 性格: 夜になると今日の頑張り屋さんを思い出す世話焼き

### サンドバッグ姉妹
- 姿: 黄色（姉・しっかり者）と蛍光ピンク（妹・おっとり）のサンドバッグ。眠そうなまぶた

---

## 最初の完成目標（6秒×1カット）

**「夜、誰もいないFLATUP GYM。ミットくんが目を開き、サンドバッグ姉妹に話しかける」**

### 手順（総費用 約¥40・約10分）

1. **基準画像**（03）:
```bash
npm run img -- "Warm 3D animation movie still, a cozy martial arts gym at night with lights dimmed, a cute white and green focus mitt character with big friendly closed eyes resting on a shelf, a yellow punching bag and a neon pink punching bag hanging with sleepy gentle faces, white floor, green training mats, potted plants, a softly lit FLATUP GYM sign on the white wall, moonlight through the window, heartwarming toy-story mood, no humans, vertical 9:16" --count 4
```
2. 4枚から「ミットの目・サンドバッグの顔が可愛い1枚」を選ぶ
3. **動画化**（06）: fal Playground（Hailuo 2.3 Fast I2V）にその画像を入れて:
```
The focus mitt character slowly opens its big friendly eyes and looks toward the punching bags.
The pink punching bag sways gently as if just waking up, the yellow one tilts slightly as if
listening. Soft warm night lighting, cozy magical mood, fixed camera, background unchanged,
one gentle motion only, 6 seconds.
```
4. **字幕**（07・CapCut）: 「今日いちばん頑張ったのは…」→ 最後の1秒にロゴ
5. 合格基準は動物リールと同じ5項目採点（75点以上で投稿）

### 続きのカットを作るとき
```bash
npm run dev -- anime_ad "夜のジムでミットがサンドバッグに話しかける"
```
→ 3〜5カットの絵コンテ+カット別FLUX/Hailuoプロンプトが一式出る。
カットごとに「同じ照明・同じ舞台」で画像→動画の順に作り、CapCutでつなぐ。

---

## 運用ルール（アニメ広告版）

- 怖い顔・傷つく描写・暴力は作らない（優しい世界のまま）
- ジム公式アカウント用。動物ミーム量産アカウントとは分ける
- 人間を出すときは後ろ姿・手元のみ（実在会員の顔をAIで作らない）
- AI生成ラベルON・投稿前の人間確認は必須
- SDXL/Colabノートブックは使わない（品質・工数の両面で不利。詳細は animal_reels_factory.md の方針と同じ）
