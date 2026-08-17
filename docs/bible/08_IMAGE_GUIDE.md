<!-- この巻は「索引」であり正本ではない。内容を書き写して増やさないこと。
     正本と食い違ったら必ず正本が勝つ。全体の使い方は README.md を読む。 -->

# 08 画像生成

## 正本
- `docs/emotional_movie_ep0_prompts.md`
- `src/movie/generate.ts`（添付ルール）／`src/movie/editPlan.ts`（構図の導出）

## 手順
```bash
npm run movie -- refs      # Day1 設定画12種 × 2枚
npm run movie:adopt -- refs
npm run movie -- scenes    # Day2 シーン画12種 × 2枚
npm run movie:adopt -- scenes
```
Mac は `scripts/movie.command` をダブルクリック。

## 壊しやすい勘どころ
- **参照は「そのシーンに出るキャラの分だけ」添付する**。
  全部添付すると母の顔アップにグローブの設定画が付いて絵が濁る
- 上限6枚で切るときは**キャラごとに1枚ずつ**確保する順に並べる。
  素直に並べると第7シーンで人間の参照が全部落ちる
- 構図（下を空ける／寄り余白／一目で読む）は**編集設計から自動で決まる**。
  手で書かない
- 動画カットの構図要件は**起点の静止画**に効かせる（V2→C5c）

## 未確定
なし。
