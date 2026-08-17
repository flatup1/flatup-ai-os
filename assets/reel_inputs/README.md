# 素材置き場（動画の入力に使う画像）

動画の入力に使う **基準画像** をここに置きます。

```
assets/reel_inputs/
  character/   キャラの基準画像（apu_front.png / tsumu_front.png など）
  gym/         背景（gym_day.png / gym_night.png）
  props/       小道具（yellow_foam_pad.png / mitt.png）
```

## いちばん大事なルール

**基準画像を毎回変えないこと。**

毎回ちがう画像を入れると、顔も服も雰囲気もブレます。
場面ごとに「この1枚」を決めて、以後ずっとその画像を使ってください。

```bash
npm run reel:batch -- --scene first_punch --count 12 \
  --image assets/reel_inputs/character/apu_front.png
```

## 画像の作り方

まだ基準画像が無いときは、テキストから作れます。

```bash
npm run img -- "<英語プロンプト>" --count 4     # 候補を4枚出して1枚採用
```

英語プロンプトは `docs/flatup_animation_bible.md`（本編キャラ）または
`docs/flatup_anime_studio.md`（あぷちゃん）のブロックをそのまま使ってください。

## 向いている画像

- **縦長（9:16）**。キャラが真ん中に**全身**で写っている
- 背景がごちゃついていない
- **文字が写っていない**（設計シートやグリッドはそのまま入れない。動画に文字が写ります）

## 置かないもの

- 実在の会員さん・お子さんの写真（顔を寄せた映像は作りません）
- 権利が不明な画像
- 大きな動画ファイル（Gitが重くなります）

> 画像そのものはGit管理していません（`.gitignore`）。フォルダの形だけ共有しています。
