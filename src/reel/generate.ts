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
import { generateVideo, downloadVideo, seedanceEndpoint, assertValidFalKey } from "./seedance.js";

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h" || args.includes("--list")) {
  const max = Math.max(...SERIES.map(s => s.name.length));
  console.log(`動物×格闘技リール 全自動生成 (Seedance 2.0 / fal.ai)

Usage:
  npm run reel -- "<シリーズ名 or 動物×競技>" [--count N] [--takes T]

Series:
${SERIES.map(s => `  ${s.name.padEnd(max)}  ${s.combo}`).join("\n")}

例:
  npm run reel -- "にゃん術"
  npm run reel -- "キックドクシング" --count 5 --takes 2

FAL_KEY 未設定時は DRY-RUN(プロンプトのプレビューのみ・コストゼロ)。`);
  process.exit(args.includes("--list") || args[0] === "--help" || args[0] === "-h" ? 0 : 1);
}

const flags = new Map<string, number>();
const positional: string[] = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--count" || a === "--takes") {
    const v = Number(args[++i]);
    if (Number.isInteger(v) && v > 0) flags.set(a, v);
  } else if (!a.startsWith("--")) {
    positional.push(a);
  }
}

const query = positional.join(" ");
const count = Math.min(flags.get("--count") ?? 3, 10);
const takes = Math.min(flags.get("--takes") ?? 1, 3);

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

if (!process.env.FAL_KEY) {
  console.log(`[DRY-RUN] FAL_KEY が未設定のため、生成はスキップしました(コストゼロ)。\n`);
  console.log(`シリーズ: ${series.name}(${series.combo}) / ${jobs.length}本ぶんのプレビュー\n`);
  for (const job of jobs) {
    console.log(`--- ${job.label} ---`);
    console.log(`Prompt: ${job.prompt}`);
    console.log(`Caption: ${job.caption}`);
    console.log("");
  }
  console.log(`Hashtags: ${hashtags}`);
  console.log(`\n本番実行: .env に FAL_KEY=... を追加(取得: https://fal.ai/dashboard/keys)`);
  process.exit(0);
}

// --- 本番生成(直列。レート制限と失敗の切り分けのため) ---
try {
  assertValidFalKey();
} catch (err) {
  console.error(`[error] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const outDir = join(process.cwd(), "output", "reels", date);
await mkdir(outDir, { recursive: true });

console.log(`シリーズ: ${series.name}(${series.combo})`);
console.log(`エンドポイント: ${seedanceEndpoint()} / ${jobs.length}本を生成します`);
console.log(`保存先: ${outDir}\n`);

const manifest: string[] = [
  `# ${series.name} — ${date} 生成バッチ`,
  ``,
  `- エンドポイント: ${seedanceEndpoint()}`,
  `- 投稿前チェック: 人間が全カット確認 / InstagramのAI生成ラベルON / 動物が傷つく画になっていないか`,
  ``,
];
let ok = 0;
let failed = 0;

for (const job of jobs) {
  const started = Date.now();
  process.stdout.write(`[${job.label}] 生成中...`);
  try {
    const result = await generateVideo(job.prompt, { seed: job.seed });
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
