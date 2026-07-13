/**
 * 第0話ショット銀行の回帰テスト(API 呼び出しなし)。
 *
 * 実行: `npm run test:movie`
 */

import assert from "node:assert/strict";
import { SHOTS, shotsByPhase, buildShotPrompt, findShot } from "./promptBank.js";

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

test("ショットIDに重複がない", () => {
  const ids = SHOTS.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("フェーズごとの本数が正本どおり(refs=8, scenes=12, cuts=4)", () => {
  assert.equal(shotsByPhase("refs").length, 8);
  assert.equal(shotsByPhase("scenes").length, 12);
  assert.equal(shotsByPhase("cuts").length, 4);
});

test("全ショットのトークンが展開できる(未定義ブロックがない)", () => {
  for (const shot of SHOTS) {
    const p = buildShotPrompt(shot);
    assert.ok(p.length > 50, `${shot.id}: プロンプトが短すぎる`);
    assert.ok(!/\[[A-Z-]+\]/.test(p), `${shot.id}: 未展開トークンが残っている`);
  }
});

test("静止画ショットは STYLE 込み(文字禁止・縦9:16・オリジナル明記)", () => {
  for (const shot of SHOTS.filter(s => s.phase !== "cuts")) {
    const p = buildShotPrompt(shot);
    for (const required of ["No text", "Vertical 9:16", "original character design"]) {
      assert.ok(
        p.toLowerCase().includes(required.toLowerCase()),
        `${shot.id}: "${required}" が見つからない`
      );
    }
  }
});

test("既存IP名がプロンプトに一切入っていない(法務境界線)", () => {
  const banned = ["pixar", "disney", "toy story", "woody", "buzz", "jessie"];
  for (const shot of SHOTS) {
    const p = buildShotPrompt(shot).toLowerCase();
    for (const word of banned) {
      assert.ok(!p.includes(word), `${shot.id}: 禁止ワード "${word}" が含まれている`);
    }
  }
});

test("動画カットは正本の4本で、起点静止画が実在するシーンIDを指す", () => {
  const cuts = shotsByPhase("cuts");
  assert.deepEqual(cuts.map(c => c.id), ["V1", "V2", "V3", "V4"]);
  const sceneIds = new Set(shotsByPhase("scenes").map(s => s.id));
  for (const cut of cuts) {
    assert.ok(cut.sourceStill && sceneIds.has(cut.sourceStill), `${cut.id}: 起点 ${cut.sourceStill} が不正`);
    assert.ok(
      cut.durationSec !== undefined && cut.durationSec >= 3 && cut.durationSec <= 5,
      `${cut.id}: 尺は3〜5秒(1カット1動作の原則)`
    );
  }
});

test("動画カットのプロンプトは1動作限定の演出語を含む", () => {
  for (const cut of shotsByPhase("cuts")) {
    const p = buildShotPrompt(cut).toLowerCase();
    assert.ok(/static (\w+ )?camera/.test(p), `${cut.id}: カメラ固定の指定がない`);
  }
});

test("手が離れるカット(C5c/V2)は顔・全身を排除している", () => {
  for (const id of ["C5c", "V2"]) {
    const p = buildShotPrompt(findShot(id)!).toLowerCase();
    assert.ok(p.includes("no faces"), `${id}: "no faces" の指定がない`);
  }
});

test("findShot は大文字小文字を無視して解決できる", () => {
  assert.equal(findShot("c5c")?.id, "C5c");
  assert.equal(findShot("v1")?.id, "V1");
  assert.equal(findShot("nope"), undefined);
});

if (fail === 0) {
  console.log(`✓ all movie shot bank tests passed (${pass} cases)`);
  process.exit(0);
} else {
  console.error(`✗ ${fail} of ${pass + fail} cases failed:\n`);
  failures.forEach(f => console.error(f + "\n"));
  process.exit(1);
}
