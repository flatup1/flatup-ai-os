<!-- この巻は「索引」であり正本ではない。内容を書き写して増やさないこと。
     正本と食い違ったら必ず正本が勝つ。全体の使い方は README.md を読む。 -->

# 09 動画生成

## 正本
- `src/movie/promptBank.ts` の cuts フェーズ（V1〜V4）
- `src/movie/falClient.ts` / `src/reel/seedance.ts`
- `docs/emotional_movie_ep0.md` §動画生成工程

## 原則
- 1回で35秒を作らない。**1カット3〜5秒**に分割する
- 各カットの動きは**一つだけ**
- 必ず**採用済み静止画からの image-to-video**（テキストから直接作らない）
- 大きなアクションより、視線・呼吸・間を優先

## 動画化するのは4カットだけ
V1 目を開ける／V2 手が離れる／V3 一歩前へ／V4 朝日。
他は静止画＋ゆっくりした寄り・引き・光・瞬きで表現する。

## 実行
```bash
npm run movie -- cuts
```
プロバイダは `SEEDANCE_PROVIDER`（既定 fal、`byteplus` も可）。

## 未確定
- [ ] 外部提案にあった Veo3 / Runway / Kling / Pika / Sora への対応は**未実装**。
      現状は fal.ai（Seedance）と BytePlus のみ。増やす必要があるか？
