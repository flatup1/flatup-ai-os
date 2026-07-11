/**
 * プロンプト銀行の回帰テスト(API 呼び出しなし)。
 *
 * 実行: `npm run test:reel`
 */

import assert from "node:assert/strict";
import { SERIES, resolveSeries, buildPrompt, buildCaption, buildHashtags } from "./promptBank.js";

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

test("シリーズは10本以上ある", () => {
  assert.ok(SERIES.length >= 10, `expected >= 10 series, got ${SERIES.length}`);
});

test("シリーズ名の重複がない", () => {
  const names = SERIES.map(s => s.name);
  assert.equal(new Set(names).size, names.length);
});

// 全シリーズ×最初の4本: 必須要素がプロンプトに入っている
for (const series of SERIES) {
  test(`${series.name}: プロンプトに必須要素が入っている`, () => {
    for (let i = 0; i < 4; i++) {
      const p = buildPrompt(series, i);
      for (const required of ["photorealistic", "9:16", "6 seconds", "no humans visible", "Fixed camera"]) {
        assert.ok(p.includes(required), `"${required}" が見つからない: ${p.slice(0, 80)}...`);
      }
    }
  });

  test(`${series.name}: キャプションに話数が入る`, () => {
    assert.ok(buildCaption(series, 0).includes("1"));
    assert.ok(buildCaption(series, 2).includes("3"));
  });

  test(`${series.name}: ハッシュタグに共通タグが入る`, () => {
    assert.ok(buildHashtags(series).includes("#aivideo"));
  });

  test(`${series.name}: 自身の名前で解決できる`, () => {
    assert.equal(resolveSeries(series.name)?.name, series.name);
  });
}

test("バリエーション: 隣り合う話数でプロンプトが変わる", () => {
  for (const series of SERIES) {
    if (series.sequences.length < 2) continue;
    assert.notEqual(buildPrompt(series, 0), buildPrompt(series, 1), series.name);
  }
});

test("組み合わせ入力で解決できる(猫×柔術 → にゃん術)", () => {
  assert.equal(resolveSeries("猫×柔術")?.name, "にゃん術");
});

test("組み合わせ入力で解決できる(犬×キックボクシング → キックドクシング)", () => {
  assert.equal(resolveSeries("犬×キックボクシング")?.name, "キックドクシング");
});

test("組み合わせ入力で解決できる(猫×ボクシング → ニャクシング)", () => {
  assert.equal(resolveSeries("猫×ボクシング")?.name, "ニャクシング");
});

test("未知の入力は undefined", () => {
  assert.equal(resolveSeries("ゾウ×フェンシング"), undefined);
  assert.equal(resolveSeries(""), undefined);
});

if (fail === 0) {
  console.log(`✓ all prompt bank tests passed (${pass} cases)`);
  process.exit(0);
} else {
  console.error(`✗ ${fail} of ${pass + fail} cases failed:\n`);
  failures.forEach(f => console.error(f + "\n"));
  process.exit(1);
}
