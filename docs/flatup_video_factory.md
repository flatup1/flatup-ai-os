# FLATUP 動画ファクトリー（縦動画の量産ライン）

**結論**: 試作が終わったら、次は「1本ずつ手で回す」のをやめて、
**まとめて回して、当たりを選ぶ**ラインにします。

```bash
# ① プロンプト置き場を作る（最初の1回だけ）
npm run reel:batch -- --export-prompts

# ② first_punch を12本まとめて作る
npm run reel:batch -- --scene first_punch --count 12 \
  --image assets/reel_inputs/character/apu_front.png --budget 4
```

エンジンは **fal.ai（既定）** と **MiniMax H3（ComfyUI）** を切り替えられます。
**プロンプトの正本は1か所**なので、engineを変えても中身は同じです。

## コマンドは2つ

| コマンド | 使うとき |
|---|---|
| **`npm run reel:batch`** | **1場面を何本も**（当たりを引く作業）。フォルダ・manifest.csv・チェック表つき |
| `npm run factory` | **複数場面を横断**して回す（型が決まったあとの横展開）／H3バックエンド |

まずは `reel:batch` で `first_punch` を12本。ここから始めます。

---

## 0. 最初の一歩（この順でやる）

### STEP 1 — first_punch だけ量産する

全場面を一度に回さないこと。**FLATUPの世界観に一番合う `first_punch` の型を先に決めます。**

```
緊張 → 笑顔 → 一歩前へ → 黄色いフォームパッドへやさしいストレート
```

### STEP 2 — 12本だけ出す

```bash
npm run reel:batch -- --scene first_punch --count 12 --budget 4
```

AI動画は全部が当たりにはなりません。**当たりを引く作業**です。
12本で A2本 / B4本 / C6本 くらい取れれば十分。

### STEP 3 — 当たりだけ残す

実行すると、この形のフォルダができます。

```
output/reels/2026-08-05_first_punch/
  all/      001.mp4 … 012.mp4   ぜんぶ
  keep/     使えそう（少し編集すれば使える = B）
  post/     投稿候補（そのまま出せる = A）
  ng/       ボツ（C）
  manifest.csv   1本1行。judge欄にA/B/Cを書く
  check.md       合否チェック表（9項目）
```

見ながら `all/` から `keep/` `post/` `ng/` へ移すだけです。
`manifest.csv` の **judge** と **memo** に書き込むと、あとで
「どの画像・どのプロンプト・どのseedで当たったか」が分かります。

```csv
id,scene,image,prompt,model,seed,status,file,judge,memo
001,first_punch,apu_front.png,first_punch.md,hailuo,1000,ok,all/001.mp4,A,表情よい
002,first_punch,apu_front.png,first_punch.md,hailuo,1001,ok,all/002.mp4,C,手が崩れた
003,first_punch,apu_front.png,first_punch.md,hailuo,1002,ok,all/003.mp4,B,動きかわいい
```

### STEP 4 — 投稿用に仕上げる

CapCut で 音量調整 → テロップ → ロゴ → LINE誘導。
**文字は動画内でAIに書かせない**でください（崩れます）。必ず編集で足します。

### そのあと

`first_punch` の型が決まったら `wave` / `jab` / `masaki_welcome` に広げます。

---

## 1. なにが「量産環境」なのか

1本ずつ手で回すのと違うのは、この5つです。

| 仕組み | 何がうれしいか |
|---|---|
| **バッチ** | 場面 × テイク（seed違い）をまとめて回す。当たりを引く確率が上がる |
| **予算ガード** | 実行前に本数と金額を出す。上限を超えるなら **1本も作らずに止まる** |
| **再開** | 出来ているファイルは飛ばす。途中で止まっても同じコマンドで続きから |
| **台帳** | `logs/factory.jsonl` に1本1行。**当たったseed**と使った金額が後から分かる |
| **マニフェスト** | `manifest.csv`（judge/memo欄つき）と `check.md`（9項目）を毎回出す。人間の確認を飛ばさない |

---

## 2. 素材とプロンプトの置き場

```
assets/reel_inputs/        入力画像（character / gym / props）
prompts/reels/*.md         場面ごとのプロンプト（手で直せる実体）
output/reels/<日付>_<場面>/ 出力
logs/factory.jsonl         台帳（本数・seed・金額）
```

### 基準画像は毎回同じものを使う

毎回ちがう画像を入れると、顔も服も雰囲気もブレます。
場面ごとに「この1枚」を決めて、以後ずっとその画像を渡してください（[置き場のREADME](../assets/reel_inputs/README.md)）。

### プロンプトは md で直せる

```bash
npm run reel:batch -- --export-prompts     # prompts/reels/*.md を書き出す
```

`prompts/reels/first_punch.md` の ```` ```prompt ```` フェンスの中が**そのまま生成に使われます**。
mdを消せば `src/factory/scenes.ts`（型の正本）の内容に戻ります。

| 置き場 | 役割 |
|---|---|
| `src/factory/scenes.ts` | **型の正本**。場面の追加・テストはここ |
| `prompts/reels/*.md` | **現場で直す実体**。ある場合はこちらが優先される |

---

## 3. モデルの層を使い分ける

```bash
npm run reel:batch -- --scene first_punch --count 12 --tier fast      # 試し打ち
npm run reel:batch -- --scene first_punch --count 6  --tier standard  # 投稿候補
npm run reel:batch -- --scene first_punch --count 2  --tier pro       # 広告候補
```

モデル名は `.env` に置きます（falのモデル追加・改名に追従できるように）。

```bash
FAL_VIDEO_MODEL_FAST=<falの安いimage-to-videoモデル>
FAL_VIDEO_MODEL_STANDARD=<falの標準image-to-videoモデル>
FAL_VIDEO_MODEL_PRO=<falの高品質image-to-videoモデル>
```

> **まず型を見るのは安いモデル、最終版だけ高いモデル**。
> 12本を高品質モデルで回すのはもったいないです。

---

## 4. 失敗ぶんだけ作り直す

```bash
npm run reel:batch -- --scene first_punch --retry-failed 2026-08-05_first_punch
```

`manifest.csv` の `status` が `ok` でない行だけ、**同じseed・同じプロンプト**で作り直します。
残高切れで止まったときも、チャージ後にこれで再開できます。

---

## 5. 複数場面をまとめて回す（型が決まってから）

### まずDRY-RUN（お金がかからない）

```bash
npm run factory -- --all --takes 2
```

`FAL_KEY` が未設定なら、**全プロンプトを表示するだけ**で終わります。
場面の文章を確かめるのはここで。

### 本番

```bash
# .env に FAL_KEY と、画像→動画のモデルを入れておく
#   FAL_KEY=...
#   FAL_VIDEO_MODEL=<falのimage-to-videoモデル>

npm run factory -- --scenes first_punch --takes 3 --image assets/characters/apu.png --budget 2
```

### よく使うオプション

| オプション | 意味 |
|---|---|
| `--scenes a,b` / `--all` | 作る場面 |
| `--takes N` | 1場面あたりのテイク数（seed違い）。**3くらいから当たりが出やすい** |
| `--image PATH` | 基準画像。**渡すとキャラが崩れにくい**（I2V） |
| `--budget USD` | 想定コストの上限。超えたら1本も作らない |
| `--seed-base N` | seedの起点。同じ値なら同じ組み合わせを再現できる |
| `--force` | 出来ているファイルも作り直す |
| `--summary` | これまでの本数と使った金額を表示 |
| `--backend h3 --comfy-url URL` | MiniMax H3（Colab等のComfyUI）で作る |

---

## 6. 場面バンク（型の正本）

`src/factory/scenes.ts` にあります。**キャラの出典を混ぜないこと。**

| キー | 場面 | 出典 |
|---|---|---|
| `first_punch` | はじめの一歩（緊張→笑顔→やさしいストレート） | あぷちゃん（studio） |
| `wave` | おいでおいで | あぷちゃん |
| `jab` | 左ジャブ1発 | あぷちゃん |
| `high_kick` | 元気なハイキック | あぷちゃん |
| `rest` | 休憩中（癒し系） | あぷちゃん |
| `mitt_night` | 夜のミットくん | ミットくん（studio） |
| `masaki_welcome` | マサキ先生のごあいさつ | **ANIMATION BIBLE v3.0** |
| `tsumu_first_step` | ツムのはじめの一歩（EP1用） | **ANIMATION BIBLE v3.0** |

- **本編（EP1〜10）** を作るなら `masaki_welcome` / `tsumu_first_step` の系統
- **単発のSNSリール** なら あぷちゃんの系統
- バイブル出典の姿かたちは `src/reel/characters.ts` の `look` を**そのまま引いている**ので、
  `npm run img` で作った画像とブレません（ズレたら `npm run test:factory` が落ちます）

### 場面を増やす

`SCENES` に1件足すだけです。同じキーを
`notebooks/colab_minimax_h3_i2v.ipynb` の⑦にも足してください（テストが一致を見ています）。

```ts
{
  key: "new_scene",
  jp: "日本語の場面名",
  source: "studio",
  world: WORLD_APU,
  timeline: [
    "[0s-2s] …",
    "[2s-4s] …",
    "[4s-6s] …",
  ],
  audio: "Audio: …",
  captionJa: "投稿文の下書きの種",
}
```

守るルール（テストで見ています）:
- **1カット1技**。タイムラインは3〜4ブロックまで
- 禁止事項（`RULES`）は自動で付く。消さない
- 秒の見出し `[0s-2s]` を必ず付ける

---

## 7. エンジンの使い分け

| | fal.ai（既定） | MiniMax H3（ComfyUI） |
|---|---|---|
| 準備 | `.env` にキーだけ | A100 + 42GBのDL（[手順](minimax_h3_colab.md)） |
| 1本のコスト | 従量課金（数十円） | GPU時間ぶん |
| 1本の時間 | 数分 | 5〜15分 |
| 音 | モデル次第 | **映像と同時に生成**（切れない） |
| 向いている量 | 数本〜数十本 | 数十本〜（GPUを確保している間はいくらでも） |

> **判断の目安**: 数十本までなら fal.ai のほうが安くて速い。
> 「今日は100本回す」「音まで作りたい」「ノードを触りたい」ときに H3 へ切り替えます。

H3で回すときは、Colabノート⑥で出たURLを渡します。

```bash
npm run factory -- --backend h3 --comfy-url https://xxxx.trycloudflare.com \
  --scenes jab --takes 3 --image flatup_first_frame.png
```

`--image` は **ComfyUI の `input/` に置いたファイル名**です（ノート⑧でアップロードしたもの）。

---

## 8. 横展開の回し方（型が決まったあと）

1. **型を決める** — `--takes 3` で1場面だけ回し、当たりのseedを控える
2. **横に広げる** — 当たった型で `--all --takes 2`。`--budget` を必ず付ける
3. **選ぶ** — `manifest.md` / `manifest.csv` のチェック欄で人間が確認（怖くない・崩れていない・9:16で見切れない）
4. **投稿文** — `npm run dev -- sns_post "<場面の説明>"` で下書き
5. **記録** — `npm run factory -- --summary` で本数と金額を確認

---

## 9. 詰まったとき

| 症状 | 対策 |
|---|---|
| 画像を渡したのに効いていない | `FAL_VIDEO_MODEL` が text-to-video のまま。image-to-video のモデルに変える（CLIが検知して止めます） |
| 途中で止まった | 同じコマンドをもう一度。出来ているぶんは飛ばします |
| 残高切れ | その場で中断します。チャージ後に同じコマンドで再開 |
| キャラが崩れる | `--image` に**毎回同じ基準画像**を渡す。`--takes` を増やして引き直す |
| 同じ絵ばかり出る | `--seed-base` を変える |
| H3で「モデルが無い」 | ノート③の `extra_model_paths.yaml` を確認 → ComfyUI再起動 |
| 一部だけ失敗した | `--retry-failed <フォルダ名>` で失敗ぶんだけ作り直す |
| プロンプトmdが読めないと言われる | ```` ```prompt ```` フェンスを消していないか確認。消したなら md を削除して `--export-prompts` |

---

## 10. 守ること（承認ゲート）

- 出てきた動画は**すべて下書き**。SNS投稿・広告出稿・お客様への送信は **JINの確認後**
- `check.md` の9項目を飛ばさない（怖くない / 暴力的でない / 実在会員に似ていない）
- 料金・時間・クラス名を投稿文に入れるときは **正本**（`src/data/` と canon）を必ず確認する
- 台帳（`logs/factory.jsonl`）に顧客情報は入れない。入るのは場面・seed・金額だけ
