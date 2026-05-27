import { generateWithAI, type SystemBlocks } from "../ai/client.js";

/**
 * 初心者・未経験者・不安を持っている人向けの「やさしい案内文」生成。
 * 入会導線や体験ページの導入、LINE 公式の自動返信、SNS の固定投稿などに使う。
 */
export async function uizin(system: SystemBlocks, input: string): Promise<string> {
  const userPrompt = `初心者向けのやさしい案内文を作ってください。「格闘技に興味はあるけど怖い」人に、最初の一歩を踏み出してもらう用途。

## 出力フォーマット
### 短文版 (LINE 公式自動返信 / SNS 固定投稿、150 字)
### 通常版 (HP 上部 / LP 冒頭、400〜500 字)
### 不安をほどく Q&A (3 件、Q→A 形式)
### 行動喚起 (1 行、押し付けない言い回し)
### 人間確認ポイント (1 行)

## 条件
- 格闘技が怖い / 自分は向いていないと思っている人の感情に寄り添う書き出し。
- 「世界一やさしい格闘技ジム」「強い人が偉い世界にしない」「はじめの一歩を応援する」を必ず反映。
- ガチ勢向け表現や勝ち負けの煽りは禁止。
- 体験500円・初回案内の流れに自然に繋ぐ(押し売りせず)。
- 女性・キッズ・保護者・運動不足の大人がそれぞれ「自分のこと」と感じられる言葉を含める。

## 内容 / 対象
${input}`;

  return generateWithAI(system, userPrompt, { maxTokens: 3500 });
}
