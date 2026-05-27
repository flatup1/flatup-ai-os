import { generateWithAI, type SystemBlocks } from "../ai/client.js";

export async function reviewRequest(system: SystemBlocks, input: string): Promise<string> {
  const userPrompt = `Google 口コミ依頼文を作ってください。

## 出力フォーマット
### 短文版 (LINE 用、80〜120 字)
### 通常版 (LINE 用、150〜200 字、何を書けばよいかの例示つき)
### 書き出しヒント(会員に渡せる「一言だけでOK」のサンプル 3 件)
### 人間確認ポイント (1 行)

## 条件
- 感謝を先に伝える。
- 「30秒で書ける」「短くてOK」を強調して心理的ハードルを下げる。
- 星 5 を強要しない。本音でよいと伝える。
- 口コミ URL や QR 案内は本文に含めず、「(リンク添付してください)」と注記する。
- 入会を急かさない、追加販売しない。

## 相手・状況
${input}`;

  return generateWithAI(system, userPrompt, { maxTokens: 1500 });
}
