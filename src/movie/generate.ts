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
import { writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import {
  SHOTS,
  shotsByPhase,
  buildShotPrompt,
  REF_PHOTO_CLAUSE,
  CHAR_REFS_CLAUSE,
  charactersIn,
  hasHuman,
  refSheetsFor,
  MAX_ATTACH,
  type Phase,
  type Shot,
} from "./promptBank.js";
import {
  PLANS, findPlan, toEditSheet, toSrt, composeClauses, type EditPlan,
} from "./editPlan.js";
import {
  submitAndWait,
  extractImageUrls,
  extractVideoUrl,
  toDataUri,
  download,
  imageEndpoint,
  i2vEndpoint,
} from "./falClient.js";
import { assertValidApiKey, hasApiKey, requiredKeyName } from "../reel/seedance.js";

const ASSET_DIR = join(process.cwd(), "assets", "movie", "ep0");
const REFS_DIR = join(ASSET_DIR, "refs");
const STILLS_DIR = join(ASSET_DIR, "stills");
const CANON_DIR = join(process.cwd(), "assets", "canon");
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp"];


/**
 * refs(設定画)づくりで「絵柄だけ」を借りる canon 画像。
 * canon 全部ではなく、この4枚だけを使う理由:
 * - melty_stance / melty_sparring_bagroom … 腕脚にタトゥーが写る(再現禁止・assets/canon/README.md)
 * - tools_night_concept … 瞳が西洋カートゥーン調で不採用(JIN確定 2026-07-29)
 * - gym_bag_area … ジムB。第0話の舞台はジムA
 */
const STYLE_REF_NAMES = [
  "masaki_face_closeup",
  "melty_face_closeup",
  "masaki_class_lineup",
  "masaki_mitt_kneeling",
];

/** 絵柄参照の共通部分 */
const STYLE_REF_BASE =
  "The attached images define the art style: match their rendering quality, " +
  "eye style, cheek blush, softness and lighting exactly.";

/** 道具だけのショット用。人物を描かせないことを必ず明示する */
const STYLE_REF_CLAUSE =
  `${STYLE_REF_BASE} Do not copy their subjects, poses or backgrounds, and do not ` +
  "draw any people, faces or human characters in this image.";

/**
 * オリジナルの人間（ツム・母）を描くショット用。
 * 参照に写っているのは実在のスタッフなので、顔を写し取らせない。
 */
const STYLE_REF_HUMAN_CLAUSE =
  `${STYLE_REF_BASE} Do not copy the faces or identities of the people in them — ` +
  "the character in this image is a different, original character.";

/**
 * マサキを描くショット用。canon はマサキ本人の確定素材なので、
 * 絵柄だけでなく人物そのものを合わせる。
 */
const STYLE_REF_COACH_CLAUSE =
  `${STYLE_REF_BASE} The young male instructor in the attached references is MASAKI ` +
  "himself: keep his hair, face and build consistent with them.";

const args = process.argv.slice(2);
const positional = args.filter(a => !a.startsWith("--"));
const step = (positional[0] ?? "").toLowerCase();

function usage(): void {
  console.log(`閉館後のFLATUP 第0話 素材生成 (fal.ai)

Mac ならダブルクリックで全部できます → scripts/movie.command

Usage:
  npm run movie -- list
  npm run movie -- edl [--plan ep0-15s]
  npm run movie -- <refs|scenes|cuts> [--takes N] [--only ID1,ID2]
  npm run movie:adopt -- <refs|scenes>        採用した画像を登録する

Steps(既定は各2テイク):
  refs    Day1: 設定画 ${shotsByPhase("refs").length}種 → ${shotsByPhase("refs").length * 2}枚
  scenes  Day2: シーン静止画 ${shotsByPhase("scenes").length}種 → ${shotsByPhase("scenes").length * 2}枚(refs/ の採用画像を毎回添付)
  cuts    Day4: 動画カット ${shotsByPhase("cuts").length}種 → ${shotsByPhase("cuts").length * 2}本(stills/ の採用画像が起点)
  edl     Day3: 編集台本と字幕(.srt)を書き出す(API不要・いつでも実行できる)

流れ: refs → adopt refs → scenes → adopt scenes → edl → cuts

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

function flagValue(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

// 編集台本の書き出し。生成APIを使わないので、FAL_KEY もネットワークも要らない。
if (step === "edl") {
  const wanted = flagValue("--plan");
  const plans = wanted ? [findPlan(wanted)] : PLANS;
  if (plans.some(p => !p)) {
    console.error(`不明なプラン: "${wanted}"(${PLANS.map(p => p.id).join(" / ")})`);
    process.exit(1);
  }
  const outDir = join(process.cwd(), "output", "movie", "ep0", "edit");
  await mkdir(outDir, { recursive: true });
  for (const plan of plans as EditPlan[]) {
    const sheet = join(outDir, `${plan.id}.md`);
    const srt = join(outDir, `${plan.id}.srt`);
    await writeFile(sheet, toEditSheet(plan) + "\n", "utf8");
    await writeFile(srt, toSrt(plan), "utf8");
    console.log(toEditSheet(plan));
    console.log(`\n→ 編集台本: ${sheet}`);
    console.log(`→ 字幕(CapCutに読み込む): ${srt}\n`);
  }
  process.exit(0);
}

if (!["refs", "scenes", "cuts"].includes(step)) {
  console.error(`不明なステップ: "${step}"(refs / scenes / cuts / list / edl)`);
  process.exit(1);
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

/** 採用画像のファイル名から、元の設定画IDを取り出す（"M2a-t1.png" → "M2a"） */
function refSheetId(filePath: string): string {
  return basename(filePath).replace(/\.[^.]+$/, "").replace(/-t\d+$/, "");
}

/** assets/canon/ から絵柄参照だけを拾う(存在するものだけ・並び順は STYLE_REF_NAMES どおり) */
async function listStyleRefs(): Promise<string[]> {
  const found: string[] = [];
  for (const name of STYLE_REF_NAMES) {
    const p = await findFile(CANON_DIR, name);
    if (p) found.push(p);
  }
  return found;
}

const basePhoto = await findFile(ASSET_DIR, "base");
const refImages = await listImages(REFS_DIR);
const styleRefs = await listStyleRefs();

/** このショットに添付する参照画像と、それに対応する追記文を決める */
async function refsForShot(shot: Shot): Promise<{ attach: string[]; clauses: string[] }> {
  const attach: string[] = [];
  const clauses: string[] = [];
  if (basePhoto && shot.phase !== "cuts" && shot.template.includes("[GYM]")) {
    attach.push(basePhoto);
    clauses.push(REF_PHOTO_CLAUSE);
  }
  if (shot.phase === "refs") {
    // 正本づくりの段階ではまだ採用済みキャラ画像が無いので、絵柄だけを canon から借りる。
    // 人が出るかどうかで注意書きを変える(人物設定画に「人を描くな」と言うと壊れる)。
    if (styleRefs.length) {
      attach.push(...styleRefs);
      const chars = charactersIn(shot);
      if (chars.includes("COACH")) clauses.push(STYLE_REF_COACH_CLAUSE);
      else if (hasHuman(shot)) clauses.push(STYLE_REF_HUMAN_CLAUSE);
      else clauses.push(STYLE_REF_CLAUSE);
    }
  } else if (shot.phase === "scenes") {
    // そのシーンに出るキャラの設定画だけを添付する。
    // 全部添付すると、母の顔アップにグローブの設定画が付くような濁りが出る。
    // 並びは refSheetsFor の順（キャラごとに1枚ずつ）を守る。
    // ファイル名の五十音順で拾うと、上限で切ったときに人間の参照が全部落ちる。
    const picked = refSheetsFor(shot).flatMap(id => refImages.filter(p => refSheetId(p) === id));
    if (picked.length) {
      attach.push(...picked);
      clauses.push(CHAR_REFS_CLAUSE);
    }
  }
  const capped = attach.slice(0, MAX_ATTACH);
  if (capped.length < attach.length) {
    warnings.push(
      `${shot.id}: 参照画像が ${attach.length} 枚あり、上限 ${MAX_ATTACH} 枚に切り詰めました。` +
      `\n        落ちた分: ${attach.slice(MAX_ATTACH).map(p => basename(p)).join(", ")}`
    );
  }
  return { attach: capped, clauses };
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
  let prompt = buildShotPrompt(shot);
  if (shot.phase === "cuts") {
    const src = shot.sourceStill ? await findFile(STILLS_DIR, shot.sourceStill) : undefined;
    if (!src) {
      warnings.push(
        `${shot.id}: 起点の静止画 assets/movie/ep0/stills/${shot.sourceStill}.png がありません。` +
        `\n        \`npm run movie:adopt -- scenes\` で採用すると、この名前で保存されます。`
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
    // シーン静止画は「編集でどう使われるか」で必要な構図が変わる（editPlan が正本）
    if (shot.phase === "scenes") {
      for (const clause of composeClauses(shot.id)) prompt += ` ${clause}`;
    }
    // 実際に添付する画像がある場合だけ、参照指示をプロンプトへ追記する
    const { attach, clauses } = await refsForShot(shot);
    for (const clause of clauses) prompt += ` ${clause}`;
    for (let t = 1; t <= takes; t++) {
      jobs.push({ label: takes > 1 ? `${shot.id}-t${t}` : shot.id, shot, prompt, attach });
    }
  }
}

if (step === "scenes" && refImages.length === 0) {
  warnings.push(
    "assets/movie/ep0/refs/ に正本画像がありません。キャラの一貫性が大きく落ちます。\n" +
    "        先に `npm run movie -- refs` で設定画を作り、" +
    "`npm run movie:adopt -- refs` で採用してください。"
  );
}
// ジムの基準写真は [GYM] を含む静止画にしか使わない。cuts の実行時に出しても意味がない。
if (!basePhoto && jobs.some(j => j.shot.phase !== "cuts" && j.shot.template.includes("[GYM]"))) {
  warnings.push("assets/movie/ep0/base.jpg(ジムの基準写真)がありません。ジム内装は想像で生成されます。");
}

for (const w of warnings) console.warn(`[warn] ${w}`);
if (warnings.length > 0) console.warn("");

// ---- DRY-RUN ----
if (!hasApiKey()) {
  console.log(`[DRY-RUN] ${requiredKeyName()} が未設定のため、生成はスキップしました(コストゼロ)。\n`);
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
  console.log(`本番実行: .env に ${requiredKeyName()}=... を追加(取得: https://fal.ai/dashboard/keys)`);
  process.exit(0);
}

// ---- 本番生成(直列) ----
try {
  assertValidApiKey();
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

const manifestPath = join(outDir, "manifest.md");
const writeManifest = () => writeFile(manifestPath, manifest.join("\n"));

// 24枚の生成は数分かかる。途中で Ctrl+C を押しても、
// そこまでの「どのプロンプトがどの画像を作ったか」を必ず残す。
// 画像はダウンロード済みでも、対応表を失うと採用の判断ができなくなる。
// シグナルハンドラの中では同期処理だけを行う。
// 非同期にすると process.exit と競合して、書き込みも出力も落ちる。
let interrupted = false;
process.on("SIGINT", () => {
  if (interrupted) process.exit(130); // 2回目は即座に抜ける
  interrupted = true;
  writeFileSync(manifestPath, manifest.join("\n"));
  process.stderr.write(
    `\n\n中断しました。ここまで 成功 ${ok} / 失敗 ${failed}\n` +
    `途中までのマニフェスト: ${manifestPath}\n` +
    `生成済みの画像はそのまま残っています。\n`
  );
  process.exit(130);
});

for (const job of jobs) {
  if (interrupted) break;
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

await writeManifest();
console.log(`\n完了: 成功 ${ok} / 失敗 ${failed}`);
console.log(`マニフェスト: ${manifestPath}`);
if (failed > 0) process.exit(1);
