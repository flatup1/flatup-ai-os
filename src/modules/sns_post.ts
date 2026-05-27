import { generateWithAI, type SystemBlocks } from "../ai/client.js";

export async function snsPost(system: SystemBlocks, input: string): Promise<string> {
  const userPrompt = `Instagram 投稿セットを 1 テーマ分まとめて作ってください。

## 出力フォーマット (Markdown 見出しで)
### Instagram 本文
(2200 字以内、改行多めに。冒頭3行で読ませる)

### 短文版 (Twitter / X 用)
(140 字以内)

### ストーリー版
(3〜4 ページ分、各ページ 1〜2 行)

### リール台本 (15〜30 秒)
0:00〜 / 0:03〜 / 0:08〜 ... の形式で、テロップ + 映像メモ

### ハッシュタグ
日本語7個 + 英語3個程度。「#成田 #格闘技 #キックボクシング」など地名・カテゴリ・ターゲットを混ぜる。

### LINE 配信用文(既存会員向け、120 字)

### 人間確認ポイント
- 1 行で

## 条件
- ブランドライン「世界一やさしい格闘技ジム」を全面に。
- 初心者・女性・キッズ・保護者が「ここなら安心」と感じる切り口を優先。
- ガチ勢向けの煽り、勝ち負け前提の表現は避ける。
- 撮影が必要な絵があれば「画づくりメモ」として行頭に「[撮影]」をつけて入れてよい。
- 視覚世界観: 白い床 / グリーンのマット / 黄色と蛍光ピンクのサンドバッグ / 自然光 / 観葉植物。

## テーマ
${input}`;

  return generateWithAI(system, userPrompt, { maxTokens: 5000 });
}
