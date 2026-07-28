/** 話数レジストリのテスト（カット数・字幕・安全表現・話数指定）。 */
import assert from "node:assert";
import { EPISODES, getEpisode, parseEpisodeArg, imagePromptOf, videoPromptOf } from "./animeEpisodes.js";

// 各話は8カットで、字幕も8つ揃っている
for (const ep of EPISODES) {
  assert.equal(ep.cuts.length, 8, `EP${ep.n}は8カット`);
  assert.equal(ep.subtitles.length, 8, `EP${ep.n}の字幕は8つ`);
  assert.deepEqual(ep.cuts.map(c => c.n), [1, 2, 3, 4, 5, 6, 7, 8], `EP${ep.n}のカット番号は1..8`);
  assert.ok(ep.title.length > 0 && ep.message.length > 0, `EP${ep.n}はタイトルと芯を持つ`);
  for (const cut of ep.cuts) {
    // 共通の画風・動かし方が必ず付く
    assert.match(imagePromptOf(cut), /vertical 9:16/, `EP${ep.n} cut${cut.n}: 縦9:16`);
    assert.match(videoPromptOf(cut), /fixed camera/, `EP${ep.n} cut${cut.n}: 固定カメラ`);
    assert.match(videoPromptOf(cut), /6 seconds/, `EP${ep.n} cut${cut.n}: 6秒`);
    // バイブルの安全ルール: 怖い顔を作らない
    assert.match(imagePromptOf(cut), /no scary faces/, `EP${ep.n} cut${cut.n}: 怖い顔を作らない`);
  }
}

// EP1・EP2が登録されている
assert.deepEqual(EPISODES.map(e => e.n), [1, 2], "EP1とEP2が登録済み");
assert.equal(getEpisode(2).title, "ありがとうが言えるかな？", "EP2のタイトルがバイブルと一致");

// EP2は「ありがとう」を言えるようになる話。最後の実質カットで感謝が出る
assert.ok(getEpisode(2).subtitles.includes("ありがとう！"), "EP2に『ありがとう』の字幕がある");

// 未定義の話数は明確なエラー（誤って別の話を作らないため）
assert.throws(() => getEpisode(99), /EP99 はまだ定義されていません/, "未定義話はエラー");

// --episode / --ep の解釈。指定が無ければ1
assert.equal(parseEpisodeArg(["--episode", "2"]), 2, "--episode 2");
assert.equal(parseEpisodeArg(["--ep", "2"]), 2, "--ep 2");
assert.equal(parseEpisodeArg(["--count", "4"]), 1, "指定なしは1");
assert.equal(parseEpisodeArg(["--episode", "abc"]), 1, "不正値は1にフォールバック");

console.log("✓ anime episodes tests passed");
