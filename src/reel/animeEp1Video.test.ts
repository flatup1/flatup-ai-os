/** anime EP1 動画バッチの最小テスト（プロンプト整合と画像探索）。 */
import assert from "node:assert";
import { EP1_CUTS, findSourceImage } from "./animeEp1Video.js";

// 8カットぶんのプロンプトが揃っていて、安全表現(固定カメラ/1動作)が入っている
assert.equal(EP1_CUTS.length, 8, "EP1は8カット");
assert.deepEqual(EP1_CUTS.map(c => c.n), [1, 2, 3, 4, 5, 6, 7, 8], "カット番号は1..8");
for (const c of EP1_CUTS) {
  assert.match(c.prompt, /fixed camera/i, `cut${c.n}: fixed camera を含む`);
  assert.match(c.prompt, /6 seconds/i, `cut${c.n}: 6 seconds を含む`);
}
// カット6は「当てない・礼」= 暴力表現を含まない
assert.match(EP1_CUTS[5].prompt, /no impact/i, "cut6: no impact");

// 画像探索: 拡張子を問わず cut<n>.* を拾い、番号違いは拾わない
const files = ["cut1.png", "cut2.jpg", "cut10.png", "readme.txt", "CUT3.WEBP"];
assert.equal(await findSourceImage(files, 1), "cut1.png", "cut1.png を拾う");
assert.equal(await findSourceImage(files, 2), "cut2.jpg", "cut2.jpg を拾う");
assert.equal(await findSourceImage(files, 3), "CUT3.WEBP", "大文字も拾う");
assert.equal(await findSourceImage(files, 4), undefined, "無いカットは undefined");
assert.equal(await findSourceImage(files, 1) !== "cut10.png", true, "cut1 が cut10 を誤取得しない");

console.log("✓ anime EP1 video batch tests passed");
