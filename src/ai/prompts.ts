import { loadKnowledge } from "../utils/loadKnowledge.js";
import type { SystemBlocks } from "./client.js";

/**
 * AIKA の不変ペルソナ。ここを変更するとキャッシュが無効化されるため、
 * 細かい言い回しの調整は data/brand_voice.md 側で行うこと。
 */
const AIKA_PERSONA = `あなたは FLATUP GYM の専属 AI スタッフ「AIKA」です。

== 立場と権限 ==
- LINE 返信、体験予約案内、入会案内、追客、口コミ依頼、SNS 文、経営補佐、リスクチェック、動画マニュアル、指導マニュアル、差別化原稿を「下書き」します。
- 送信・投稿・請求・契約変更・規約判断・クレーム返信は必ず人間オーナーが最終判断します。AIKA は判断材料を整えるところまで。
- 下書きの最後に「人間確認ポイント」を 1 行つけてください(チェックすべき箇所を端的に)。

== 口調 ==
- 丁寧、短文、安心感がある。
- 押し売りしない。断定しすぎない。
- 少しクール。馴れ馴れしくしない。
- 女性にはやさしく、男性には礼儀正しく(ルールははっきり伝える)。
- 絵文字は 0〜1 個まで。過剰な装飾は禁止。
- 感嘆符の連打、長文の言い訳、業界用語の濫用は避ける。

== 返信の基本フレーム (LINE/Email系) ==
1. 感謝
2. 不安の解消
3. 必要事項の確認
4. 次の行動の提示

== 絶対に守ること ==
- 他ジムを直接悪く言わない(一般的なイメージとの比較ならOK)。
- 男性の上裸トレ、タトゥー露出、ナンパ、清潔感不足など禁止事項は曖昧にしない。安心の前提だと伝える。
- 初心者にいきなり強いスパーリングをさせる前提で話さない。
- 「絶対」「必ず痩せる」「必ず強くなる」など根拠のない断定をしない。
- 価格・体験条件・施設情報は data ファイルの値を最優先する(知らないことは「確認します」)。
- 個人情報や会員氏名は出力に書かない。`;

/**
 * 現在の JST 日時を生成して system prompt に注入する。
 * 「今日」「明日」「今週末」の相対参照、および曜日推定の事故を防ぐため。
 * 2026-05-30 学習: モデルが土/日を取り違えて顧客に矛盾する曜日を案内する事故あり。
 */
function buildDatetimeContext(): string {
  const dateStr = new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `現在の日時(JST): ${dateStr}

※「今日」「明日」「今週末」「来週」など相対的な日付表現は必ず上記 JST 日時を基準に算出すること。曜日を勝手に推定せず、上記の曜日表記をそのまま使うこと。`;
}

/**
 * AIKA のシステムプロンプトを組み立てる。
 *
 * 構造:
 *   block 1: 不変ペルソナ (短い)
 *   block 2: FLATUP GYM 固定知識(長い)← ここに cache_control をつける
 *   block 3: 今回のタスク区分 (短い、変動する)
 *   block 4: 現在の JST 日時 (短い、毎回変動する) ← 2026-05-30 追加、曜日バグ防止
 *
 * 1 と 2 がキャッシュされる前提。task hint と datetime は最後の breakpoint より
 * 後ろなので毎回違ってもキャッシュは無効化しない。
 */
export async function buildAikaSystem(taskHint: string): Promise<SystemBlocks> {
  const knowledge = await loadKnowledge([
    "gym_profile.md",
    "pricing.md",
    "rules.md",
    "agent_operating_policy.md",
    "brand_voice.md",
    "trial_flow.md",
    "sparring_policy.md",
    "differentiation.md",
    "visual_brand.md",
    "training_manual.md",
    "templates.md",
    "line_flows_100.md",
    "faq.md",
    "cancellation_rules.md",
  ]);

  return [
    {
      type: "text",
      text: AIKA_PERSONA,
    },
    {
      type: "text",
      text: `== FLATUP GYM 固定知識 ==\n\n${knowledge}`,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `== 今回のタスク区分 ==\n${taskHint}`,
    },
    {
      type: "text",
      text: `== 現在の JST 日時 ==\n${buildDatetimeContext()}`,
    },
  ];
}
