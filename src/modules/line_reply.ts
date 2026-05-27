import { generateWithAI, type SystemBlocks } from "../ai/client.js";

export async function lineReply(system: SystemBlocks, input: string): Promise<string> {
  const userPrompt = `LINE / DM 返信の下書きを作ってください。

## 出力フォーマット
1. 返信本文 (80〜180 字目安、絵文字 0〜1 個)
2. --- 区切り
3. 「人間確認ポイント:」 で始まる 1 行(送信前にオーナーが確認すべきこと)

## 条件
- 体験予約の問い合わせなら、希望日時 / 年齢 / 経験の有無 を確認する。
- 不安や恐怖が透けて見える文面なら、安心感を最優先に。値段や入会の話は後回し。
- 男性問い合わせには礼儀正しくルールを伝える(タトゥー、上裸トレ、ナンパ等の禁止事項に該当しそうなら遠回しに釘を刺す)。
- 押し売り、断定表現(「絶対」「必ず」)、煽り、感嘆符の連打は禁止。
- すでに別ジムに通っている人にも失礼にならない言い回し。

## 問い合わせ内容
${input}`;

  return generateWithAI(system, userPrompt, { maxTokens: 1200 });
}
