import { generateWithAI, type SystemBlocks } from "../ai/client.js";

export async function animalReel(system: SystemBlocks, input: string): Promise<string> {
  const userPrompt = `動物×格闘技のAI動画リール(Sora/Veo/Kling向け)の生成セットを作ってください。
入力は「動物×競技」の組み合わせ(例: 猫×ボクシング)。1回の出力で1本ぶんの投稿素材が完結すること。

## 出力フォーマット (Markdown 見出し)
### 動画生成プロンプト(英語・3案)
- 各案は Sora / Veo / Kling にそのままコピペできる1段落の英語プロンプト
- 必須要素: photorealistic / 二足立ち(standing upright on hind legs) / 具体的な技のシーケンス / 舞台(日本の住宅リビング or ジム) / fixed camera, eye-level / vertical 9:16 / 6 seconds / natural lighting / realistic fur and physics / No humans visible
- 案1=王道(リビング)、案2=ジム(サンドバッグやリング)、案3=小ネタ入り(ヘッドバンド・ミニグローブ・スロー決めポーズ等)

### IG キャプション(2案)
- 案1: 英語主体の短文(例: "Jab! Jab! Hook!" 系) + 絵文字1〜2個
- 案2: 日本語ボケ一言 + 英語短文の併記

### ハッシュタグ(コピペ用1行、20〜30個)
- 英語グローバル系(#cat #funny #boxing 等)を主体に、日本語タグ2〜3個まで

### 次に作る派生案(3個)
- 同じ動物で技違い / 同じ技で動物違い / 舞台違い、を1個ずつ

### 投稿メモ
- 「AI生成」ラベルをONにすること(Instagramの設定)
- 動物同士が殴り合う・傷つく描写は使わない(プラットフォーム規約とブランド安全のため。技はシャドー・サンドバッグ・ミット限定)
- FLATUP GYM 導線はプロフィールリンクのみ。動画内に宣伝を入れない

### 人間確認ポイント (1 行)

## 条件
- 英語プロンプトは具体的な動作を動詞で書く(throws a quick left jab, then a right cross 等)。抽象語(cool, awesome)は使わない
- 猫は俊敏・コミカル、犬は忠実・熱血、など動物のキャラに合わせて技と演出を選ぶ
- 実在アカウントや人物の模倣はしない

## テーマ(動物×競技)
${input}`;

  return generateWithAI(system, userPrompt, { maxTokens: 6000 });
}
