/**
 * リール連結ヘルパの回帰テスト(ffmpeg 実行なし・純関数のみ)。
 *
 * 実行: `npm run test:reel` に含まれる
 */

import assert from "node:assert/strict";
import { buildConcatList, stitchArgs } from "./stitch.js";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
  } catch (err) {
    fail++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`✗ ${name}\n   ${msg}`);
  }
}

test("buildConcatList は各行を file '...' 形式にする", () => {
  const list = buildConcatList(["/out/a.mp4", "/out/b.mp4"]);
  assert.equal(list, "file '/out/a.mp4'\nfile '/out/b.mp4'\n");
});

test("buildConcatList はパス内の単一引用符をエスケープする", () => {
  const list = buildConcatList(["/out/cat's clip.mp4"]);
  assert.equal(list, "file '/out/cat'\\''s clip.mp4'\n");
});

test("stitchArgs は concat demuxer + ストリームコピーの引数を返す", () => {
  const argv = stitchArgs("/out/.concat.txt", "/out/reel.mp4");
  assert.deepEqual(argv, [
    "-y", "-f", "concat", "-safe", "0",
    "-i", "/out/.concat.txt",
    "-c", "copy", "-movflags", "+faststart",
    "/out/reel.mp4",
  ]);
});

test("stitchArgs は入力リストを出力より前に置く(順序が壊れていない)", () => {
  const argv = stitchArgs("list.txt", "reel.mp4");
  assert.ok(argv.indexOf("list.txt") < argv.indexOf("reel.mp4"));
  assert.equal(argv[argv.length - 1], "reel.mp4");
});

if (fail === 0) {
  console.log(`✓ all stitch helper tests passed (${pass} cases)`);
  process.exit(0);
} else {
  console.error(`✗ ${fail} of ${pass + fail} cases failed:\n`);
  failures.forEach(f => console.error(f + "\n"));
  process.exit(1);
}
