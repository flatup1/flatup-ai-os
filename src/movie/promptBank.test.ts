/**
 * 第0話ショット銀行の回帰テスト(API 呼び出しなし)。
 *
 * 実行: `npm run test:movie`
 */

import assert from "node:assert/strict";
import {
  SHOTS, shotsByPhase, buildShotPrompt, findShot,
  CHAR_TOKENS, REF_SHEETS, MAX_ATTACH, charactersIn, hasHuman, refSheetsFor,
} from "./promptBank.js";

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

test("フェーズごとの本数が正本どおり(refs=12, scenes=12, cuts=4)", () => {
  // refs=12: 舞台1 + 道具7 + 全員1 + 人間3(2026-08-02 追加)
  assert.equal(shotsByPhase("refs").length, 12);
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

test("静止画ショットは STYLE 込み(文字禁止・タトゥー禁止・縦9:16・オリジナル明記)", () => {
  for (const shot of SHOTS.filter(s => s.phase !== "cuts")) {
    const p = buildShotPrompt(shot);
    for (const required of ["No text", "No tattoos", "Vertical 9:16", "original character design"]) {
      assert.ok(
        p.toLowerCase().includes(required.toLowerCase()),
        `${shot.id}: "${required}" が見つからない`
      );
    }
  }
});

test("静止画ショットは「愛されるキャラ」の指定を含む(JIN指示 2026-08-02)", () => {
  // 既存作品名は使えないので、可愛さを作る要素そのものを必ず書かせる。
  for (const shot of SHOTS.filter(s => s.phase !== "cuts")) {
    const p = buildShotPrompt(shot).toLowerCase();
    for (const required of ["lovable", "catchlight", "blush", "rounded"]) {
      assert.ok(p.includes(required), `${shot.id}: "${required}" が見つからない`);
    }
  }
});

test("道具の質感(ぬいぐるみ・ずんぐりした手足)が人間だけのカットに漏れていない", () => {
  // STYLE に入れると母親の顔アップまでぬいぐるみになる。道具ブロック側で持つこと。
  const toolNames = ["GLOVE —", "MITT —", "TIMER —", "SANDBAGS —"];
  for (const shot of SHOTS) {
    const p = buildShotPrompt(shot);
    if (!p.includes("plush toy")) continue;
    assert.ok(
      toolNames.some(n => p.includes(n)),
      `${shot.id}: 道具が出てこないのに "plush toy" が入っている`
    );
  }
});

test("人間キャラのカットは実在人物に似せない指定を含む", () => {
  for (const shot of SHOTS) {
    const p = buildShotPrompt(shot);
    if (!/TSUMU —|MOTHER —|MASAKI —/.test(p)) continue;
    assert.ok(
      /not resembling any real person|original character/i.test(p),
      `${shot.id}: 人物が出るのに「実在人物に似せない」指定がない`
    );
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

test("基本プロンプトは添付前提の文言を含まない(参照指示は添付時のみ後付け)", () => {
  for (const shot of SHOTS) {
    const p = buildShotPrompt(shot).toLowerCase();
    assert.ok(!p.includes("attached"), `${shot.id}: 添付前提の "attached" が基本プロンプトに残っている`);
  }
});

test("ブロック合成で句読点が壊れていない(feel safe.: のような繋ぎ目)", () => {
  for (const shot of SHOTS) {
    const p = buildShotPrompt(shot);
    const broken = p.match(/.{0,25}\.[,:;]/);
    assert.ok(!broken, `${shot.id}: 句読点の繋ぎ目が壊れている → "${broken?.[0]}"`);
  }
});


test("シーンに出る全キャラに設定画が用意されている（Day1の抜け検出）", () => {
  // 2026-08-02: 12シーン中7シーンに人間が出るのに、人間の設定画が1枚も無かった。
  const refIds = new Set(shotsByPhase("refs").map(s => s.id));
  for (const shot of shotsByPhase("scenes")) {
    for (const sheet of refSheetsFor(shot)) {
      assert.ok(refIds.has(sheet), `${shot.id}: 参照すべき設定画 ${sheet} が refs に無い`);
    }
  }
});

test("全キャラトークンに設定画の割り当てがある", () => {
  const refIds = new Set(shotsByPhase("refs").map(s => s.id));
  for (const token of CHAR_TOKENS) {
    const sheets = REF_SHEETS[token];
    assert.ok(sheets && sheets.length > 0, `${token}: 設定画の割り当てが無い`);
    for (const id of sheets) {
      assert.ok(refIds.has(id), `${token} → ${id} が refs に存在しない`);
    }
  }
});

test("設定画は、そのキャラ本人だけを描く（他キャラが混ざらない）", () => {
  const owner = new Map<string, string>();
  for (const [token, sheets] of Object.entries(REF_SHEETS)) {
    for (const id of sheets) owner.set(id, token);
  }
  for (const shot of shotsByPhase("refs")) {
    const own = owner.get(shot.id);
    if (!own) continue; // M1(舞台) と M6(全員集合) は対象外
    assert.deepEqual(
      charactersIn(shot), [own],
      `${shot.id} は ${own} の設定画なのに、他のキャラも描かれている`
    );
  }
});

test("人間が出るショットの判定が正しい", () => {
  assert.equal(hasHuman(findShot("C5f")!), true);   // 母
  assert.equal(hasHuman(findShot("C3")!), false);   // 道具だけ
  assert.equal(hasHuman(findShot("C5c")!), false);  // 手だけ(キャラブロックなし)
  assert.equal(hasHuman(findShot("M7")!), true);    // マサキ設定画
});


test("添付上限で切っても、出演する全キャラが最低1枚は参照を持つ", () => {
  // 2026-08-02: C7(道具3体+ツム+母=8枚)を素直に並べると上限6枚で
  // 人間2人の参照が丸ごと落ちていた。キャラごとに1枚ずつ取る順にして解決。
  const owner = new Map<string, string>();
  for (const [token, sheets] of Object.entries(REF_SHEETS)) {
    for (const id of sheets) owner.set(id, token);
  }
  for (const shot of shotsByPhase("scenes")) {
    const chars = charactersIn(shot);
    if (chars.length === 0) continue;
    const attached = refSheetsFor(shot).slice(0, MAX_ATTACH);
    const covered = new Set(attached.map(id => owner.get(id)));
    for (const c of chars) {
      assert.ok(
        covered.has(c),
        `${shot.id}: ${c} の参照が上限${MAX_ATTACH}枚で全部落ちている` +
        `（並び: ${refSheetsFor(shot).join(", ")}）`
      );
    }
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
