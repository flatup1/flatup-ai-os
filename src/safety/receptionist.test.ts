import assert from "node:assert/strict";
import { canonContext, receptionReplyAsync } from "./receptionist.js";
import { detectIntent } from "./fallback_reply.js";
import { buildAikaSystem } from "../ai/prompts.js";

{
  const context = canonContext();
  assert.match(context, /FLATUP GYM 正本/);
  assert.match(context, /初回体験500円/);
  assert.match(context, /成田市土屋516-4/);
}

{
  const out = await receptionReplyAsync(
    "体験したいです。初心者でも大丈夫ですか？",
    async () => "本気じゃないなら来るな。絶対に強くなれます。",
  );

  assert.equal(out.source, "fallback");
  assert.doesNotMatch(out.reply, /本気じゃないなら来るな/);
  assert.match(out.reply, /初回体験500円|体験/);
}

{
  const out = await receptionReplyAsync(
    "料金を教えてください",
    async () => {
      throw new Error("OpenRouter 503");
    },
  );

  assert.equal(out.source, "fallback");
  assert.match(out.reply, /初回体験500円|料金/);
}

// 退会の一次返信は、取次ぎで止めず正本の確定情報(翌月末退会・退会届)を伝える。
{
  const out = await receptionReplyAsync("退会したいです", async () => {
    throw new Error("OpenRouter 503");
  });

  assert.equal(out.source, "fallback");
  assert.match(out.reply, /翌月末/);
  assert.match(out.reply, /退会届/);
  assert.equal(out.approved, true);
}

// 違約金の質問は、体験案内に化けず、規定(10,000円)を伝えて人間確認につなぐ。
{
  const out = await receptionReplyAsync(
    "入会して半年ですが違約金ありますか？",
    async () => "",
  );

  assert.equal(out.source, "fallback");
  assert.match(out.reply, /違約金/);
  assert.match(out.reply, /10,000円/);
  assert.doesNotMatch(out.reply, /体験/);
  assert.equal(out.approved, true);
}

// detectIntent の優先順位: penalty > cancellation > trial/price。
{
  assert.equal(detectIntent("入会して半年ですが違約金ありますか？"), "penalty");
  assert.equal(detectIntent("退会したいです"), "cancellation");
  assert.equal(detectIntent("休会の会費はいくらですか？"), "cancellation");
  assert.equal(detectIntent("体験したいです"), "trial");
  assert.equal(detectIntent("月会費はいくらですか？"), "price");
}

// AIKA システムプロンプトに Issue #8-a の4ルールが注入されていることの回帰テスト。
// 文言の一言一句ではなく、ルールの骨子(キーワード)が persona に含まれるかを見る。
{
  const system = await buildAikaSystem("line_reply");
  const personaText = system.map((b) => b.text).join("\n\n");

  // ルール1: クラス推薦は最大2件まで
  assert.match(personaText, /クラス推薦/);
  assert.match(personaText, /最大2件/);
  assert.match(personaText, /機械的な列挙は禁止/);

  // ルール2: 取次ぎ(punt)は契約・医療・例外対応・料金トラブルのみ
  assert.match(personaText, /契約・医療.*例外対応・料金トラブル/);
  assert.match(personaText, /取次ぎで安易に投げ返さない/);

  // ルール3: 絵文字は0〜1個、強調記号もカウント、連続する返信で使い回さない
  assert.match(personaText, /絵文字は 1 返信につき 0〜1 個まで/);
  assert.match(personaText, /強調記号も絵文字と同じ扱いでカウント/);
  assert.match(personaText, /連続する返信.*同じ絵文字を使い回さない/);

  // ルール4: 出だしフレーズの多様化(5パターン以上 + 直前と同じ出だし禁止)
  assert.match(personaText, /出だしフレーズの多様化/);
  assert.match(personaText, /直前の自分の返信と同じ出だしは禁止/);
  const openerExamples = personaText.match(/^\s*\d+\.\s+「/gm) ?? [];
  assert.ok(
    openerExamples.length >= 5,
    `出だし例は5パターン以上必要(実際: ${openerExamples.length})`
  );

  // block 1(ペルソナ)は block 2(cache_control 付きのFLATUP GYM固定知識)より前にあること。
  // ここで4ルールを追加したことで、キャッシュ breakpoint (block2) の位置自体は変わっていない。
  const cachedBlockIndex = system.findIndex((b) => b.cache_control);
  assert.ok(cachedBlockIndex > 0, "cache_control 付きブロックが見つからない");
  assert.match(system[0].text, /クラス推薦のルール/);
}

console.log("receptionist safety tests passed");
