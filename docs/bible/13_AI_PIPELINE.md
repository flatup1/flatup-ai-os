<!-- この巻は「索引」であり正本ではない。内容を書き写して増やさないこと。
     正本と食い違ったら必ず正本が勝つ。全体の使い方は README.md を読む。 -->

# 13 生成パイプライン

## 正本
- `src/movie/generate.ts`（CLI本体）／`adopt.ts`（採用）／`falClient.ts`（API）
- `docs/emotional_movie_ep0_mac.md`（Macの手順）

## 流れ
```
refs → adopt refs → scenes → adopt scenes → edl → cuts
```

| 段階 | 何が起きるか |
|---|---|
| refs | canon から絵柄参照を自動添付して設定画を生成 |
| **adopt refs** | ★承認ゲート①。採用画像が以降すべてに添付される |
| scenes | 出演キャラの設定画だけを添付してシーン画を生成 |
| **adopt scenes** | ★承認ゲート②。`<C-id>.png` に改名され動画の起点になる |
| edl | 編集台本＋字幕。**APIもネットも不要** |
| cuts | 採用静止画から image-to-video |

## 絶対に破らない
- **順番を飛ばさない**。adopt を飛ばすとキャラの顔がカットごとに変わる
- `FAL_KEY` 未設定なら DRY-RUN（料金ゼロ）。まず中身を確かめてから課金する

## 環境
- `queue.fal.run` / `fal.media` / `v3.fal.media` への通信が要る。
  遮断される環境ではローカル（Mac）から実行する

## 未確定
なし。
