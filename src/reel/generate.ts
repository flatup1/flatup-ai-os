/**
 * 動物×格闘技リールの全自動生成 CLI。
 *
 * 使い方:
 *   npm run reel -- "にゃん術"                  # 3本生成(既定)
 *   npm run reel -- "キックドクシング" --count 5
 *   npm run reel -- "猫×柔術" --takes 2         # 各プロンプト2テイク(seed違い)
 *   npm run reel -- --list                      # シリーズ一覧
 *
 * FAL_KEY 未設定時は DRY-RUN(プロンプトとキャプションのプレビューのみ、コストゼロ)。
 * 生成物: output/reels/YYYY-MM-DD/<シリーズ>_<n>[-t<k>].mp4 + manifest.md(投稿用)
 */

import "../utils/loadEnv.js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SERIES, resolveSeries, buildPrompt, buildCaption, buildHashtags } from "./promptBank.js";
import {
  generateVideo,
  downloadVideo,
  seedanceEndpoint,
  seedanceProvider,
  isImageToVideo,
  requiredKeyName,
  hasApiKey,
  assertValidApiKey,
} from "./seedance.js";

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h" || args.includes("--list")) {
  const max = Math.max(...SERIES.map(s => s.name.length));
  console.log(`動物×格闘技リール 全自動生成 (Seedance 2.0 / fal.ai)

Usage:
  npm run reel -- "<シリーズ名 or 動物×競技>" [--count N] [--takes T] [--image <path|url>]

Series:
${SERIES.map(s => `  ${s.name.padEnd(max)}  ${s.combo}`).join("\n")}

例:
  npm run reel -- "にゃん術"
  npm run reel -- "キックドクシング" --count 5 --takes 2
  npm run reel -- "ニャクシング" --image ./NYANJUTSU_TSUMU_BASE_001.png   # image-to-video

--image は image-to-video モデル(FAL_VIDEO_MODEL=...image-to-video、例: Hailuo 2.3 Fast)で必須。
起点画像を1枚渡すと、全カットをその画像(=同じ主役)から生成します。
FAL_KEY 未設定時は DRY-RUN(プロンプトのプレビューのみ・コストゼロ)。`);
  process.exit(args.includes("--list") || args[0] === "--help" || args[0] === "-h" ? 0 : 1);
}

const flags = new Map<string, number>();
const strFlags = new Map<string, string>();
const positional: string[] = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--count" || a === "--takes") {
    const v = Number(args[++i]);
    if (Number.isInteger(v) && v > 0) flags.set(a, v);
  } else if (a === "--image") {
    const v = args[++i];
    if (v) strFlags.set(a, v);
  } else if (!a.startsWith("--")) {
    positional.push(a);
  }
}

const query = positional.join(" ");
const count = Math.min(flags.get("--count") ?? 3, 10);
const takes = Math.min(flags.get("--takes") ?? 1, 3);

// image-to-video(Hailuo 等)は起点画像が必須。http(s) は URL、それ以外はローカルパス扱い。
const i2v = isImageToVideo();
const imageArg = strFlags.get("--image");
const imageOpt = imageArg
  ? /^https?:\/\//.test(imageArg)
    ? { imageUrl: imageArg }
    : { imagePath: imageArg }
  : {};

const series = resolveSeries(query);
if (!series) {
  console.error(`シリーズが見つかりません: "${query}"`);
  console.error(`利用可能: ${SERIES.map(s => s.name).join(" / ")}`);
  console.error(`名鑑にない組み合わせは AIKA に相談 → npm run dev -- animal_reel "${query}"`);
  process.exit(1);
}

const hashtags = buildHashtags(series);
const jobs: Array<{ label: string; prompt: string; caption: string; seed?: number }> = [];
for (let i = 0; i < count; i++) {
  for (let t = 0; t < takes; t++) {
    jobs.push({
      label: takes > 1 ? `${series.name}_${i + 1}-t${t + 1}` : `${series.name}_${i + 1}`,
      prompt: buildPrompt(series, i),
      caption: buildCaption(series, i),
      seed: takes > 1 ? 1000 + i * 10 + t : undefined,
    });
  }
}

if (!hasApiKey()) {
  console.log(`[DRY-RUN] ${requiredKeyName()} が未設定のため、生成はスキップしました(コストゼロ)。\n`);
  console.log(`モデル: ${seedanceEndpoint()}（${i2v ? "image-to-video" : "text-to-video"}）`);
  if (i2v) {
    console.log(imageArg
      ? `起点画像: ${imageArg}`
      : `⚠ image-to-video では起点画像が必須です。本番実行前に --image <ファイル or URL> を付けてください。`);
  }
  console.log(`シリーズ: ${series.name}(${series.combo}) / ${jobs.length}本ぶんのプレビュー\n`);
  for (const job of jobs) {
    console.log(`--- ${job.label} ---`);
    console.log(`Prompt: ${job.prompt}`);
    console.log(`Caption: ${job.caption}`);
    console.log("");
  }
  console.log(`Hashtags: ${hashtags}`);
  const hint = seedanceProvider() === "byteplus"
    ? "本番実行: .env に ARK_API_KEY=... を追加(BytePlus ModelArk → API Key Management)"
    : "本番実行: .env に FAL_KEY=... を追加(取得: https://fal.ai/dashboard/keys)";
  console.log(`\n${hint}`);
  process.exit(0);
}

// --- 本番生成(直列。レート制限と失敗の切り分けのため) ---
try {
  assertValidApiKey();
} catch (err) {
  console.error(`[error] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

if (i2v && !imageArg) {
  console.error(`[error] ${seedanceEndpoint()} は image-to-video です。起点画像が必須です。`);
  console.error(`  例: npm run reel -- "${series.name}" --image ./NYANJUTSU_TSUMU_BASE_001.png`);
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const outDir = join(process.cwd(), "output", "reels", date);
await mkdir(outDir, { recursive: true });

console.log(`シリーズ: ${series.name}(${series.combo})`);
console.log(`プロバイダ: ${seedanceProvider()} / モデル: ${seedanceEndpoint()}（${i2v ? "image-to-video" : "text-to-video"}） / ${jobs.length}本を生成します`);
if (i2v) console.log(`起点画像: ${imageArg}`);
console.log(`保存先: ${outDir}\n`);

const manifest: string[] = [
  `# ${series.name} — ${date} 生成バッチ`,
  ``,
  `- モデル: ${seedanceEndpoint()}（${i2v ? "image-to-video" : "text-to-video"}）`,
  ...(i2v ? [`- 起点画像: ${imageArg}`] : []),
  `- 投稿前チェック: 人間が全カット確認 / InstagramのAI生成ラベルON / 動物が傷つく画になっていないか`,
  ``,
];
let ok = 0;
let failed = 0;

for (const job of jobs) {
  const started = Date.now();
  process.stdout.write(`[${job.label}] 生成中...`);
  try {
    const result = await generateVideo(job.prompt, { seed: job.seed, ...imageOpt });
    const file = join(outDir, `${job.label}.mp4`);
    await downloadVideo(result.videoUrl, file);
    const sec = Math.round((Date.now() - started) / 1000);
    console.log(` 完了 (${sec}s) → ${file}`);
    manifest.push(
      `## ${job.label}`,
      ``,
      `- ファイル: ${job.label}.mp4`,
      `- キャプション: ${job.caption}`,
      `- ハッシュタグ: ${hashtags}`,
      `- プロンプト: ${job.prompt}`,
      ``
    );
    ok++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(` 失敗: ${msg}`);
    manifest.push(`## ${job.label}`, ``, `- 失敗: ${msg}`, `- プロンプト: ${job.prompt}`, ``);
    failed++;
  }
}

const manifestPath = join(outDir, "manifest.md");
await writeFile(manifestPath, manifest.join("\n"));
console.log(`\n完了: 成功 ${ok} / 失敗 ${failed}`);
console.log(`投稿用マニフェスト: ${manifestPath}`);
if (failed > 0) process.exit(1);
