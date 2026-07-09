import assert from "node:assert/strict";
import { canonContext, receptionReplyAsync } from "./receptionist.js";
import { detectIntent } from "./fallback_reply.js";

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

console.log("receptionist safety tests passed");
