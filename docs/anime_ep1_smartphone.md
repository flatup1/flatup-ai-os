# スマホだけでEP1アニメを作る

**PCを触らずに、スマホのボタン1つで45秒のアニメを生成する手順。**
生成はGitHubのサーバー上で走るので、スマホは「実行ボタンを押す」「できた動画を落とす」だけ。

---

## 準備（最初の1回だけ・5分）

GitHubの画面で設定を2つ入れる。スマホのブラウザでできる。

1. `github.com/flatup1/flatup-ai-os` を開く
2. **Settings** → 左メニュー **Secrets and variables** → **Actions**
3. **Secrets** タブ → `New repository secret`
   | Name | Value |
   |---|---|
   | `FAL_KEY` | fal.ai のAPIキー |
4. **Variables** タブ → `New repository variable`
   | Name | Value |
   |---|---|
   | `FAL_VIDEO_MODEL` | 画像→動画のモデル slug（Hailuo等のimage-to-video） |

> キーはGitHubが暗号化して保管する。ログにも出ないので安全。

---

## 毎回の作り方（3タップ）

1. リポジトリの **Actions** タブを開く
2. 左の一覧から **🎬 アニメEP1を作る（スマホからOK）** を選ぶ
3. **Run workflow** を押す → 設定を選んで実行

| 設定 | 選ぶもの | 意味 |
|---|---|---|
| どこまで作る？ | `full` | 画像→動画→連結。**45秒の動画が1本できる** |
| | `images_only` | 画像だけ。絵柄を先に見たいとき |
| | `dry_run` | 生成せず確認だけ（**無料**） |
| 各カットの画像枚数 | `1` | 全自動（おすすめ） |
| | `2`〜`4` | 差し替え候補も欲しいとき |

4. 20〜40分ほど待つ（画面を閉じてOK。終わると通知が来る）

---

## できた動画の受け取り方

1. 実行が終わったら、その実行画面を下にスクロール
2. **Artifacts** の中の **`FLATUP-EP1-動画`** をタップしてダウンロード
3. zipを解凍すると `flatup_ep1_YYYYMMDD.mp4`（縦9:16・約45秒）

一緒に入っているもの:
- `FLATUP-EP1-画像` … 8カットの元画像
- `FLATUP-EP1-クリップ8本` … つなぐ前の6秒動画8本（作り直したいカットだけ差し替えられる）

---

## 最後の仕上げ（スマホのCapCutアプリでOK）

ダウンロードした動画をCapCutで開いて、次の3つを足せば公開用になる。

1. **字幕**（実行結果の画面にも表を出しているのでコピペできる）

   | カット | 字幕 |
   |---|---|
   | 1 | FLATUP GYM |
   | 2 | こんばんは！ |
   | 3 | 今日は「優しくなること」 |
   | 4 | まっすぐ、いいね！ |
   | 5 | ナイス！ |
   | 6 | 勝ち負けじゃない |
   | 7 | ありがとうございました！ |
   | 8 | 世界一やさしい格闘技ジム |

2. **BGM** … ピアノ＋ストリングスのやさしい曲。カット6〜7で少し盛り上げ、最後は余韻を残す
3. **ロゴ** … 最後の1秒に「FLATUP GYM／世界一やさしい格闘技ジム」

---

## 投稿するとき

- **AI生成ラベルをON**にする（必須）
- キャプションとハッシュタグは `docs/flatup_anime_episode1.md` の「投稿セット」からコピペ
- 投稿前に必ず人間（JIN）が全カットを確認する

---

## 困ったとき

| 症状 | 直し方 |
|---|---|
| `FAL_KEY が未設定です` で赤くなる | 上の「準備」でSecretに `FAL_KEY` を入れる |
| 動画が作られない（画像だけできる） | Variableの `FAL_VIDEO_MODEL` が未設定。image-to-videoのモデルslugを入れる |
| 一部のカットだけ変な絵 | `FLATUP-EP1-クリップ8本` からそのカットだけ作り直し、CapCutで差し替える |
| お金をかけずに動作確認したい | mode を `dry_run` で実行（生成しないので無料） |

---

## PCでやる場合

同じことをPCのコマンドでもできる（`docs/flatup_anime_episode1.md` 参照）。

```bash
npm run anime:ep1:images   # ① 8カットの画像 → output/clips_src/cut1..8.png
npm run anime:ep1:video    # ② 6秒動画化     → output/clips/cut1..8.mp4
npm run anime:ep1:stitch   # ③ 1本に連結     → output/ep1/flatup_ep1_*.mp4
```
