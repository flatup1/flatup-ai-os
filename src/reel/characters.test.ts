/**
 * キャラ基準画像（顔ブレ防止）の回帰テスト。ネットワークなし。
 *
 * 実行: `npm run test:reel` に含まれる
 */

import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CHARACTERS,
  findCharacter,
  describeCharacters,
  imageMime,
  characterReference,
  characterReferences,
} from "./characters.js";
import { buildImagePayload } from "./image.js";
import { EP1_CUT_DEFS, imagePrompt } from "./animeEp1Cuts.js";

let pass = 0;
let fail = 0;
const failures: string[] = [];

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    pass++;
  } catch (err) {
    fail++;
    failures.push(`✗ ${name}\n   ${err instanceof Error ? err.message : String(err)}`);
  }
}

await test("バイブルのレギュラー5人＋コーチが登録されている", () => {
  for (const name of ["ツム", "リク", "ユイ", "ソウタ", "ココ"]) {
    assert.ok(findCharacter(name), `${name} が見つからない`);
  }
  assert.equal(findCharacter("tsumu")?.name, "ツム", "IDでも引ける");
});

await test("ID重複がない", () => {
  const ids = CHARACTERS.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

await test("未知のキャラは undefined", () => {
  assert.equal(findCharacter("いない子"), undefined);
  assert.equal(findCharacter(""), undefined);
});

await test("describeCharacters は姿かたちを連結し、未知IDは無視する", () => {
  const text = describeCharacters(["tsumu", "unknown-id"]);
  assert.ok(text.includes("chibi"), "ちび頭身の指定が入る");
  assert.ok(text.length > 0);
  assert.equal(describeCharacters([]), "", "空なら空文字");
});

await test("imageMime は対応形式だけ通す", () => {
  assert.equal(imageMime("a.png"), "image/png");
  assert.equal(imageMime("b.JPG"), "image/jpeg");
  assert.equal(imageMime("c.webp"), "image/webp");
  assert.equal(imageMime("d.gif"), undefined);
});

await test("基準画像があれば data URI で読める / 無ければ undefined", async () => {
  const dir = await mkdtemp(join(tmpdir(), "chars-"));
  await writeFile(join(dir, "tsumu.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const ref = await characterReference("tsumu", dir);
  assert.ok(ref?.startsWith("data:image/png;base64,"), "png の data URI になる");
  assert.equal(await characterReference("riku", dir), undefined, "未配置は undefined");

  const refs = await characterReferences(["tsumu", "riku"], dir);
  assert.equal(refs.length, 1, "見つかったぶんだけ集める");
});

await test("参照なしは text-to-image（image_size 付き）", () => {
  const { endpoint, body } = buildImagePayload("a cat", { size: "portrait_16_9", count: 2 });
  assert.ok(!/edit|nano-banana/.test(endpoint), "edit系に切り替わらない");
  assert.equal(body.image_size, "portrait_16_9");
  assert.equal(body.num_images, 2);
  assert.ok(!("image_urls" in body), "参照なしなら image_urls を送らない");
});

await test("参照ありは edit 系に切り替わり image_urls を送る", () => {
  const refs = ["data:image/png;base64,AAAA", "data:image/png;base64,BBBB"];
  const { endpoint, body } = buildImagePayload("a cat", { size: "portrait_16_9", count: 1, refs });
  assert.match(endpoint, /edit|nano-banana/, "参照対応モデルになる");
  assert.deepEqual(body.image_urls, refs);
  assert.ok(!("image_size" in body), "edit系は image_size を送らない");
});

await test("EP1の各カットに cast が定義され、実在キャラのみを指す", () => {
  for (const cut of EP1_CUT_DEFS) {
    assert.ok(Array.isArray(cut.cast), `cut${cut.n} に cast がない`);
    for (const id of cut.cast ?? []) {
      assert.ok(findCharacter(id), `cut${cut.n} の "${id}" が登録簿にない`);
    }
  }
  // 人物が写るカットは1人以上、外観カット(1,8)は空
  assert.equal(EP1_CUT_DEFS.find(c => c.n === 1)?.cast?.length, 0, "外観カットは無人");
  assert.ok((EP1_CUT_DEFS.find(c => c.n === 5)?.cast?.length ?? 0) >= 2, "ミット打ちはコーチ＋子");
});

await test("imagePrompt は describeCast を本文の前に差し込む", () => {
  const cut = EP1_CUT_DEFS[1];
  const plain = imagePrompt(cut);
  const withCast = imagePrompt(cut, { describeCast: "a chibi girl named Tsumu" });
  assert.ok(withCast.startsWith("a chibi girl named Tsumu. "), "先頭にキャラ指定が来る");
  assert.ok(withCast.includes(cut.image), "本文は保たれる");
  assert.ok(plain.startsWith(cut.image), "未指定なら従来どおり");
});

if (fail === 0) {
  console.log(`✓ all character reference tests passed (${pass} cases)`);
  process.exit(0);
} else {
  console.error(`✗ ${fail} of ${pass + fail} cases failed:\n`);
  failures.forEach(f => console.error(f + "\n"));
  process.exit(1);
}
