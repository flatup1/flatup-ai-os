# MiniMax H3 を Colab + ComfyUI で動かす（画像→動画）

**結論**: 静止画1枚から「音つき6秒の縦動画」を作る最短ルートは、
**ComfyUI公式の MiniMax H3 I2V テンプレート**をColabの **A100** で動かすこと。
ただし **無料ColabのT4では動きません**（モデル一式が約42GBあるため）。
今日すぐ1本ほしいなら、既存の `npm run reel`（fal.ai / Hailuo I2V）のほうが速くて安いです。

ノートブック: [`notebooks/colab_minimax_h3_i2v.ipynb`](../notebooks/colab_minimax_h3_i2v.ipynb)
設計の全体像・採用/非採用ソース・Codex向け指示: [`docs/minimax_h3_handoff.md`](minimax_h3_handoff.md)

---

## 1. どの道を選ぶか（先に決める）

| 道 | 何が要る | 1本あたり | 向いている場面 |
|---|---|---|---|
| **A. Colab + ComfyUI（このノート）** | Colab Pro+ の A100、42GBのDL、5〜15分/本 | Colabの計算ユニットのみ | 何十本も回す・細かく調整したい・音も一緒に作りたい |
| **B. ComfyUI の MiniMax API テンプレート** | ComfyUI（PCでも可）＋ APIクレジット | 従量課金 | 重みを落とさず公式画質だけ欲しい |
| **C. `npm run reel`（fal.ai Hailuo）** | `.env` の `FAL_KEY` だけ | 数十円 | **今日1本出す**。環境構築ゼロ |

> 迷ったら **C → A** の順。Cで「型」を確かめてから、量産フェーズでAに移すのが安全。

---

## 2. MiniMax H3 の特徴（知っておくと事故らない）

- **映像と音を同時に作る**。声・効果音・BGMを1回の生成でまとめて出す（後付けではない）
- **24fps・最大2K・約15秒**まで
- **キャンバスの決まり**: 短辺768px、面積は 768×1344 まで、32の倍数
  - **縦9:16 → 768 × 1344**（SNS用はこれ）
  - 横16:9 → 1344 × 768
- **長さの決まり**: フレーム数は `17k + 5` に丸められる
  - 5秒 → 124フレーム、6秒 → 158フレーム（＝6.58秒）
- **I2VとT2Vは同じモデル**（`fl2va`）。最初のコマ／最後のコマを付けるかどうかの違いだけ

---

## 3. 必要なもの

| 項目 | 目安 |
|---|---|
| GPU | **A100 40GB以上**（L4 24GBは厳しい、T4 15GBは不可） |
| ディスク | 60GB以上の空き（モデル一式で約42GB） |
| 初回の待ち時間 | ダウンロード15〜40分 + 生成5〜15分/本 |
| Google Drive | 動画の保存に使う。**モデルをDriveに置くには100GB以上のプランが必要**（無料15GBでは入らない） |

使うモデル（配布元 `Comfy-Org/MiniMax-H3`。ノートが自動で選びます）

| 置き場所 | ファイル | 役割 |
|---|---|---|
| `models/diffusion_models/` | `minimax_h3_fl2va_*` | 動画を描く本体 |
| `models/text_encoders/` | `qwen3vl_32b_minimax_h3_*` | 文章と画像を読む係 |
| `models/vae/` | `minimax_h3_video_vae_fp16` | 映像のVAE |
| `models/vae/` | `minimax_h3_audio_vae_fp32` | 音声のVAE |

> text encoder は **NVFP4版は Blackwell（RTX 50xx / B200）向け**。Colab の A100 では **int8版**を選びます。
> ノートの④セルが GPU を見て自動で選ぶので、手で直す必要はありません。

---

## 4. 手順（ノートの番号と対応）

**0. 先に A100 にする**（ここを飛ばすと①で止まります）
　Colabのメニュー **ランタイム → ランタイムのタイプを変更 → ハードウェア アクセラレータ = A100 GPU** →
　（あれば **ハイメモリ** も選ぶ）→ 保存。無料プランにA100は出てきません。

1. **①** GPUとディスクを確認（ここで無理なGPUなら止まる）
2. **②** Google Drive をつなぐ（動画の保存先）
3. **③** ComfyUI を入れる（最新masterをclone）
4. **④** 使うモデル4つを決める（自動）
5. **⑤** モデルをダウンロード（途中で止まっても再実行で続きから）
6. **⑥** ComfyUI を起動 → 公開URLが出る
   - 画面で使うなら `Workflow → Browse Templates → Video → MiniMax H3: Image to Video`
7. **⑦** FLATUP用テンプレプロンプトを作る（場面名を変えるだけ）
8. **⑧** ちびキャラの静止画を1枚アップロード
9. **⑨** 自動生成 → Drive の `FLATUP_H3/outputs/` に保存

---

## 5. プロンプトの型（FLATUP固定）

H3は文章の**順番**で結果が変わります。次の4ブロックで固定します。

```
世界観（毎回同じ）
  ↓
Timeline（[0s-2s] … [2s-4s] … と秒で区切る）
  ↓
Audio:（音を1行で指定する）
  ↓
禁止事項（文字なし・実在の人に寄せない・けが無し）
```

- **1カットに技は1つ**。「ジャブしてキックしてジャンプ」は破綻のもと
- **文字は出さない**（`No text, no logo, no subtitles`）。日本語テロップは編集で足す
- 禁止事項は `docs/flatup_animation_bible.md` の「描いてはいけないもの」をそのまま実装
  （流血・痛がる表情・怖い顔・当てるスパー・勝ち誇る描写は出さない）
- 場面の**正本は `src/factory/scenes.ts`**（量産ラインと共通）。ノート⑦はその写しです。
  場面を増やすときは**両方に同じキー**で足してください（`npm run test:factory` が一致を見ています）

### 用意してある場面（キャラの出典を混ぜないこと）

| キー | 場面 | キャラの出典 |
|---|---|---|
| `first_punch` | はじめの一歩（緊張→笑顔→やさしいストレート・既定） | あぷちゃん（studio・2026-07-16確定） |
| `wave` | おいでおいで | あぷちゃん |
| `jab` | 左ジャブ1発 | あぷちゃん |
| `high_kick` | 元気なハイキック | あぷちゃん |
| `rest` | 休憩中（癒し系） | あぷちゃん |
| `mitt_night` | 夜のジムでミットくんが目を覚ます | ミットくん（studio） |
| `masaki_welcome` | マサキ先生のごあいさつ | **ANIMATION BIBLE v3.0** |
| `tsumu_first_step` | ツムのはじめの一歩（EP1用） | **ANIMATION BIBLE v3.0** |

- **本編（EP1〜10）を作るなら** バイブル正本の `masaki_welcome` / `tsumu_first_step` 側を使う
- **単発のSNSリールなら** あぷちゃん側を使う
- 姿かたちの英文は `src/reel/characters.ts` の `look` と同じにしてあるので、
  `npm run img` / `npm run reel` で作った画像とブレません

---

## 6. うまくいかないとき

| 症状 | 直し方 |
|---|---|
| メモリ不足（OOM） | A100にする / 起動に `--lowvram` を足す / `STEPS` を 20→14 |
| `MiniMaxH3ImageToVideo` が無い | ComfyUIが古い。`/content/ComfyUI` を消して③からやり直す |
| キャラの顔が毎回変わる | 入力画像を**同じ基準画像**に固定する（バイブルの決まり） |
| 手足が増える・動きが破綻 | タイムラインの動作を減らす。`SEED` を変えて引き直す |
| ダウンロードが終わらない | ⑤を再実行（続きから落ちる） |
| モデルが選択肢に出てこない | ③が作る `ComfyUI/extra_model_paths.yaml` の `base_path` が `MODEL_DIR` と合っているか確認。直したらComfyUIを再起動（⑥を再実行） |
| セッションが切れた | ①〜⑥をもう一度上から実行。`MODELS_ON_DRIVE=True` なら⑤は「済み」で一瞬で終わる |

---

## 7. つぎの一手

1. **T2V**（画像なし） — ⑨の workflow から `first_frame` を外すだけ
2. **R2V**（参照でキャラ・声・動きを固定） — 公式テンプレート「MiniMax H3: Reference to Video」
3. **9:16で量産** — 1本ずつ回すのをやめて動画ファクトリーへ（[docs/flatup_video_factory.md](flatup_video_factory.md)）
   `npm run factory -- --backend h3 --comfy-url <⑥で出たURL> --scenes jab --takes 3`
4. **投稿文まで自動化** — `npm run dev -- sns_post "<内容>"` でキャプションを下書き

---

## 8. 守ること（承認ゲート）

- ここで作るものは**すべて下書き**。SNS投稿・広告・お客様への送信は **JINの確認後**
- 実在の会員さんの顔に寄せた映像は作らない（プロンプトの禁止事項に明記済み）
- 料金・時間・クラス名を映像や投稿文に入れるときは **正本**（`src/data/` と canon）を必ず確認する

## 参考

- ComfyUI 公式チュートリアル: https://docs.comfy.org/tutorials/video/minimax/minimax-h3
- 公式ワークフローテンプレート: https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_minimax_h3_i2v.json
- モデル配布: https://huggingface.co/Comfy-Org/MiniMax-H3
