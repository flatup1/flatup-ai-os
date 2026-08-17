/**
 * fal.ai 動画量産レーン — 1場面を何本もまとめて作る。
 *
 *   npm run reel:batch -- --scene first_punch --count 12
 *   npm run reel:batch -- --scene first_punch --count 12 --image assets/reel_inputs/character/apu_front.png
 *   npm run reel:batch -- --scene first_punch --retry-failed 2026-08-05_first_punch
 *   npm run reel:batch -- --export-prompts     # prompts/reels/*.md のひな形を書き出す
 *
 * 作るもの（1回の実行 = 1フォルダ）:
 *   output/reels/YYYY-MM-DD_<場面>/
 *     all/001.mp4 … 012.mp4     ぜんぶ
 *     keep/  post/  ng/         人が仕分けして入れる（空で作る）
 *     manifest.csv              1本1行。judge(A/B/C) と memo を人が書き込む
 *     check.md                  合否チェック表
 *
 * 複数場面をまとめて回すときは `npm run factory` を使う。
 * 出力はすべて下書き。投稿・広告出稿は人間（JIN）の確認後。
 */

import "../utils/loadEnv.js";
import { mkdir, writeFile, readFile, rename, access } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { SCENES, resolveScene } from "./scenes.js";
import { loadScenePrompt, exportPrompts, promptsDir } from "./prompts.js";
import { checkBudget, costPerClipUsd } from "./plan.js";
import { appendLedger, ledgerPath } from "./ledger.js";
import { toCsv, parseCsv, type ManifestRow } from "./manifestCsv.js";
import {
  generateVideo,
  downloadVideo,
  seedanceEndpoint,
  requiredKeyName,
  hasApiKey,
  assertValidApiKey,
  FalBalanceError,
} from "../reel/seedance.js";

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const val = (f: string): string | undefined => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

if (has("--help") || has("-h") || args.length === 0) {
  const max = Math.max(...SCENES.map(s => s.key.length));
  console.log(`fal.ai 動画量産レーン — 1場面をまとめて作る

Usage:
  npm run reel:batch -- --scene <場面> --count <本数> [options]

Options:
  --scene KEY        作る場面（必須）
  --count N          本数（既定 12）
  --image PATH       基準画像。**毎回同じ画像**を使うとキャラがブレない
  --seconds N        尺（既定 6）
  --seed-base N      seedの起点（既定 1000）
  --tier fast|standard|pro   使うモデルの層（既定 standard / .env で設定）
  --budget USD       想定コストの上限。超えるなら1本も作らずに止まる
  --retry-failed DIR 既存フォルダの失敗ぶんだけ作り直す
  --export-prompts   prompts/reels/*.md のひな形を書き出す（--force で上書き）

Scenes:
${SCENES.map(s => `  ${s.key.padEnd(max)}  ${s.jp}`).join("\n")}

最初の一歩:
  npm run reel:batch -- --export-prompts
  npm run reel:batch -- --scene first_punch --count 12 --image assets/reel_inputs/character/apu_front.png

${requiredKeyName()} 未設定なら DRY-RUN（プロンプト表示のみ・コストゼロ）。`);
  process.exit(has("--help") || has("-h") ? 0 : 1);
}

// --- プロンプトのひな形を書き出すだけ ---
if (has("--export-prompts")) {
  const { written, skipped } = await exportPrompts(SCENES, { force: has("--force") });
  console.log(`プロンプト置き場: ${promptsDir()}`);
  for (const p of written) console.log(`  書き出し: ${basename(p)}`);
  for (const p of skipped) console.log(`  既にあるので飛ばす: ${basename(p)}（上書きは --force）`);
  console.log(`\nこのmdを直すと、次の生成からその内容が使われます。`);
  process.exit(0);
}

// --- 場面 ---
const sceneKey = val("--scene");
if (!sceneKey) {
  console.error("[error] --scene を指定してください（例: --scene first_punch）");
  process.exit(1);
}
const scene = resolveScene(sceneKey);
if (!scene) {
  console.error(`[error] 場面が見つかりません: ${sceneKey}`);
  console.error(`利用可能: ${SCENES.map(s => s.key).join(" / ")}`);
  process.exit(1);
}

const count = Math.min(Math.max(Number(val("--count") ?? 12) || 12, 1), 50);
const seconds = Math.min(Math.max(Number(val("--seconds") ?? 6) || 6, 1), 15);
const seedBase = Number(val("--seed-base") ?? 1000) || 1000;
const budgetUsd = val("--budget") ? Number(val("--budget")) : undefined;
const imageArg = val("--image");
const retryDir = val("--retry-failed");
const date = new Date().toISOString().slice(0, 10);

/**
 * モデルの層。試し打ちは安く、投稿候補は標準、広告は高品質。
 * 実際のモデル名は .env に置く（fal側のモデル追加・改名に追従できるように）。
 */
function modelForTier(tier: string): string {
  const env = {
    fast: process.env.FAL_VIDEO_MODEL_FAST,
    standard: process.env.FAL_VIDEO_MODEL_STANDARD ?? process.env.FAL_VIDEO_MODEL,
    pro: process.env.FAL_VIDEO_MODEL_PRO,
  }[tier];
  return env ?? seedanceEndpoint();
}
const tier = (val("--tier") ?? "standard").toLowerCase();
if (!["fast", "standard", "pro"].includes(tier)) {
  console.error(`[error] --tier は fast / standard / pro のどれかです: ${tier}`);
  process.exit(1);
}
const model = modelForTier(tier);

if (imageArg && /text-to-video/.test(model)) {
  console.error(
    `[error] --image を使うには画像→動画のモデルを指定してください（今: ${model}）\n` +
      `  .env に FAL_VIDEO_MODEL_STANDARD=<falのimage-to-videoモデル> を追加してください`
  );
  process.exit(1);
}

// --- 出力フォルダ ---
const runDirName = retryDir ? basename(retryDir) : `${date}_${scene.key}`;
const runDir = join(process.cwd(), "output", "reels", runDirName);
const allDir = join(runDir, "all");
const manifestPath = join(runDir, "manifest.csv");

/** 001, 002, … */
const pad = (n: number) => String(n).padStart(3, "0");

interface BatchJob {
  id: string;
  seed: number;
  file: string;
}

// --- 作るぶんを決める（新規 or 失敗ぶんの作り直し） ---
let jobs: BatchJob[];
let existingRows: ManifestRow[] = [];

if (retryDir) {
  const csv = await readFile(manifestPath, "utf8").catch(() => undefined);
  if (csv === undefined) {
    console.error(`[error] manifest.csv が見つかりません: ${manifestPath}`);
    process.exit(1);
  }
  existingRows = parseCsv(csv);
  const failed = existingRows.filter(r => r.status !== "ok");
  if (failed.length === 0) {
    console.log("失敗した本はありません。作り直すものがありません。");
    process.exit(0);
  }
  jobs = failed.map(r => ({
    id: r.id,
    seed: Number(r.seed) || seedBase,
    file: join(allDir, `${r.id}.mp4`),
  }));
  console.log(`作り直し: ${runDirName} の失敗 ${failed.length}本`);
} else {
  jobs = Array.from({ length: count }, (_, i) => ({
    id: pad(i + 1),
    seed: seedBase + i,
    file: join(allDir, `${pad(i + 1)}.mp4`),
  }));
  // 途中で止まっていた場合、出来ているぶんは飛ばす
  const done: BatchJob[] = [];
  for (const j of jobs) {
    if (await access(j.file).then(() => true, () => false)) done.push(j);
  }
  if (done.length > 0) {
    console.log(`${done.length}本は生成済みなので飛ばします（作り直すなら --force）`);
    if (!has("--force")) jobs = jobs.filter(j => !done.includes(j));
  }
}

// --- プロンプト（prompts/reels/*.md 優先） ---
const { prompt, sourceFile } = await loadScenePrompt(scene, seconds);

console.log(`場面   : ${scene.key}（${scene.jp}）`);
console.log(`本数   : ${jobs.length}本 / ${seconds}秒 / 9:16`);
console.log(`モデル : ${model}（tier: ${tier}）`);
console.log(`画像   : ${imageArg ?? "なし（Text-to-Video）"}`);
console.log(`文章   : ${sourceFile}`);

const budget = checkBudget(jobs.length, budgetUsd);
console.log(`見積   : ${budget.message}`);
if (!budget.ok) {
  console.error(`\n[stop] 予算を超えるため、1本も生成しませんでした。`);
  process.exit(1);
}

// --- DRY-RUN ---
if (!hasApiKey()) {
  console.log(`\n[DRY-RUN] ${requiredKeyName()} が未設定のため、生成はしません（コストゼロ）\n`);
  console.log(prompt);
  console.log(`\nキャプション下書き: ${scene.captionJa}`);
  console.log(`\n本番実行: .env に FAL_KEY=... を追加（https://fal.ai/dashboard/keys）`);
  process.exit(0);
}

try {
  assertValidApiKey();
} catch (err) {
  console.error(`[error] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

// --- 基準画像 ---
async function resolveImageUrl(arg: string | undefined): Promise<string | undefined> {
  if (!arg) return undefined;
  if (/^https?:\/\//.test(arg)) return arg;
  const mime = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" }[
    extname(arg).toLowerCase()
  ];
  if (!mime) {
    console.error(`[error] --image は URL か png/jpg/webp を指定してください: ${arg}`);
    process.exit(1);
  }
  const buf = await readFile(arg).catch(() => {
    console.error(`[error] 画像が読めません: ${arg}`);
    process.exit(1);
  });
  return `data:${mime};base64,${(buf as Buffer).toString("base64")}`;
}
const imageUrl = await resolveImageUrl(imageArg);

for (const dir of [allDir, join(runDir, "keep"), join(runDir, "post"), join(runDir, "ng")]) {
  await mkdir(dir, { recursive: true });
}
console.log(`保存先 : ${runDir}\n`);

// --- 生成 ---
const rows = new Map<string, ManifestRow>();
for (const r of existingRows) rows.set(r.id, r);

function upsert(id: string, patch: Partial<ManifestRow>): void {
  const base: ManifestRow = rows.get(id) ?? {
    id,
    scene: scene!.key,
    image: imageArg ? basename(imageArg) : "",
    prompt: sourceFile,
    model,
    seed: "",
    status: "",
    file: "",
    judge: "",
    memo: "",
  };
  rows.set(id, { ...base, ...patch });
}

async function saveManifest(): Promise<void> {
  const sorted = [...rows.values()].sort((a, b) => a.id.localeCompare(b.id));
  await writeFile(manifestPath, toCsv(sorted), "utf8");
}

let ok = 0;
let failed = 0;

for (const job of jobs) {
  const started = Date.now();
  process.stdout.write(`[${job.id}] 生成中...`);
  try {
    const result = await generateVideo(prompt, {
      seed: job.seed,
      imageUrl,
      aspectRatio: "9:16",
      duration: String(seconds),
    });
    await downloadVideo(result.videoUrl, job.file);
    const ms = Date.now() - started;
    console.log(` 完了 (${Math.round(ms / 1000)}s)`);
    ok++;
    upsert(job.id, { seed: String(job.seed), status: "ok", file: `all/${job.id}.mp4` });
    await appendLedger({
      ts: new Date().toISOString(),
      backend: "fal",
      model,
      scene: scene.key,
      seed: job.seed,
      label: `${runDirName}/${job.id}`,
      status: "ok",
      file: job.file,
      duration_ms: ms,
      est_cost_usd: costPerClipUsd(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(` 失敗: ${msg}`);
    failed++;
    upsert(job.id, { seed: String(job.seed), status: "failed", memo: msg.slice(0, 120) });
    await appendLedger({
      ts: new Date().toISOString(),
      backend: "fal",
      model,
      scene: scene.key,
      seed: job.seed,
      label: `${runDirName}/${job.id}`,
      status: "failed",
      duration_ms: Date.now() - started,
      error: msg.slice(0, 300),
    });
    if (err instanceof FalBalanceError) {
      console.error(`\n[stop] 残高切れのため中断しました。チャージ後に --retry-failed で再開できます。`);
      break;
    }
  }
  // 1本ごとに保存する（途中で落ちても記録が残る）
  await saveManifest();
}

// --- 合否チェック表 ---
const check = [
  `# 合否チェック — ${scene.jp}（${runDirName}）`,
  ``,
  `動画を見て、\`manifest.csv\` の **judge** 欄に A / B / C を書く。`,
  ``,
  `- **A**: そのまま投稿候補 → \`post/\` に移す`,
  `- **B**: 少し編集すれば使える → \`keep/\` に移す`,
  `- **C**: ボツ → \`ng/\` に移す`,
  ``,
  `## 9項目（全部○ならA）`,
  ``,
  `- [ ] キャラがかわいい`,
  `- [ ] 顔が崩れていない`,
  `- [ ] 手足が変ではない`,
  `- [ ] 怖くない`,
  `- [ ] 暴力的じゃない`,
  `- [ ] FLATUPらしい`,
  `- [ ] 保護者が見ても安心`,
  `- [ ] 6秒で意味が伝わる`,
  `- [ ] SNSに出せる`,
  ``,
  `## 仕上げ（投稿前）`,
  ``,
  `1. CapCut で 音量調整 → テロップ → ロゴ → LINE誘導`,
  `2. **文字は動画内でAIに書かせない**（崩れるため、必ず編集で足す）`,
  `3. 料金・時間・クラス名を入れるときは canon と一致しているか確認`,
  `4. 最終確認は JIN。ここまでは全部下書き`,
  ``,
  `## この回の設定`,
  ``,
  `- 場面: ${scene.key}`,
  `- プロンプト: ${sourceFile}`,
  `- 基準画像: ${imageArg ?? "なし"}`,
  `- モデル: ${model}（tier: ${tier}）`,
  `- seed: ${seedBase} から連番（当たりのseedは控えておく）`,
  ``,
];
await writeFile(join(runDir, "check.md"), check.join("\n"), "utf8");
await saveManifest();

console.log(`\n完了: 成功 ${ok} / 失敗 ${failed}`);
console.log(`フォルダ  : ${runDir}`);
console.log(`manifest  : ${manifestPath}`);
console.log(`チェック表: ${join(runDir, "check.md")}`);
console.log(`台帳      : ${ledgerPath()}`);
if (failed > 0) {
  console.log(`\n失敗ぶんだけ作り直す:`);
  console.log(`  npm run reel:batch -- --scene ${scene.key} --retry-failed ${runDirName}`);
}
console.log(`\n次: A評価のものを post/ に移して、投稿文を下書きする`);
console.log(`  npm run dev -- sns_post "${scene.captionJa}"`);
if (ok === 0 && failed > 0) process.exit(1);
