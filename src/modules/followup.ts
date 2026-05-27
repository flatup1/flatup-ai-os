import { generateWithAI, type SystemBlocks } from "../ai/client.js";

export async function followup(system: SystemBlocks, input: string): Promise<string> {
  const userPrompt = `体験者・見込み客への追客文を作ってください。「再勧誘」ではなく「安心の橋渡し」。

## 出力フォーマット
### LINE 短文版 (60〜120 字)
### LINE 通常版 (150〜250 字)
### 不安をほどく一言版(返信が止まっている人向け、80 字)
### 人間確認ポイント (1 行)

## 条件
- 入会を急かさない、決断を迫らない。
- 体験での会話・印象に触れて「覚えていますよ」を伝える(状況メモにあれば反映)。
- 次の一歩は最小単位で(再体験、見学、相談、家族同伴体験など)。
- 「もう一度来てください」だけで終わらせない。本人にとってのメリットを 1 つ添える。
- 値引きや無料延長は提案しない(オーナー判断領域)。

## 状況
${input}`;

  return generateWithAI(system, userPrompt, { maxTokens: 1800 });
}
