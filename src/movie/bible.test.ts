/**
 * docs/bible/（索引）が現実とズレていないかの検査。
 *
 * 索引は放っておくと腐る。腐った索引は、無いより有害
 * （読んだAIが存在しないファイルを探し、古い数字を信じる）。
 * だから機械で縛る:
 *   - 参照しているファイルが実在するか
 *   - 巻どうしのリンクが切れていないか
 *   - 数字が正本と一致しているか
 *   - 正本を書き写して肥大化していないか（索引は指すだけ）
 *
 * 実行: `npm run test:movie`
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { shotsByPhase } from "./promptBank.js";
import { PLAN_35, PLAN_15 } from "./editPlan.js";

const DIR = join(process.cwd(), "docs", "bible");

let pass = 0;
let fail = 0;
const failures: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
  } catch (err) {
    fail++;
    failures.push(`✗ ${name}\n   ${err instanceof Error ? err.message : String(err)}`);
  }
}

const files = readdirSync(DIR).filter(f => f.endsWith(".md")).sort();
const read = (f: string) => readFileSync(join(DIR, f), "utf8");

/**
 * 作業用ディレクトリは .gitignore 対象で、まだ空なのが正常。
 * 「ここに置く」という案内は、実在しなくても間違いではない。
 */
const WORKDIRS = ["assets/movie/", "output/"];

test("18巻＋README が揃っている", () => {
  assert.equal(files.length, 19, `${files.length}ファイル。18巻＋README＝19のはず`);
  assert.ok(files.includes("README.md"));
  assert.ok(files.includes("MASTER_PROMPT.md"));
  for (let i = 0; i <= 16; i++) {
    const prefix = String(i).padStart(2, "0") + "_";
    assert.ok(files.some(f => f.startsWith(prefix)), `${prefix}* の巻が無い`);
  }
});

test("参照しているファイルがすべて実在する", () => {
  for (const f of files) {
    for (const m of read(f).matchAll(/`((?:docs|src|assets|scripts)\/[^`\s]+)`/g)) {
      const p = m[1].replace(/[.,]$/, "");
      if (p.includes("*") || p.endsWith("/")) continue;
      if (WORKDIRS.some(w => p.startsWith(w))) continue; // 作業用は空が正常
      assert.ok(existsSync(p), `${f}: 参照先が実在しない → ${p}`);
    }
  }
});

test("巻どうしのリンクが切れていない", () => {
  for (const f of files) {
    for (const m of read(f).matchAll(/\]\((\d\d_[A-Z_]+\.md|MASTER_PROMPT\.md)\)/g)) {
      assert.ok(existsSync(join(DIR, m[1])), `${f}: リンク切れ → ${m[1]}`);
    }
  }
});

test("索引が正本を書き写して肥大化していない", () => {
  // 索引は「どこを見るか」を書く場所。長い巻は写経のサイン＝正本の二重化。
  for (const f of files) {
    const n = read(f).length;
    assert.ok(n <= 4000, `${f}: ${n}文字。索引にしては長い（正本を写していないか確認）`);
  }
});

test("数字が正本と一致している", () => {
  const ch = read("03_CHARACTER_BIBLE.md");
  assert.ok(
    ch.includes(`${shotsByPhase("refs").length}種`),
    `03: 設定画の数が正本(${shotsByPhase("refs").length}種)と違う`
  );
  const sc = read("06_SCREENPLAY.md");
  assert.ok(sc.includes(`${PLAN_35.totalSec}秒`), `06: 尺が正本(${PLAN_35.totalSec}秒)と違う`);
  assert.ok(read("09_VIDEO_GUIDE.md").includes("4カット"), "09: 動画カット数が違う");
  // 15秒版の存在にも触れていること
  assert.ok(PLAN_15.totalSec === 15, "editPlan 側の15秒版が変わっている");
});

test("第0話のシーン境界が台本どおりに載っている", () => {
  const sc = read("06_SCREENPLAY.md");
  for (const b of ["3–7", "7–13", "13–17", "17–26", "26–31", "31–35"]) {
    assert.ok(sc.includes(b), `06: シーン境界 ${b} が抜けている`);
  }
});

test("存在しないものを「ある」と書いていない", () => {
  // 12_WEB_SYSTEM は外部提案にあったが実体が無い。無いと明記させる。
  assert.match(read("12_WEB_SYSTEM.md"), /存在しない/);
  // 第1話以降の脚本は無い。あると書いたら嘘になる。
  assert.match(read("05_STORY_BIBLE.md"), /未着手|❌/);
});

test("索引が「正本ではない」と自分で明示している", () => {
  for (const f of files) {
    const s = read(f);
    assert.ok(
      s.includes("正本ではない") || s.includes("正本の場所を指す") || f === "MASTER_PROMPT.md",
      `${f}: 索引である旨の但し書きが無い（正本と誤読される）`
    );
  }
});

test("未確定が正直に残っている（勝手に埋めていない）", () => {
  // 素材が無い巻には未確認のチェックボックスが残っているはず。
  // ここが空になったら、誰かが創作で埋めた可能性がある。
  for (const f of ["03_CHARACTER_BIBLE.md", "05_STORY_BIBLE.md", "12_WEB_SYSTEM.md"]) {
    assert.match(read(f), /- \[ \]/, `${f}: 未確定の項目が消えている`);
  }
});

if (fail === 0) {
  console.log(`✓ all bible index tests passed (${pass} cases)`);
  process.exit(0);
} else {
  console.error(`✗ ${fail} of ${pass + fail} cases failed:\n`);
  failures.forEach(f => console.error(f + "\n"));
  process.exit(1);
}
