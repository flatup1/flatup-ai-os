# MiniMax H3 × ComfyUI 改造 — 設計書（引き継ぎメモへの回答）

JINの引き継ぎメモ（Tiny-SDノート → MiniMax H3動画生成への改造）に対する設計と、
そのまま実行できる成果物一式。**結論から書きます。**

---

## 結論（3行）

1. **設計方針は採用**。ComfyUI公式 I2Vテンプレ + Comfy-Org/MiniMax-H3 + Drive保存で正しい（配置だけ公式の `extra_model_paths.yaml` に変更）。実装済み → [`notebooks/colab_minimax_h3_i2v.ipynb`](../notebooks/colab_minimax_h3_i2v.ipynb)
2. **ただしColabは「無料T4では不可、A100が要る」**。モデル一式42GB・テキストエンコーダがQwen3-VL-32Bのため。RTX 3060（12GB）も不可。
3. **「最短で1本出す」だけなら、既存の `npm run reel`（fal.ai Hailuo I2V）が今日いちばん速い**。H3のColab構成は「量産・細かい制御」フェーズの装備。

---

## 1. 改造方針

| 論点 | JINの案 | 判定 | 理由 |
|---|---|---|---|
| Tiny-SDノートをH3へ移植 | やめる | **○ 正しい** | 画像モデルと動画モデルで構成が別物。Python直書きはノード再実装になる |
| ComfyUI公式ワークフローを使う | 採用 | **○ 正しい** | サンプラー・スケジューラ・VAE2種の配線が既に正解の状態で入っている |
| T2VよりI2Vから | 採用 | **○ 正しい** | 最初のコマを固定できる＝キャラ崩れが起きにくい |
| R2V・RunningHubは第2段階 | 後回し | **○ 正しい** | 初手の工数を増やさない判断として妥当 |
| Drive保存 | 採用 | **△ 条件つき** | **無料Drive 15GBでは42GBが入らない**。100GB以上のプランのときだけ有効 |
| シンボリックリンクで配置 | 採用 | **△ 変更した** | ComfyUI側の既定フォルダに中身があるとリンクが張れず「モデルが無い」になる。公式の **`extra_model_paths.yaml`** に変更 |
| 「まずは低解像度でテスト」 | — | **✕ 効かない** | H3のキャンバスは短辺768固定（後述）。安くする레버は**秒数とステップ数** |
| 「最初は音声なし」 | — | **✕ できない** | H3は映像と音を**同時に**作るモデル。音声VAEは必須。要らなければ編集で消す |

### 変更した点（メモとの差分）

- ノートの①セルで **GPU判定 → 動かないGPUなら先に止める**。42GB落としてから落ちるのを防ぐため
- text encoder は **GPUを見て自動選択**（NVFP4はBlackwell専用なので、A100ではint8）
- ComfyUIの起動は**バックグラウンド**（`!python main.py` を素で書くとセルが固まって次に進めない）

---

## 2. 採用ソース一覧（実際に中身を確認したもの）

| # | ソース | 何を確定させたか |
|---|---|---|
| 1 | [ComfyUI公式チュートリアル](https://docs.comfy.org/tutorials/video/minimax/minimax-h3) | I2V/T2V/R2Vの位置づけ、モデル配置場所 |
| 2 | [公式テンプレート `video_minimax_h3_i2v.json`](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_minimax_h3_i2v.json) | **ノード構成・サンプラー・ステップ数**（＝ノート⑨はこれと同じ配線） |
| 3 | ComfyUI本体 `comfy_extras/nodes_minimax_h3.py` | **入力名・キャンバス規則・フレーム数の丸め方**（推測ではなくソース） |
| 4 | ComfyUI本体 `nodes.py` / `comfy_extras/nodes_video.py` | `CLIPLoader type="minimax"`、`CreateVideo`/`SaveVideo` の引数 |
| 5 | [Comfy-Org/MiniMax-H3](https://huggingface.co/Comfy-Org/MiniMax-H3) | 配布ファイル名（下の配置表） |
| 6 | [MiniMax H3 day-0 対応の告知](https://blog.comfy.org/p/minimax-h3-day-0-support-in-comfyui) | 2026-08-03 にネイティブ対応、変種（bf16/INT8/NVFP4） |

## 3. 非採用ソース一覧

| ソース | 扱い | 理由 |
|---|---|---|
| RunningHub `ComfyUI_RH_MinMaxH3` | 第2段階 | 高機能だが構成が重い。初手の工数として不適 |
| X（個人投稿） | 参考のみ | 環境差が大きく、数日で古くなる。**設計の正本にしない**（メモの判断どおり） |
| YouTube解説 | 使わない | 同上 |
| MiniMax本家HFの重み | 使わない | ComfyUIで使うなら Comfy-Org 版のほうがファイル名・配置が整っている |

---

## 4. Colab用セル構成（実装済み）

| セル | 内容 | メモとの対応 |
|---|---|---|
| ① | GPU・ディスク判定（不可なら停止＋代替案） | **追加**（事故防止） |
| ② | Driveマウント／出力先・モデル置き場の決定 | 12-1 |
| ③ | ComfyUI導入 + cloudflared + `extra_model_paths.yaml` を書く | 12-2・12-4（リンク→公式の仕組みに変更） |
| ④ | 配布ファイルを一覧して使う4つを自動選択 | **追加**（ファイル名変更に強くする） |
| ⑤ | ダウンロード（再実行で続きから） | 12-3 |
| ⑥ | ComfyUI起動（バックグラウンド）＋公開URL | 12-5・12-6 |
| ⑦ | FLATUP用テンプレプロンプト（場面名を変えるだけ） | 13・14 |
| ⑧ | ちびキャラ静止画を1枚アップロード | 11 |
| ⑨ | 公式テンプレと同じ配線をAPIで実行 → Driveへ保存 | 11 |

---

## 5. ComfyUI用モデル配置表

```
ComfyUI/models/
├── diffusion_models/  minimax_h3_fl2va_pruned_int8_convrot.safetensors   ← 本体（I2V/T2V共通）
├── text_encoders/     qwen3vl_32b_minimax_h3_<int8版>.safetensors        ← A100はint8を選ぶ
│                      （qwen3vl_32b_minimax_h3_nvfp4_awq… はRTX50/B200向け）
└── vae/               minimax_h3_video_vae_fp16.safetensors              ← 映像
                       minimax_h3_audio_vae_fp32.safetensors              ← 音声（必須）
```

合計およそ **42GB**。R2Vを足すと約63GB。

> **注意**: HFのリポジトリ内では `diffusion_models/…` のように**フォルダ名が付いた状態**で配布されています。
> メモのコマンドのようにファイル名だけを指定すると 404 になります。

---

## 6. ダウンロードコマンド（手で叩く場合）

```bash
pip install -U "huggingface_hub[cli]" hf_transfer
export HF_HUB_ENABLE_HF_TRANSFER=1
BASE=/content/drive/MyDrive/colab_models/minimax_h3

hf download Comfy-Org/MiniMax-H3 diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors --local-dir $BASE
# text encoder は変種が複数ある。int8版の正確な名前は `hf download` 前に一覧で確認する
#   python -c "from huggingface_hub import list_repo_files as f; print([x for x in f('Comfy-Org/MiniMax-H3') if 'text_encoders' in x])"
hf download Comfy-Org/MiniMax-H3 text_encoders/<上で確認したint8版>.safetensors                    --local-dir $BASE
hf download Comfy-Org/MiniMax-H3 vae/minimax_h3_video_vae_fp16.safetensors                        --local-dir $BASE
hf download Comfy-Org/MiniMax-H3 vae/minimax_h3_audio_vae_fp32.safetensors                        --local-dir $BASE
```

ノートの④⑤セルは、**実行時に配布一覧を取得してから**選ぶので、
将来ファイル名が変わっても止まりません（手打ちより安全）。

## 7. 起動コマンド

```bash
git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git /content/ComfyUI
pip install -r /content/ComfyUI/requirements.txt

# 省メモリ設定つきで、バックグラウンド起動する
python /content/ComfyUI/main.py --listen 127.0.0.1 --port 8188 --cache-none --disable-auto-launch &

# 外から開く
cloudflared tunnel --url http://127.0.0.1:8188
```

> メモの `github.com/comfy-org/ComfyUI` は誤りで、本体は **`comfyanonymous/ComfyUI`** です。
> `!python main.py` をそのまま書くとセルが終わらないので、必ずバックグラウンドで起動します。

---

## 8. H3の「決まりごと」（ここを外すとエラーになる）

| 項目 | 決まり | 具体例 |
|---|---|---|
| キャンバス | 短辺768px・面積は768×1344まで・32の倍数 | **9:16 → 768×1344**、16:9 → 1344×768 |
| 長さ | フレーム数は `17k+5` に丸められる | 5秒→124f、**6秒→158f（＝6.58秒）** |
| fps | 24固定 | 6秒＝158フレーム |
| 音声 | 映像と同時生成（切れない） | 音声VAEは必須。不要なら編集で消す |
| サンプラー | `res_multistep` + `simple` + 20ステップ | 公式テンプレの既定 |

---

## 9. I2V用プロンプト（FLATUP・そのまま使える）

ノート⑦に **8場面** を実装済み。`SCENE` を書き換えるだけで完成形が出ます。

| キー | 場面 | キャラの出典 |
|---|---|---|
| **`first_punch`** | **はじめの一歩（緊張→笑顔→やさしいストレート）＝ メモ13・14の再現。既定値** | あぷちゃん |
| `wave` | おいでおいで（体験募集リールの冒頭） | あぷちゃん |
| `jab` | 左ジャブ1発 | あぷちゃん |
| `high_kick` | 元気なハイキック | あぷちゃん |
| `rest` | 休憩中（癒し系） | あぷちゃん |
| `mitt_night` | 夜のジムでミットくんが目を覚ます | ミットくん |
| `masaki_welcome` | マサキ先生のごあいさつ | **BIBLE v3.0** |
| `tsumu_first_step` | ツムのはじめの一歩（EP1用） | **BIBLE v3.0** |

> **キャラの出典は2系統あり、混ぜてはいけません。**
> あぷちゃん／ミットくんは `docs/flatup_anime_studio.md`（2026-07-16 JIN確定）のSNSリール用マスコット。
> マサキ／ツムは `docs/flatup_animation_bible.md` v3.0 のシリーズ本編キャストです。
> 姿かたちの英文は `src/reel/characters.ts` の `look` と一致させてあります。

### プロンプトの型（FLATUP固定）

```
世界観（毎回同じ。バイブルの英語ブロック）
  ↓
Timeline（[0s-2s] … [2s-4s] … と秒で区切る／1カット1技）
  ↓
Audio:（音を1行で）
  ↓
禁止事項（文字なし・実在会員に寄せない・けが無し・怒鳴らない）
```

禁止事項は全場面で共通に固定してあります（`RULES`）。
「実写風にしない」「怖くしない」「暴力的にしない」はここで担保しています。

---

## 10. 詰まったときの対策

| 症状 | 原因 | 対策 |
|---|---|---|
| OOMで落ちる | VRAM不足 | A100にする／`--lowvram` を足す／`STEPS` 20→14／秒数を5秒に |
| `MiniMaxH3ImageToVideo` が無い | ComfyUIが古い | `/content/ComfyUI` を消して③からやり直す |
| DLが404 | フォルダ名を付けていない | `diffusion_models/…` のように**パス付き**で指定する |
| DLが終わらない | 42GBある | ⑤を再実行（続きから落ちる）。落としきる前にセッションが切れるなら Drive 100GB+ を検討 |
| セルが終わらない | `!python main.py` を素で実行した | バックグラウンド起動にする（ノートは対応済み） |
| キャラの顔が毎回変わる | 入力画像がバラバラ | **基準画像を1枚に固定**する（`docs/flatup_animation_bible.md` の決まり） |
| 手足が増える・動きが破綻 | 1カットに動作を詰めすぎ | Timelineの動作を減らす。`SEED` を変えて引き直す |
| 画面に文字が出る | 入力画像に文字がある | 設計シートをそのまま入れない。1ポーズのクリーン画像を使う |

---

## 11. 拡張ロードマップ

| 段階 | やること | 目安 |
|---|---|---|
| **第1（今ここ）** | I2Vで1本出す。破綻するか確認し、当たった `SEED` と場面を記録 | 本日〜数日 |
| 第2 | `SCENE` を増やして9:16で量産 → `npm run dev -- sns_post` で投稿文を下書き | 1〜2週 |
| 第3 | T2V検証（⑨から `first_frame` を外すだけ） | 随時 |
| 第4 | R2V（キャラ・声・動きを参照で固定）。公式「Reference to Video」テンプレ、+21GB | 品質を詰める段 |
| 第5 | RunningHubプラグイン、ローカルPC最適化 | 必要になったら |

---

## 12. 実行環境の選択（事実ベース）

| 環境 | 使えるか | コスト感 |
|---|---|---|
| Colab 無料（T4 15GB） | **✕** | — |
| Colab Pro+（A100 40GB） | **○** | 計算ユニット消費。1本5〜15分 |
| RTX 3060（12GB） | **✕** | — |
| RunPod など GPUレンタル（A100/H100） | ○ | A100 でおよそ $1.4/時、H100 でおよそ $2〜3.3/時が相場 |
| fal.ai Hailuo I2V（既存 `npm run reel`） | ◎ 今日出せる | 1本 数十円 |

> **「まず1本出す」が目的なら fal.ai**。**「何十本も回して詰める」段階からColab/RunPod**、という順が最短です。

---

## 13. Codexに投げる実装指示版（圧縮）

```
目的: Colab上のComfyUIで MiniMax H3 I2V を動かし、静止画1枚から9:16・6秒の動画を1本出す。

前提（守ること）:
- ComfyUI本体は comfyanonymous/ComfyUI（comfy-org/ComfyUI ではない）
- ワークフローは公式テンプレ video_minimax_h3_i2v.json と同じ配線にする
  UNETLoader / CLIPLoader(type="minimax") / VAELoader×2 /
  MiniMaxH3ImageToVideo(clip, vae, prompt, width, height, length, first_frame) /
  RandomNoise / KSamplerSelect(res_multistep) / BasicScheduler(simple, 20, 1.0) /
  BasicGuider / SamplerCustomAdvanced / VAEDecode + VAEDecodeAudio /
  CreateVideo(fps=24, bit_depth=8) / SaveVideo
- モデルは Comfy-Org/MiniMax-H3 から4つ。HF上のパスは
  diffusion_models/ text_encoders/ vae/ のフォルダ名込みで指定する
- text encoder は Blackwell(RTX50/B200)なら nvfp4、それ以外は int8 を選ぶ
- 解像度: 短辺768・面積768x1344まで・32の倍数 → 9:16 は 768x1344
- 長さ: フレーム数は n%17==5 になるまで +1（6秒→158フレーム）
- 音声は必ず出る（audio VAE必須）。無効化はできない
- モデルの配置は ComfyUI/extra_model_paths.yaml で行う
  （シンボリックリンクは既定フォルダに中身があると張れず、モデル未検出になる）
- main.py はバックグラウンド起動（--cache-none --disable-auto-launch）、
  外部公開は cloudflared quick tunnel
- 出力mp4はGoogle Driveへコピーする

禁止:
- Python直書きでH3を実装しない（ComfyUIのノードを使う）
- 無料T4前提にしない（42GB・32B text encoderのため A100以上が必要）
- モデルを無料Drive(15GB)に保存する前提にしない

プロンプトの型:
  世界観 → Timeline([0s-2s]…) → Audio: → 禁止事項(No text / 実在人物に寄せない / けが無し)
```

---

## 14. 守ること（承認ゲート）

- ここで作るものは**すべて下書き**。SNS投稿・広告出稿・お客様への送信は **JINの確認後**
- 実在の会員さんの顔に寄せた映像は作らない（プロンプトの禁止事項に明記済み）
- 料金・時間・クラス名を映像や投稿文に入れるときは **正本**（`src/data/` と canon）を必ず確認する
