import assert from "node:assert/strict";
import { canonContext, receptionReplyAsync } from "./receptionist.js";

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

console.log("receptionist safety tests passed");
