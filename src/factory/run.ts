/**
 * FLATUP 動画ファクトリー — 縦動画の量産ライン。
 *
 *   npm run factory -- --scenes jab,wave --takes 3 --image assets/characters/apu.png
 *   npm run factory -- --all --takes 2 --budget 5
 *   npm run factory -- --backend h3 --comfy-url https://xxxx.trycloudflare.com --scenes jab
 *   npm run factory -- --summary        # これまでの本数と使った金額
 *
 * 特徴（量産で事故らないための作り）:
 * - 実行前に本数と想定コストを出し、--budget を超えるなら1本も作らずに止まる
 * - 出来ているファイルは飛ばす（同じコマンドを打てば続きから再開）
 * - 1本ごとに台帳 logs/factory.jsonl へ追記（当たったseedを再利用できる）
 * - 残高切れは即中断（fal の balance エラーを検知）
 * - キー未設定なら DRY-RUN（全プロンプトを表示するだけ・コストゼロ）
 *
 * 出力はすべて**下書き**。投稿・広告出稿は人間（JIN）の確認後。
 */

import "../utils/loadEnv.js";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { join, extname } from "node:path";
import { SCENES, resolveScene, type Scene } from "./scenes.js";
import { planJobs, remainingJobs, checkBudget, costPerClipUsd, type Job } from "./plan.js";
import { appendLedger, readLedger, summarize, ledgerPath } from "./ledger.js";
import { generateViaH3 } from "./comfyH3.js";
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
const num = (f: string, dflt: number): number => {
  const v = Number(val(f));
  return Number.isFinite(v) && v > 0 ? v : dflt;
};

if (has("--help") || has("-h") || args.length === 0) {
  const max = Math.max(...SCENES.map(s => s.key.length));
  console.log(`FLATUP 動画ファクトリー — 縦動画(9:16)の量産ライン

Usage:
  npm run factory -- (--scenes a,b | --all) [options]

Options:
  --scenes a,b,c     作る場面（カンマ区切り）
  --all              全場面
  --takes N          1場面あたりのテイク数（seed違い / 既定 1）
  --seconds N        尺（既定 6）
  --image PATH|URL   基準画像。渡すと Image-to-Video（キャラが崩れにくい）
  --seed-base N      seedの起点（既定 1000）。同じ値なら同じ組み合わせを再現できる
  --budget USD       想定コストの上限。超えるなら1本も作らずに止まる
  --backend fal|h3   生成エンジン（既定 fal）
  --comfy-url URL    --backend h3 のときの ComfyUI のURL（Colabのcloudflared等）
  --out DIR          保存先（既定 output/factory/YYYY-MM-DD）
  --force            出来ているファイルも作り直す
  --summary          台帳の集計だけ表示して終わる

Scenes:
${SCENES.map(s => `  ${s.key.padEnd(max)}  ${s.jp}${s.source === "bible" ? "  [バイブル正本]" : ""}`).join("\n")}

例:
  npm run factory -- --scenes jab,wave --takes 3 --image assets/characters/apu.png
  npm run factory -- --all --takes 2 --budget 5

${requiredKeyName()} 未設定なら DRY-RUN（プロンプト表示のみ・コストゼロ）。`);
  process.exit(has("--help") || has("-h") ? 0 : 1);
}

// --- 台帳の集計だけ見る ---
if (has("--summary")) {
  const s = summarize(await readLedger());
  console.log(`台帳: ${ledgerPath()}`);
  console.log(`生成: ${s.total}本（成功 ${s.ok} / 失敗 ${s.failed}）`);
  console.log(`想定コスト合計: $${s.costUsd.toFixed(2)}（約${Math.round(s.costUsd * 155)}円）`);
  if (s.byScene.length > 0) {
    const w = Math.max(...s.byScene.map(r => r.scene.length));
    console.log(`\n場面別:`);
    for (const r of s.byScene.sort((a, b) => b.ok - a.ok)) {
      console.log(`  ${r.scene.padEnd(w)}  成功 ${r.ok} / 失敗 ${r.failed}`);
    }
  }
  process.exit(0);
}

// --- 場面を決める ---
let scenes: Scene[];
if (has("--all")) {
  scenes = SCENES;
} else {
  const raw = (val("--scenes") ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (raw.length === 0) {
    console.error("[error] --scenes か --all を指定してください（一覧: npm run factory -- --help）");
    process.exit(1);
  }
  scenes = [];
  for (const key of raw) {
    const scene = resolveScene(key);
    if (!scene) {
      console.error(`[error] 場面が見つかりません: ${key}`);
      console.error(`利用可能: ${SCENES.map(s => s.key).join(" / ")}`);
      process.exit(1);
    }
    scenes.push(scene);
  }
}

const backend = (val("--backend") ?? "fal").toLowerCase() === "h3" ? "h3" : "fal";
const comfyUrl = val("--comfy-url");
const takes = Math.min(num("--takes", 1), 10);
const seconds = Math.min(num("--seconds", 6), 15);
const seedBase = num("--seed-base", 1000);
const budgetUsd = val("--budget") ? Number(val("--budget")) : undefined;
const date = new Date().toISOString().slice(0, 10);
const outDir = val("--out") ?? join(process.cwd(), "output", "factory", date);
const imageArg = val("--image");

const jobs = planJobs({ scenes, takes, seconds, seedBase, outDir });

// すでに出来ているものを調べる（再開のため）
const existing = new Set<string>();
for (const j of jobs) {
  try {
    await access(j.file);
    existing.add(j.file);
  } catch {
    // まだ無い
  }
}
const todo = remainingJobs(jobs, existing, has("--force"));

console.log(`場面 ${scenes.length} × テイク ${takes} = ${jobs.length}本`);
if (existing.size > 0 && !has("--force")) {
  console.log(`うち ${existing.size}本 は生成済みなので飛ばします（作り直すなら --force）`);
}

// --- 予算ガード（実行前に止める） ---
const budget = checkBudget(todo.length, budgetUsd);
console.log(`見積: ${budget.message}`);
if (!budget.ok) {
  console.error(`\n[stop] 予算を超えるため、1本も生成しませんでした。`);
  process.exit(1);
}
if (todo.length === 0) {
  console.log("作るものがありません。");
  process.exit(0);
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

const model = backend === "h3" ? "MiniMax-H3 (ComfyUI)" : seedanceEndpoint();

// 基準画像を渡すのに text-to-video のモデルを向いていると、画像が黙って無視される
if (backend === "fal" && imageArg && /text-to-video/.test(model)) {
  console.error(
    `[error] --image を使うには画像→動画のモデルを指定してください（今: ${model}）\n` +
      `  .env に FAL_VIDEO_MODEL=<falのimage-to-videoモデル> を追加してから、もう一度実行してください`
  );
  process.exit(1);
}
const ready = backend === "h3" ? Boolean(comfyUrl) : hasApiKey();

// --- DRY-RUN ---
if (!ready) {
  const why = backend === "h3" ? "--comfy-url が未指定" : `${requiredKeyName()} が未設定`;
  console.log(`\n[DRY-RUN] ${why}のため、生成はしません（コストゼロ）\n`);
  console.log(`エンジン: ${model}`);
  console.log(`基準画像: ${imageArg ?? "なし（Text-to-Video）"}`);
  console.log(`保存先  : ${outDir}\n`);
  for (const j of todo) {
    console.log(`--- ${j.label}（${j.sceneJp}）---`);
    console.log(j.prompt);
    console.log(`キャプション下書き: ${j.captionJa}\n`);
  }
  console.log(
    backend === "h3"
      ? "本番実行: Colabのノート⑥で出たURLを --comfy-url に渡してください"
      : "本番実行: .env に FAL_KEY=... を追加（https://fal.ai/dashboard/keys）"
  );
  process.exit(0);
}

if (backend === "fal") {
  try {
    assertValidApiKey();
  } catch (err) {
    console.error(`[error] ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

await mkdir(outDir, { recursive: true });
console.log(`エンジン: ${model}`);
console.log(`保存先  : ${outDir}\n`);

const imageUrl = backend === "fal" ? await resolveImageUrl(imageArg) : undefined;
// H3側は ComfyUI の input フォルダに置いたファイル名で指定する
const h3ImageName = backend === "h3" ? val("--image") : undefined;

const done: Job[] = [];
const failed: Array<{ job: Job; error: string }> = [];

for (const job of todo) {
  const started = Date.now();
  process.stdout.write(`[${job.label}] 生成中...`);
  try {
    if (backend === "h3") {
      await generateViaH3(
        {
          comfyUrl: comfyUrl as string,
          prompt: job.prompt,
          seed: job.seed,
          seconds,
          imageName: h3ImageName,
          filenamePrefix: `video/${job.sceneKey}`,
        },
        job.file
      );
    } else {
      const result = await generateVideo(job.prompt, {
        seed: job.seed,
        imageUrl,
        aspectRatio: "9:16",
        duration: String(seconds),
      });
      await downloadVideo(result.videoUrl, job.file);
    }
    const ms = Date.now() - started;
    console.log(` 完了 (${Math.round(ms / 1000)}s)`);
    done.push(job);
    await appendLedger({
      ts: new Date().toISOString(),
      backend,
      model,
      scene: job.sceneKey,
      seed: job.seed,
      label: job.label,
      status: "ok",
      file: job.file,
      duration_ms: ms,
      est_cost_usd: backend === "fal" ? costPerClipUsd() : 0,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(` 失敗: ${msg}`);
    failed.push({ job, error: msg });
    await appendLedger({
      ts: new Date().toISOString(),
      backend,
      model,
      scene: job.sceneKey,
      seed: job.seed,
      label: job.label,
      status: "failed",
      duration_ms: Date.now() - started,
      error: msg.slice(0, 300),
    });
    // 残高切れは、以降を全部失敗させても意味がないので即中断する
    if (err instanceof FalBalanceError) {
      console.error(`\n[stop] 残高切れのため中断しました。チャージ後に同じコマンドで再開できます。`);
      break;
    }
  }
}

// --- 投稿用マニフェスト（人間の確認欄つき） ---
const manifest: string[] = [
  `# FLATUP 動画ファクトリー — ${date}`,
  ``,
  `- エンジン: ${model}`,
  `- 基準画像: ${imageArg ?? "なし（Text-to-Video）"}`,
  `- 成功 ${done.length} / 失敗 ${failed.length}`,
  ``,
  `## 投稿前チェック（人間が確認する）`,
  ``,
  `- [ ] キャラが崩れていない（顔・服・頭身）`,
  `- [ ] 怖くない / 暴力的でない / 痛がる表情が無い`,
  `- [ ] 実在の会員さんに似ていない`,
  `- [ ] 画面に文字・ロゴが写り込んでいない`,
  `- [ ] 9:16で見切れていない`,
  `- [ ] 音が不自然でない（不要なら消す）`,
  `- [ ] 料金・時間・クラス名を足すなら canon と一致している`,
  ``,
];
for (const job of done) {
  manifest.push(
    `## ${job.label}`,
    ``,
    `- 場面: ${job.sceneJp}`,
    `- ファイル: ${job.file}`,
    `- seed: ${job.seed}（当たりならこの数字を控える）`,
    `- キャプション下書き: ${job.captionJa}`,
    ``
  );
}
for (const f of failed) {
  manifest.push(`## ${f.job.label}（失敗）`, ``, `- ${f.error}`, ``);
}
const manifestPath = join(outDir, "manifest.md");
await writeFile(manifestPath, manifest.join("\n"));

console.log(`\n完了: 成功 ${done.length} / 失敗 ${failed.length}`);
console.log(`マニフェスト: ${manifestPath}`);
console.log(`台帳        : ${ledgerPath()}`);
console.log(`\n次: 良かった動画のキャプションを下書きする`);
console.log(`  npm run dev -- sns_post "<場面の説明>"`);
if (failed.length > 0) process.exit(1);
