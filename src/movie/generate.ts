/**
 * 「閉館後のFLATUP」第0話の素材生成 CLI(fal.ai)。
 * 正本: docs/emotional_movie_ep0.md / 手順: docs/emotional_movie_ep0_prompts.md
 *
 * 使い方:
 *   npm run movie -- list                 # ショット一覧
 *   npm run movie -- refs  [--takes 2]    # Day1: 正本(キャラ設定画)を生成
 *   npm run movie -- scenes [--only C5c]  # Day2: シーン静止画(採用済み正本を毎回添付)
 *   npm run movie -- cuts  [--takes 2]    # Day4: 優先4カットを image-to-video
 *
 * 素材の置き場所(すべて任意。無くても DRY-RUN/テキストのみ生成で動く):
 *   assets/movie/ep0/base.jpg|png        ジムの基準写真([GYM]を含むショットに添付)
 *   assets/movie/ep0/refs/*.png          JIN が採用した正本画像(scenes で毎回添付)
 *   assets/movie/ep0/stills/<C-id>.png   JIN が採用したシーン静止画(cuts の起点)
 *
 * FAL_KEY 未設定時は DRY-RUN(プロンプトと添付予定のプレビューのみ、コストゼロ)。
 * 生成物: output/movie/ep0/YYYY-MM-DD/<id>[-tN].png|.mp4 + manifest.md
 */

import "../utils/loadEnv.js";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SHOTS, shotsByPhase, buildShotPrompt, type Phase, type Shot } from "./promptBank.js";
import {
  submitAndWait,
  extractImageUrls,
  extractVideoUrl,
  toDataUri,
  download,
  imageEndpoint,
  i2vEndpoint,
} from "./falClient.js";
import { assertValidFalKey } from "../reel/seedance.js";

const ASSET_DIR = join(process.cwd(), "assets", "movie", "ep0");
const REFS_DIR = join(ASSET_DIR, "refs");
const STILLS_DIR = join(ASSET_DIR, "stills");
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_REFS = 6;

const args = process.argv.slice(2);
const positional = args.filter(a => !a.startsWith("--"));
const step = (positional[0] ?? "").toLowerCase();

function usage(): void {
  console.log(`閉館後のFLATUP 第0話 素材生成 (fal.ai)

Usage:
  npm run movie -- list
  npm run movie -- <refs|scenes|cuts> [--takes N] [--only ID1,ID2]

Steps:
  refs    Day1: 正本(夜のジム全景+キャラ設定画+身長比較) ${shotsByPhase("refs").length}枚
  scenes  Day2: シーン静止画 ${shotsByPhase("scenes").length}枚(assets/movie/ep0/refs/ の正本を毎回添付)
  cuts    Day4: 優先動画カット ${shotsByPhase("cuts").length}本(assets/movie/ep0/stills/ の採用画像を起点)

FAL_KEY 未設定時は DRY-RUN(コストゼロ)。詳細: docs/emotional_movie_ep0_prompts.md`);
}

if (!step || step === "--help" || step === "-h") {
  usage();
  process.exit(step ? 0 : 1);
}

if (step === "list") {
  for (const phase of ["refs", "scenes", "cuts"] as Phase[]) {
    console.log(`\n[${phase}]`);
    for (const s of shotsByPhase(phase)) {
      const extra = s.sourceStill ? ` (起点: ${s.sourceStill}, ${s.durationSec}s)` : "";
      console.log(`  ${s.id.padEnd(4)} ${s.title}${extra}`);
    }
  }
  process.exit(0);
}

if (!["refs", "scenes", "cuts"].includes(step)) {
  console.error(`不明なステップ: "${step}"(refs / scenes / cuts / list)`);
  process.exit(1);
}

function flagValue(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const takes = Math.min(Math.max(Number(flagValue("--takes") ?? 2) || 2, 1), 3);
const only = flagValue("--only")?.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

let shots = shotsByPhase(step as Phase);
if (only && only.length > 0) {
  shots = shots.filter(s => only.includes(s.id.toLowerCase()));
  const missing = only.filter(id => !SHOTS.some(s => s.id.toLowerCase() === id));
  if (missing.length > 0) {
    console.error(`不明なショットID: ${missing.join(", ")}(npm run movie -- list で確認)`);
    process.exit(1);
  }
}
if (shots.length === 0) {
  console.error(`ステップ ${step} に該当するショットがありません`);
  process.exit(1);
}

async function findFile(dir: string, baseName: string): Promise<string | undefined> {
  for (const ext of IMAGE_EXTS) {
    const p = join(dir, `${baseName}${ext}`);
    try {
      const s = await stat(p);
      if (s.isFile()) return p;
    } catch { /* not found */ }
  }
  return undefined;
}

async function listImages(dir: string): Promise<string[]> {
  try {
    const names = await readdir(dir);
    return names
      .filter(n => IMAGE_EXTS.includes(n.slice(n.lastIndexOf(".")).toLowerCase()))
      .sort()
      .map(n => join(dir, n));
  } catch {
    return [];
  }
}

const basePhoto = await findFile(ASSET_DIR, "base");
const refImages = await listImages(REFS_DIR);

/** このショットに添付する参照画像パス群を決める */
async function refsForShot(shot: Shot): Promise<string[]> {
  const attach: string[] = [];
  if (shot.phase === "refs") {
    // 正本づくり: [GYM] を含むショット(夜の全景)にだけ基準写真を添付
    if (basePhoto && shot.template.includes("[GYM]")) attach.push(basePhoto);
  } else if (shot.phase === "scenes") {
    if (basePhoto && shot.template.includes("[GYM]")) attach.push(basePhoto);
    attach.push(...refImages);
  }
  return attach.slice(0, MAX_REFS);
}

interface Job {
  label: string;
  shot: Shot;
  prompt: string;
  attach: string[];
  sourcePath?: string; // cuts のみ
}

const jobs: Job[] = [];
const warnings: string[] = [];

for (const shot of shots) {
  const prompt = buildShotPrompt(shot);
  if (shot.phase === "cuts") {
    const src = shot.sourceStill ? await findFile(STILLS_DIR, shot.sourceStill) : undefined;
    if (!src) {
      warnings.push(
        `${shot.id}: 起点の静止画 assets/movie/ep0/stills/${shot.sourceStill}.png がありません。` +
        `scenes で生成した採用画像をこの名前で保存してください。`
      );
    }
    for (let t = 1; t <= takes; t++) {
      jobs.push({
        label: takes > 1 ? `${shot.id}-t${t}` : shot.id,
        shot,
        prompt,
        attach: [],
        sourcePath: src,
      });
    }
  } else {
    const attach = await refsForShot(shot);
    for (let t = 1; t <= takes; t++) {
      jobs.push({ label: takes > 1 ? `${shot.id}-t${t}` : shot.id, shot, prompt, attach });
    }
  }
}

if (step === "scenes" && refImages.length === 0) {
  warnings.push(
    "assets/movie/ep0/refs/ に正本画像がありません。キャラの一貫性が大きく落ちます。" +
    "先に `npm run movie -- refs` で正本を作り、採用画像を refs/ に保存してください。"
  );
}
if (!basePhoto) {
  warnings.push("assets/movie/ep0/base.jpg(ジムの基準写真)がありません。ジム内装は想像で生成されます。");
}

for (const w of warnings) console.warn(`[warn] ${w}`);
if (warnings.length > 0) console.warn("");

// ---- DRY-RUN ----
if (!process.env.FAL_KEY) {
  console.log(`[DRY-RUN] FAL_KEY が未設定のため、生成はスキップしました(コストゼロ)。\n`);
  console.log(`ステップ: ${step} / ${jobs.length}件のプレビュー\n`);
  for (const job of jobs) {
    console.log(`--- ${job.label}: ${job.shot.title} ---`);
    if (job.shot.phase === "cuts") {
      console.log(`起点画像: ${job.sourcePath ?? `(未配置: stills/${job.shot.sourceStill})`}`);
      console.log(`尺: ${job.shot.durationSec}s / エンドポイント: ${i2vEndpoint()}`);
    } else {
      console.log(`添付: ${job.attach.length > 0 ? job.attach.join(", ") : "(なし)"}`);
      console.log(`エンドポイント: ${imageEndpoint(job.attach.length > 0)}`);
    }
    console.log(`Prompt: ${job.prompt}\n`);
  }
  console.log(`本番実行: .env に FAL_KEY=... を追加(取得: https://fal.ai/dashboard/keys)`);
  process.exit(0);
}

// ---- 本番生成(直列) ----
try {
  assertValidFalKey();
} catch (err) {
  console.error(`[error] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const outDir = join(process.cwd(), "output", "movie", "ep0", date);
await mkdir(outDir, { recursive: true });

console.log(`ステップ: ${step} / ${jobs.length}件を生成します`);
console.log(`保存先: ${outDir}\n`);

const manifest: string[] = [
  `# 閉館後のFLATUP 第0話 — ${step} — ${date}`,
  ``,
  `- 採用基準: 怖くない / ギョロ目でない / 既存キャラに似ていない / キャラの色・形が正本と一致`,
  `- 採用した正本は assets/movie/ep0/refs/ へ、採用した静止画は assets/movie/ep0/stills/<ID>.png へ保存`,
  ``,
];
let ok = 0;
let failed = 0;

for (const job of jobs) {
  const started = Date.now();
  process.stdout.write(`[${job.label}] 生成中...`);
  try {
    let file: string;
    if (job.shot.phase === "cuts") {
      if (!job.sourcePath) throw new Error(`起点画像がありません: stills/${job.shot.sourceStill}`);
      const payload = await submitAndWait(i2vEndpoint(), {
        prompt: job.prompt,
        image_url: await toDataUri(job.sourcePath),
        resolution: process.env.SEEDANCE_RESOLUTION ?? "720p",
        duration: String(job.shot.durationSec ?? 4),
      });
      file = join(outDir, `${job.label}.mp4`);
      await download(extractVideoUrl(payload), file);
    } else {
      const withRefs = job.attach.length > 0;
      const body: Record<string, unknown> = {
        prompt: job.prompt,
        num_images: 1,
        aspect_ratio: "9:16",
      };
      if (withRefs) {
        body.image_urls = await Promise.all(job.attach.map(p => toDataUri(p)));
      }
      const payload = await submitAndWait(imageEndpoint(withRefs), body);
      file = join(outDir, `${job.label}.png`);
      await download(extractImageUrls(payload)[0], file);
    }
    const sec = Math.round((Date.now() - started) / 1000);
    console.log(` 完了 (${sec}s) → ${file}`);
    manifest.push(`## ${job.label} — ${job.shot.title}`, ``, `- ファイル: ${file.split("/").pop()}`, `- プロンプト: ${job.prompt}`, ``);
    ok++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(` 失敗: ${msg}`);
    manifest.push(`## ${job.label} — ${job.shot.title}`, ``, `- 失敗: ${msg}`, ``);
    failed++;
  }
}

const manifestPath = join(outDir, "manifest.md");
await writeFile(manifestPath, manifest.join("\n"));
console.log(`\n完了: 成功 ${ok} / 失敗 ${failed}`);
console.log(`マニフェスト: ${manifestPath}`);
if (failed > 0) process.exit(1);
