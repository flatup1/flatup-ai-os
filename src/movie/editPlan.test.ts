/**
 * 編集設計の回帰テスト（API 呼び出しなし）。
 *
 * 目的: 「CapCut に持ち込む前に、数字で破綻を見つける」。
 * 尺の穴・字幕の読み速度・素材IDの打ち間違いは、編集中に気づくと作り直しになる。
 *
 * 実行: `npm run test:movie`
 */

import assert from "node:assert/strict";
import {
  PLANS,
  PLAN_35,
  PLAN_15,
  EDIT_RULES,
  charCount,
  cps,
  endOf,
  findPlan,
  limitsFor,
  requiredShots,
  shotExists,
  toSrt,
} from "./editPlan.js";
import { findShot } from "./promptBank.js";

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

/** 浮動小数の誤差を吸収して比較する（0.1秒刻みの足し算で 19.599999 になるのを防ぐ） */
function near(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) < tol;
}

test("プランIDに重複がない", () => {
  const ids = PLANS.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("カットが隙間なく・重ならず・宣言した尺ぴったりに並んでいる", () => {
  for (const plan of PLANS) {
    let cursor = 0;
    for (const c of plan.clips) {
      assert.ok(
        near(c.at, cursor),
        `${plan.id}: ${c.shot ?? "CTA"} の開始が ${c.at}s。${cursor}s から始まるべき（隙間か重なりがある）`
      );
      cursor = endOf(c);
    }
    assert.ok(
      near(cursor, plan.totalSec),
      `${plan.id}: カット合計が ${cursor}s。宣言した尺は ${plan.totalSec}s`
    );
  }
});

test("1カットが短すぎない（チラつき防止）", () => {
  for (const plan of PLANS) {
    for (const c of plan.clips) {
      assert.ok(
        c.dur >= EDIT_RULES.minClipSec,
        `${plan.id}/${c.shot ?? "CTA"}: ${c.dur}s は短すぎる（下限 ${EDIT_RULES.minClipSec}s）`
      );
    }
  }
});

test("素材IDが promptBank に実在する（打ち間違い検出）", () => {
  for (const plan of PLANS) {
    for (const id of requiredShots(plan)) {
      assert.ok(shotExists(id), `${plan.id}: 素材 ${id} が promptBank に無い`);
    }
  }
});

test("動画化する4カットだけが動画素材で、他は静止画", () => {
  // V* は image-to-video で作るカット。増やすときは正本(§動画生成工程)の見直しが要る。
  for (const plan of PLANS) {
    const videos = requiredShots(plan).filter(id => id.startsWith("V"));
    for (const v of videos) {
      assert.ok(["V1", "V2", "V3", "V4"].includes(v), `${plan.id}: 想定外の動画カット ${v}`);
    }
  }
});

test("動画カットは生成尺に収まっている（存在しない秒を使わない）", () => {
  // 生成尺は promptBank の durationSec が正本。ここで突き合わせる。
  for (const plan of PLANS) {
    for (const c of plan.clips) {
      if (!c.shot?.startsWith("V")) continue;
      const gen = findShot(c.shot)?.durationSec;
      assert.ok(gen !== undefined, `${c.shot}: 生成尺が promptBank に無い`);
      assert.ok(
        c.dur <= gen,
        `${plan.id}/${c.shot}: タイムラインで ${c.dur}s 使うが、生成するのは ${gen}s しかない`
      );
    }
  }
});

test("字幕が重ならず、入れ替わりが認識できる間隔を持つ", () => {
  for (const plan of PLANS) {
    const subs = [...plan.subtitles].sort((a, b) => a.at - b.at);
    for (let i = 1; i < subs.length; i++) {
      const gap = subs[i].at - endOf(subs[i - 1]);
      assert.ok(
        gap >= EDIT_RULES.minSubtitleGapSec - 1e-9,
        `${plan.id}: 字幕${i}と${i + 1}の間隔が ${gap.toFixed(2)}s（下限 ${EDIT_RULES.minSubtitleGapSec}s）\n` +
        `   「${subs[i - 1].text.replace(/\n/g, " ")}」→「${subs[i].text.replace(/\n/g, " ")}」`
      );
    }
  }
});

test("字幕が読める速度に収まっている（最重要）", () => {
  for (const plan of PLANS) {
    for (const s of plan.subtitles) {
      const { maxCps } = limitsFor(s);
      assert.ok(
        cps(s) <= maxCps,
        `${plan.id}: 「${s.text.replace(/\n/g, " ")}」は ${cps(s).toFixed(1)}字/秒。` +
        `上限 ${maxCps}字/秒を超えていて読み切れない（${charCount(s.text)}字なら ` +
        `${(charCount(s.text) / maxCps).toFixed(1)}s 以上必要）`
      );
    }
  }
});

test("字幕が短すぎない（読む前に消えない）", () => {
  for (const plan of PLANS) {
    for (const s of plan.subtitles) {
      const { minSec } = limitsFor(s);
      assert.ok(
        s.dur >= minSec,
        `${plan.id}: 「${s.text.replace(/\n/g, " ")}」が ${s.dur}s（下限 ${minSec}s）`
      );
    }
  }
});

test("字幕が縦型画面で折り返さない（行数・行長）", () => {
  for (const plan of PLANS) {
    for (const s of plan.subtitles) {
      const lines = s.text.split("\n");
      assert.ok(
        lines.length <= EDIT_RULES.maxSubtitleLines,
        `${plan.id}: 「${s.text.replace(/\n/g, " ")}」が ${lines.length}行（上限 ${EDIT_RULES.maxSubtitleLines}行）`
      );
      for (const line of lines) {
        assert.ok(
          line.length <= EDIT_RULES.maxCharsPerLine,
          `${plan.id}: 「${line}」が ${line.length}字（1行の上限 ${EDIT_RULES.maxCharsPerLine}字）`
        );
      }
    }
  }
});

test("字幕が尺からはみ出さない", () => {
  for (const plan of PLANS) {
    for (const s of plan.subtitles) {
      assert.ok(
        endOf(s) <= plan.totalSec + 1e-9,
        `${plan.id}: 「${s.text.replace(/\n/g, " ")}」が ${endOf(s)}s で終わる（尺は ${plan.totalSec}s）`
      );
    }
  }
});

test("音の指示が尺の中に収まっている", () => {
  for (const plan of PLANS) {
    for (const q of plan.sound) {
      assert.ok(q.at >= 0 && q.at <= plan.totalSec, `${plan.id}: 音指示 ${q.at}s が尺外`);
    }
  }
});

test("35秒版はシーンの区切りが正本どおり（S1:3 S2:7 S3:13 S4:17 S5:26 S6:31）", () => {
  // 正本 docs/emotional_movie_ep0.md の「完成台本」の秒数。ここがズレたら台本と映像が食い違う。
  const boundaries = [3, 7, 13, 17, 26, 31];
  const cutPoints = new Set(PLAN_35.clips.map(c => Number(c.at.toFixed(3))));
  for (const b of boundaries) {
    assert.ok(cutPoints.has(b), `35秒版: ${b}s にカットの切り替わりが無い（台本のシーン境界）`);
  }
});

test("最重要カット(手が離れる)は無字幕で始まらない=説明を被せない設計になっている", () => {
  // V2 は「間で見せる」カット。その最中に別のセリフ字幕が動いていると台無しになる。
  const v2 = PLAN_35.clips.find(c => c.shot === "V2")!;
  const overlapping = PLAN_35.subtitles.filter(
    s => s.at < endOf(v2) - 1e-9 && endOf(s) > v2.at + 1e-9
  );
  // ミットの「今日、はじめて〜」1本だけは意図的に重ねる（この子だと明かす台詞）。
  assert.equal(
    overlapping.length, 1,
    `V2 に重なる字幕は1本だけの想定。今は ${overlapping.length} 本: ` +
    overlapping.map(s => s.text.replace(/\n/g, " ")).join(" / ")
  );
  assert.equal(overlapping[0].speaker, "ミット");
});

test("15秒版は切り出しではなく再設計されている（正本の指示）", () => {
  // 35秒版と同じ「素材の並び」をそのまま短くしただけなら設計になっていない。
  const long = requiredShots(PLAN_35);
  const short = requiredShots(PLAN_15);
  assert.ok(short.length < long.length, "15秒版の素材数が35秒版と同じか多い");
  // 4本の動画カットだけで無音でも成立させる、という設計意図を固定する。
  assert.deepEqual(short, ["V1", "V2", "V3", "V4"]);
});

test("SRT が正しい形式で書き出せる", () => {
  const srt = toSrt(PLAN_35);
  assert.match(srt, /^1\n00:00:00,400 --> 00:00:03,200\n/);
  // 連番が字幕の本数ぶんある
  const indices = srt.match(/^\d+$/gm) ?? [];
  assert.equal(indices.length, PLAN_35.subtitles.length);
  // タイムコードの形が全部そろっている
  const stamps = srt.match(/\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/g) ?? [];
  assert.equal(stamps.length, PLAN_35.subtitles.length);
});

test("findPlan は大文字小文字を無視して解決できる", () => {
  assert.equal(findPlan("EP0-35S")?.id, "ep0-35s");
  assert.equal(findPlan("nope"), undefined);
});

if (fail === 0) {
  console.log(`✓ all edit plan tests passed (${pass} cases)`);
  process.exit(0);
} else {
  console.error(`✗ ${fail} of ${pass + fail} cases failed:\n`);
  failures.forEach(f => console.error(f + "\n"));
  process.exit(1);
}
