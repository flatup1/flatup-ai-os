import { generateWithAI, type SystemBlocks } from "../ai/client.js";

export async function dailyManager(system: SystemBlocks, input: string): Promise<string> {
  const userPrompt = `FLATUP GYM オーナー向けの「今日やること」整理を作ってください。朝会で1分で読める粒度。

## 出力フォーマット
### 今日の最優先3つ
1. (時間枠 / 何を / なぜ重要)
2.
3.

### 余裕があればやること
- 箇条書きで3〜5件

### AIKA が下書きしておけるもの
- 「LINE返信」「SNS投稿」「口コミ依頼」「追客」などのうち今日着手すべきもの。コマンド例も併記(例: \`npm run dev -- line_reply "..."\`)。

### 人間判断が必要なもの
- オーナー本人でないと進められない判断(契約、価格、クレーム、規約、入会面談)を抽出。

### 今日のリスクメモ(1行)
- 不安要素・トラブルになりかねないこと。なければ「特になし」。

## 条件
- 経営戦略の大きな話より、今日明日で動かせる粒度を優先。
- 「ジムに通うこと」より「ジムが続くこと」を重視した判断軸。
- 安全・安心・清潔感に関わる予兆があれば最優先に上げる。

## 今日の状況
${input}`;

  return generateWithAI(system, userPrompt, { maxTokens: 2500 });
}
