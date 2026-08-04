/**
 * 動画ファクトリーの回帰テスト（ネットワークなし・コストゼロ）。
 *
 * 実行: `npm run test:factory`
 *
 * 守りたいこと:
 * - プロンプトに禁止事項が必ず入る（怖い・暴力的な動画を作らない）
 * - バイブル正本キャラの姿かたちが characters.ts とズレない
 * - 予算ガードと再開（重複生成の防止）が効く
 * - Colabノート⑦の場面キーと、このTS側の場面キーが一致する
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SCENES, RULES, resolveScene, buildScenePrompt } from "./scenes.js";
import { planJobs, remainingJobs, checkBudget, estimateCostUsd } from "./plan.js";
import { summarize, type LedgerEntry } from "./ledger.js";
import { adaptCanvas, framesForSeconds, buildH3Workflow, findVideoOutputs } from "./comfyH3.js";
import { renderPromptMd, extractPrompt, exportPrompts, loadScenePrompt, promptPath } from "./prompts.js";
import { toCsv, parseCsv, MANIFEST_COLUMNS, type ManifestRow } from "./manifestCsv.js";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { findCharacter } from "../reel/characters.js";

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

// --- 場面バンク ---

await test("場面キーは重複しない", () => {
  const keys = SCENES.map(s => s.key);
  assert.equal(new Set(keys).size, keys.length);
});

await test("バイブル出典の場面が存在する（本編EP用）", () => {
  const bible = SCENES.filter(s => s.source === "bible");
  assert.ok(bible.length >= 2, "マサキ・ツムの場面がある");
  assert.ok(bible.some(s => s.key === "tsumu_first_step"));
  assert.ok(bible.some(s => s.key === "masaki_welcome"));
});

await test("バイブル出典の世界観は characters.ts の look をそのまま含む", () => {
  const tsumu = SCENES.find(s => s.key === "tsumu_first_step");
  const masaki = SCENES.find(s => s.key === "masaki_welcome");
  assert.ok(tsumu?.world.includes(findCharacter("tsumu")!.look), "ツムの姿が正本と一致");
  assert.ok(masaki?.world.includes(findCharacter("masaki")!.look), "マサキの姿が正本と一致");
});

await test("全場面のプロンプトに禁止事項が入る", () => {
  for (const s of SCENES) {
    const p = buildScenePrompt(s);
    assert.ok(p.includes(RULES), `${s.key} に禁止事項が無い`);
    assert.ok(/No text/.test(p), `${s.key}: 文字を出さない指示`);
    assert.ok(/no sparring/.test(p), `${s.key}: 当てるスパー禁止`);
    assert.ok(/no expression of pain/.test(p), `${s.key}: 痛がる表情の禁止`);
    assert.ok(/9:16/.test(p), `${s.key}: 縦型指定`);
  }
});

await test("プロンプトは 世界観 → Timeline → Audio → 禁止事項 の順", () => {
  const p = buildScenePrompt(SCENES[0], 6);
  const iWorld = 0;
  const iTimeline = p.indexOf("Timeline (6 seconds total)");
  const iAudio = p.indexOf("Audio:");
  const iRules = p.indexOf("No text");
  assert.ok(iWorld < iTimeline && iTimeline < iAudio && iAudio < iRules, `順番が違う: ${p.slice(0, 80)}`);
});

await test("場面はキーでも日本語でも引ける", () => {
  assert.equal(resolveScene("jab")?.key, "jab");
  assert.equal(resolveScene("JAB")?.key, "jab");
  assert.ok(resolveScene("休憩"), "日本語の一部でも引ける");
  assert.equal(resolveScene("そんな場面はない"), undefined);
  assert.equal(resolveScene(""), undefined);
});

await test("1カットの動作は3ブロックに収める（破綻防止）", () => {
  for (const s of SCENES) {
    assert.ok(s.timeline.length <= 4, `${s.key}: タイムラインが長すぎる`);
    assert.ok(s.timeline.every(t => /^\[\d+s-\d+s\]/.test(t)), `${s.key}: 秒の見出しが無い行がある`);
  }
});

// --- 計画・予算・再開 ---

await test("場面 × テイクぶんのジョブが並ぶ", () => {
  const jobs = planJobs({
    scenes: SCENES.slice(0, 2),
    takes: 3,
    seconds: 6,
    seedBase: 1000,
    outDir: "/tmp/out",
  });
  assert.equal(jobs.length, 6);
  assert.equal(new Set(jobs.map(j => j.label)).size, 6, "ラベルは一意");
  assert.deepEqual(
    jobs.filter(j => j.sceneKey === SCENES[0].key).map(j => j.seed),
    [1000, 1001, 1002]
  );
  assert.ok(jobs[0].file.endsWith(".mp4"));
});

await test("seedBase が同じなら同じ計画が再現される", () => {
  const opts = { scenes: SCENES.slice(0, 1), takes: 2, seconds: 6, seedBase: 42, outDir: "/tmp/o" };
  assert.deepEqual(planJobs(opts), planJobs(opts));
});

await test("出来ているファイルは飛ばす（再開できる）", () => {
  const jobs = planJobs({ scenes: SCENES.slice(0, 2), takes: 1, seconds: 6, seedBase: 1, outDir: "/tmp/o" });
  const existing = new Set([jobs[0].file]);
  assert.equal(remainingJobs(jobs, existing).length, 1);
  assert.equal(remainingJobs(jobs, existing, true).length, 2, "--force なら全部作り直す");
});

await test("予算を超えるバッチは実行前に止まる", () => {
  const over = checkBudget(100, 5);
  assert.equal(over.ok, false);
  assert.ok(/上限/.test(over.message));
  assert.equal(checkBudget(3, 5).ok, true);
  assert.equal(checkBudget(1000).ok, true, "上限未指定なら止めない");
});

await test("コスト見積は本数に比例する", () => {
  const one = estimateCostUsd(1, 0.28);
  assert.equal(one, 0.28);
  assert.equal(estimateCostUsd(10, 0.28), 2.8);
});

// --- 台帳 ---

await test("台帳の集計は DRY-RUN を数えない", () => {
  const entries: LedgerEntry[] = [
    { ts: "t", backend: "fal", model: "m", scene: "jab", seed: 1, label: "a", status: "ok", est_cost_usd: 0.28 },
    { ts: "t", backend: "fal", model: "m", scene: "jab", seed: 2, label: "b", status: "failed" },
    { ts: "t", backend: "fal", model: "m", scene: "wave", seed: 3, label: "c", status: "dry-run" },
  ];
  const s = summarize(entries);
  assert.equal(s.total, 2);
  assert.equal(s.ok, 1);
  assert.equal(s.failed, 1);
  assert.equal(s.costUsd, 0.28);
  assert.equal(s.byScene.find(r => r.scene === "jab")?.ok, 1);
});

// --- H3 バックエンド（ComfyUI本体の規則と一致するか） ---

await test("9:16は768x1344になる（H3のキャンバス規則）", () => {
  assert.deepEqual(adaptCanvas(9, 16), { width: 768, height: 1344 });
  assert.deepEqual(adaptCanvas(16, 9), { width: 1344, height: 768 });
  assert.deepEqual(adaptCanvas(1, 1), { width: 768, height: 768 });
});

await test("フレーム数は 17k+5 に丸まる", () => {
  assert.equal(framesForSeconds(5), 124);
  assert.equal(framesForSeconds(6), 158);
  assert.equal(framesForSeconds(0.1), 5, "最低5フレーム");
  for (const sec of [1, 2, 3, 6, 10, 15]) {
    assert.equal(framesForSeconds(sec) % 17, 5, `${sec}秒が格子に乗らない`);
  }
});

await test("H3ワークフローは公式テンプレと同じノードを持つ", () => {
  const wf = buildH3Workflow({ comfyUrl: "http://x", prompt: "p", seed: 7, imageName: "a.png" });
  for (const cls of [
    "UNETLoader",
    "CLIPLoader",
    "VAELoader",
    "MiniMaxH3ImageToVideo",
    "RandomNoise",
    "KSamplerSelect",
    "BasicScheduler",
    "BasicGuider",
    "SamplerCustomAdvanced",
    "VAEDecode",
    "VAEDecodeAudio",
    "CreateVideo",
    "SaveVideo",
    "LoadImage",
  ]) {
    assert.ok(
      Object.values(wf).some(n => n.class_type === cls),
      `${cls} が無い`
    );
  }
  assert.equal(wf["13"].inputs.type, "minimax", "text encoder の種別");
  assert.equal(wf["17"].inputs.sampler_name, "res_multistep");
  assert.equal(wf["9"].inputs.steps, 20);
  assert.equal(wf["91"].inputs.fps, 24);
  assert.equal(wf["104"].inputs.width, 768);
  assert.equal(wf["104"].inputs.height, 1344);
  assert.equal(wf["104"].inputs.length, 158, "6秒 = 158フレーム");
  assert.deepEqual(wf["104"].inputs.first_frame, ["114", 0]);
});

await test("画像を渡さなければ T2V になる（LoadImage を作らない）", () => {
  const wf = buildH3Workflow({ comfyUrl: "http://x", prompt: "p", seed: 1 });
  assert.ok(!("114" in wf), "LoadImage が残っている");
  assert.ok(!("first_frame" in wf["104"].inputs), "first_frame が残っている");
});

await test("history から mp4 を拾える", () => {
  const hist = {
    outputs: {
      "92": { images: [{ filename: "FLATUP_jab_00001.mp4", subfolder: "video", type: "output" }] },
      "10": { other: "not-an-array" },
    },
  };
  const files = findVideoOutputs(hist);
  assert.equal(files.length, 1);
  assert.equal(files[0].filename, "FLATUP_jab_00001.mp4");
  assert.equal(findVideoOutputs({}).length, 0, "outputs が無くても落ちない");
});

// --- ノートとの整合（正本を2か所に分けたことによるズレを検出する） ---

await test("Colabノート⑦の場面キーと一致する", async () => {
  const path = join(process.cwd(), "notebooks", "colab_minimax_h3_i2v.ipynb");
  const nb = JSON.parse(await readFile(path, "utf8")) as {
    cells: Array<{ cell_type: string; source: string[] }>;
  };
  const src = nb.cells.filter(c => c.cell_type === "code").map(c => c.source.join("\n")).join("\n");
  const block = src.slice(src.indexOf("SCENES = {"));
  assert.ok(block.length > 0, "ノートに SCENES が無い");
  for (const s of SCENES) {
    assert.ok(block.includes(`'${s.key}': {`), `ノート⑦に場面 ${s.key} が無い`);
  }
});

// --- プロンプト置き場（prompts/reels/*.md） ---

await test("書き出したmdから、同じプロンプトを読み戻せる", async () => {
  const dir = await mkdtemp(join(tmpdir(), "flatup-prompts-"));
  const scene = SCENES.find(s => s.key === "first_punch")!;
  const { written } = await exportPrompts([scene], { cwd: dir });
  assert.equal(written.length, 1);
  assert.ok(written[0].endsWith("first_punch.md"));

  const loaded = await loadScenePrompt(scene, 6, dir);
  assert.equal(loaded.sourceFile, "first_punch.md");
  assert.equal(loaded.prompt, buildScenePrompt(scene, 6), "中身が場面バンクと一致");
});

await test("mdが無ければ場面バンクにフォールバックする", async () => {
  const dir = await mkdtemp(join(tmpdir(), "flatup-prompts-"));
  const scene = SCENES[0];
  const loaded = await loadScenePrompt(scene, 6, dir);
  assert.equal(loaded.sourceFile, "(場面バンク)");
  assert.ok(loaded.prompt.includes("No text"));
});

await test("mdを手で直すと、その内容が使われる", async () => {
  const dir = await mkdtemp(join(tmpdir(), "flatup-prompts-"));
  const scene = SCENES.find(s => s.key === "jab")!;
  await exportPrompts([scene], { cwd: dir });
  const { writeFile } = await import("node:fs/promises");
  await writeFile(promptPath(scene.key, dir), "# 手直し\n\n```prompt\nHAND EDITED PROMPT\n```\n");
  const loaded = await loadScenePrompt(scene, 6, dir);
  assert.equal(loaded.prompt, "HAND EDITED PROMPT");
});

await test("既存のmdは上書きしない（--force のときだけ上書き）", async () => {
  const dir = await mkdtemp(join(tmpdir(), "flatup-prompts-"));
  const scene = SCENES[0];
  await exportPrompts([scene], { cwd: dir });
  const second = await exportPrompts([scene], { cwd: dir });
  assert.equal(second.written.length, 0);
  assert.equal(second.skipped.length, 1);
  const forced = await exportPrompts([scene], { cwd: dir, force: true });
  assert.equal(forced.written.length, 1);
});

await test("フェンスが無いmdは、直し方つきで落ちる", async () => {
  const dir = await mkdtemp(join(tmpdir(), "flatup-prompts-"));
  const scene = SCENES[0];
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir(join(dir, "prompts", "reels"), { recursive: true });
  await writeFile(promptPath(scene.key, dir), "フェンスを消してしまった");
  await assert.rejects(() => loadScenePrompt(scene, 6, dir), /export-prompts/);
});

await test("mdの見出しに場面の日本語名と出典が入る", () => {
  const scene = SCENES.find(s => s.key === "tsumu_first_step")!;
  const md = renderPromptMd(scene);
  assert.ok(md.includes(scene.jp));
  assert.ok(md.includes("ANIMATION BIBLE"), "バイブル出典だと分かる");
  assert.equal(extractPrompt(md), buildScenePrompt(scene, 6));
});

// --- manifest.csv ---

function row(over: Partial<ManifestRow> = {}): ManifestRow {
  return {
    id: "001", scene: "first_punch", image: "apu_front.png", prompt: "first_punch.md",
    model: "hailuo", seed: "1000", status: "ok", file: "all/001.mp4", judge: "", memo: "",
    ...over,
  };
}

await test("CSVは往復しても壊れない", () => {
  const rows = [row(), row({ id: "002", status: "failed", memo: "手が崩れた" })];
  const parsed = parseCsv(toCsv(rows));
  assert.deepEqual(parsed, rows);
});

await test("memoにカンマ・改行・引用符を書いても壊れない", () => {
  const rows = [row({ memo: '表情よい, ただし手が"変", 次は\nseed変更' })];
  const parsed = parseCsv(toCsv(rows));
  assert.equal(parsed[0].memo, rows[0].memo);
  assert.equal(parsed.length, 1, "改行入りでも1行のまま");
});

await test("CSVの見出しは決めた順で出る（表計算で開ける形）", () => {
  const csv = toCsv([row()]);
  assert.equal(csv.split("\n")[0], MANIFEST_COLUMNS.join(","));
  assert.ok(csv.includes("judge"), "人がA/B/Cを書く欄がある");
});

await test("空CSV・見出しだけのCSVでも落ちない", () => {
  assert.deepEqual(parseCsv(""), []);
  assert.deepEqual(parseCsv(MANIFEST_COLUMNS.join(",") + "\n"), []);
});

await test("失敗した行だけ拾える（--retry-failed の判定）", () => {
  const rows = [row(), row({ id: "002", status: "failed" }), row({ id: "003", status: "" })];
  const failed = parseCsv(toCsv(rows)).filter(r => r.status !== "ok");
  assert.deepEqual(failed.map(r => r.id), ["002", "003"]);
});

console.log(failures.join("\n"));
console.log(
  fail === 0
    ? `✓ all factory tests passed (${pass} cases)`
    : `✗ ${fail} failed / ${pass} passed`
);
process.exit(fail === 0 ? 0 : 1);
