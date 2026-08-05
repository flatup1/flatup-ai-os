# MiniMax-H3 を Google Colab で動かす（画像 → 音つき動画）

**結論**: `notebooks/MiniMax_H3_Colab.ipynb` を Colab で開いて、上から順に ▶ を押すだけ。
ただし **Colab Pro（月11.99ドル）以上の契約が必要**。無料枠では動かない。

---

## 1. 最初に知っておくこと（お金と条件）

| 項目 | 実際のところ |
|---|---|
| Google AI Pro | **Colab Pro は含まれない**。Gemini・NotebookLM・5TBストレージなどが中身。Colab は別契約。 |
| 必要な契約 | **Colab Pro**（月11.99ドル / 100コンピューティングユニット）以上 |
| 必要なGPU | **A100 40GB 推奨**、最低でも L4（22.5GB）。**無料のT4（16GB）は不可** |
| 必要な本体メモリ | **ハイメモリ（High-RAM）必須**。42GB分のモデルをGPUから逃がすため |
| ダウンロード量 | 約 **43GB**（初回のみ、10〜25分） |
| 消費の目安 | A100 は約 5.4ユニット/時。100ユニット ≒ A100 で月18時間ぶん |

無料枠がダメな理由は2つ。VRAM 16GB では足りないことと、Colab が無料枠での画像生成系Web UIの実行を制限していること。

---

## 2. 使い方（5分でわかる）

1. GitHub 上の `notebooks/MiniMax_H3_Colab.ipynb` を開き、`https://colab.research.google.com/github/flatup1/flatup-ai-os/blob/main/notebooks/MiniMax_H3_Colab.ipynb` でColabに読み込む
2. **ランタイム → ランタイムのタイプを変更 → GPU（A100）→ ハイメモリ オン → 保存**
3. 上のセルから順に ▶ を押す
4. 各セルは終わると **OK** とだけ表示する。問題があるときだけ原因と直し方が出る

| ステップ | 中身 | 目安時間 |
|---|---|---|
| STEP 1 | GPU・メモリ・ディスクの確認 | 数秒 |
| STEP 2 | Googleドライブ接続（動画の保存先） | 30秒 |
| STEP 3 | ComfyUI（実行エンジン）の導入 | 3〜5分 |
| STEP 4 | モデル約43GBのダウンロード | 10〜25分 |
| STEP 5 | もとになる画像を1枚アップロード | 数秒 |
| STEP 6 | プロンプト・秒数・画質を決める | 数秒 |
| STEP 7 | 生成の実行 | 初回5〜10分＋生成時間 |
| STEP 8 | 動画の再生とドライブ保存 | 数秒 |

最後の任意セルを実行すると ComfyUI の画面（GUI）も開ける。

---

## 3. 使っているモデル

Comfy-Org が配布する量子化済みファイル（[Comfy-Org/MiniMax-H3](https://huggingface.co/Comfy-Org/MiniMax-H3)）を使う。
公式の bf16 一式は合計 123.6GB・Transformer だけで 61.7GB あり、80GB級のGPUが要るのでColabでは使わない。

| 種類 | ファイル | 置き場所 | 目安 |
|---|---|---|---|
| 拡散モデル | `minimax_h3_fl2va_pruned_int8_convrot.safetensors` | `models/diffusion_models/` | 約19.5GB |
| テキストエンコーダ | `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors` | `models/text_encoders/` | 約14.6GB |
| 映像VAE | `minimax_h3_video_vae_fp16.safetensors` | `models/vae/` | — |
| 音声VAE | `minimax_h3_audio_vae_fp32.safetensors` | `models/vae/` | — |

ノートブックのワークフローは、ComfyUI公式テンプレート
[`video_minimax_h3_i2v.json`](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_minimax_h3_i2v.json)
と同じノード構成を API 形式で組み直したもの（GUIを開かずに実行できるようにするため）。

---

## 4. 出力の制約（H3の仕様）

- 24fps、最長およそ15秒
- フレーム数は `17k + 5` の値に切り上げ（ノートブックが自動計算）
- 画布は短辺768pxまで、最大 768×1344、32の倍数
- 映像と 32kHz ステレオ音声を1回の生成で同時に出す（あとから音を足していない）

---

## 5. 困ったとき

| 症状 | 原因 | 直し方 |
|---|---|---|
| STEP1でVRAM不足と出る | GPUがT4など | ランタイムのタイプを変更 → A100（無ければL4） |
| STEP1でメモリ不足と出る | High-RAM が off | ランタイムのタイプを変更 → ハイメモリ オン |
| STEP4が途中で止まる | 回線切れ | 同じセルをもう一度実行（続きから再開する） |
| STEP7で落ちる | メモリ不足 | STEP6で秒数を2秒・画質を0.2に下げる |
| ノードが無いと出る | ComfyUIが古い | ランタイムを削除してSTEP1からやり直す |

---

## 6. 注意

- MiniMax の**ホスティングAPI**は英・EU・米・韓で提供されていない。ただしこの手順は**オープンウェイトを自分で動かす**方式なので、APIの提供地域とは別。
- Colabのセッションは切れると中身が消える。動画は必ずGoogleドライブ側に残す（STEP8が自動でやる）。
- 生成物を FLATUP の発信に使う場合は、いつも通り**公開前に人間が確認**する。

---

**Last Updated**: 2026-08-05
