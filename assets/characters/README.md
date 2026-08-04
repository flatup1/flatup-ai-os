# キャラクター基準画像（顔ブレ防止）

ANIMATION BIBLE v3.0「制作時の使い方」1.
**「各キャラ1枚を確定し、以後全カット・全話でその画像を参照する」** の置き場所。

ここに画像を置くだけで、EP1の画像生成が**そのキャラの顔・服・頭身を保ったまま**各カットを作る。

## 置き方

ファイル名は**キャラID**にする（拡張子は png / jpg / jpeg / webp）。

```
assets/characters/
├── tsumu.png    ← ツム（シリーズ主人公）
├── riku.png     ← リク
├── yui.png      ← ユイ
├── sota.png     ← ソウタ
├── koko.png     ← ココ
└── masaki.png   ← マサキ（コーチ）
```

置いたら `npm run anime:ep1:images` を実行するだけ。設定変更は不要。

## 何が変わるか

| 状態 | 使うモデル | キャラの再現 |
|---|---|---|
| 画像を置いた | `fal-ai/nano-banana/edit`（参照対応） | **基準画像そのままの顔で全カット生成** |
| 置いていない | `fal-ai/flux/dev` | 文章の姿かたちで近づける（毎回ブレる） |

置いたキャラだけが参照される。一部だけ置いてもよい（残りは文章で補完）。

## 基準画像の作り方

`npm run img` で作り、良い1枚を選んでこのフォルダに置く。

```bash
npm run img -- "a 2.5-head-tall chibi 5-year-old girl with light brown wavy hair in a small ponytail, large round glossy brown eyes, white t-shirt and light blue FLAT UP GYM muay thai shorts, barefoot, warm 3D animation movie style, Pixar quality, clean plain background, full body, front view" --count 4
```

**良い基準画像の条件**
- 全身が写っている（顔だけだと体型・服が固定できない）
- 背景がシンプル（白〜薄いグレー）
- 正面向き・自然な立ち姿
- 表情はニュートラル（笑顔で固定すると全カット笑顔になる）
- 1枚に1キャラだけ（三面図は正面のコマだけ切り出して使う）

## 変更できる環境変数

| 変数 | 既定 | 説明 |
|---|---|---|
| `FAL_IMAGE_EDIT_MODEL` | `fal-ai/nano-banana/edit` | 参照ありのときのモデル |
| `FAL_IMAGE_MODEL` | `fal-ai/flux/dev` | 参照なしのときのモデル |

## 注意

- **実在会員の顔に寄せない**（バイブルの禁止事項）。すべてオリジナルキャラとして作る。
- 画像そのものは容量が大きいので、必要に応じて Git LFS か、リポジトリ外での管理を検討する。
