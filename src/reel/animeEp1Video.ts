/**
 * FLATUP アニメ EP1 の「選んだ8枚の画像」を、カット別プロンプトで6秒動画(I2V)にする専用バッチ。
 *
 * これで「②動画にする」が1コマンドになる（reel は動物シリーズ専用なのでEP1には使えない）。
 *
 * 使い方（手元のMac/PCで）:
 *   1) EP1の各カットで採用した1枚を output/clips_src/ に置く。
 *      ★ 名前を cut1 / cut2 ... cut8 にする（拡張子は .png/.jpg/.webp どれでもOK）
 *      例: output/clips_src/cut1.png, cut2.png, ... cut8.png
 *   2) I2V用モデルを .env に設定（1回だけ）:
 *      FAL_VIDEO_MODEL=<Hailuo などの image-to-video モデル slug>
 *   3) npm run anime:ep1:video
 *      → output/clips/cut1.mp4 ... cut8.mp4 ができる（そのまま anime:ep1:stitch へ）
 *
 * FAL_KEY 未設定時は DRY-RUN（コストゼロ・どの画像を使うかとプロンプトを表示）。
 */

import "../utils/loadEnv.js";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { EP1_CUT_DEFS, videoPrompt } from "./animeEp1Cuts.js";
import {
  generateVideo,
  downloadVideo,
  seedanceEndpoint,
  requiredKeyName,
  hasApiKey,
  assertValidApiKey,
} from "./seedance.js";

/** EP1 8カットの Hailuo I2V プロンプト（正本は animeEp1Cuts.ts） */
export const EP1_CUTS: Array<{ n: number; prompt: string }> = EP1_CUT_DEFS.map(cut => ({
  n: cut.n,
  prompt: videoPrompt(cut),
}));

/** 一時的な失敗（fal混雑によるタイムアウト等）に備えた1カットあたりの試行回数 */
const MAX_ATTEMPTS = 2;

const SRC_DIR = join(process.cwd(), "output", "clips_src");
const OUT_DIR = join(process.cwd(), "output", "clips");
const IMG_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/** output/clips_src/ から cut<n>.* の画像を探す（拡張子は問わない） */
export async function findSourceImage(files: string[], n: number): Promise<string | undefined> {
  const match = files.find(f => {
    const base = f.toLowerCase();
    return (base === `cut${n}` || base.startsWith(`cut${n}.`)) && IMG_EXT[extname(f).toLowerCase()];
  });
  return match;
}

async function toDataUri(path: string): Promise<string> {
  const mime = IMG_EXT[extname(path).toLowerCase()];
  const buf = await readFile(path);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const isMain = process.argv[1]?.endsWith("animeEp1Video.ts") || process.argv[1]?.endsWith("animeEp1Video.js");

if (isMain) {
  let files: string[] = [];
  try {
    files = await readdir(SRC_DIR);
  } catch {
    console.error(`❌ フォルダがありません: ${SRC_DIR}`);
    console.error(`   採用した8枚を cut1.png ... cut8.png の名前で output/clips_src/ に置いてください。`);
    process.exit(1);
  }

  const plan = EP1_CUTS.map(c => ({ ...c, img: undefined as string | undefined }));
  for (const c of plan) {
    const found = await findSourceImage(files, c.n);
    c.img = found ? join(SRC_DIR, found) : undefined;
  }

  const ready = plan.filter(c => c.img);
  const missing = plan.filter(c => !c.img).map(c => `cut${c.n}`);

  console.log(`FLATUP アニメ EP1 — 画像 → 6秒動画（I2V）`);
  console.log(`ソース: ${SRC_DIR}`);
  console.log(`見つかった: ${ready.length}/8${missing.length ? ` / 未配置: ${missing.join(", ")}` : ""}`);
  console.log(`モデル(FAL_VIDEO_MODEL): ${seedanceEndpoint()}\n`);

  if (ready.length === 0) {
    console.error(`❌ cut1〜cut8 の画像が1枚も見つかりません。名前と場所を確認してください。`);
    process.exit(1);
  }

  if (!hasApiKey()) {
    console.log(`[DRY-RUN] ${requiredKeyName()} が未設定のため、生成はスキップしました(コストゼロ)。\n`);
    for (const c of ready) {
      console.log(`--- cut${c.n} ---`);
      console.log(`画像: ${c.img}`);
      console.log(`プロンプト: ${c.prompt}\n`);
    }
    console.log(`本番実行: .env に FAL_KEY と FAL_VIDEO_MODEL(=Hailuo等のI2Vモデル) を設定`);
    process.exit(0);
  }

  try {
    assertValidApiKey();
  } catch (err) {
    console.error(`[error] ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  // 既に出来ているカットは作り直さない（再実行時に費用と時間を無駄にしないため）
  const existing = new Set(
    (await readdir(OUT_DIR).catch(() => [] as string[])).filter(f => /^cut\d+\.mp4$/.test(f))
  );

  /** 1カットを生成する。タイムアウト等の一時的な失敗は1回だけ作り直す */
  async function renderCut(c: { n: number; prompt: string; img?: string }): Promise<boolean> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const started = Date.now();
      process.stdout.write(`[cut${c.n}]${attempt > 1 ? ` 再試行${attempt - 1}` : ""} 生成中...`);
      try {
        const imageUrl = await toDataUri(c.img!);
        const result = await generateVideo(c.prompt, { imageUrl, duration: "6", aspectRatio: "9:16" });
        const file = join(OUT_DIR, `cut${c.n}.mp4`);
        await downloadVideo(result.videoUrl, file);
        console.log(` 完了 (${Math.round((Date.now() - started) / 1000)}s) → ${file}`);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(` 失敗: ${msg}`);
        if (attempt === MAX_ATTEMPTS) return false;
        console.log(`  → cut${c.n} をもう一度試します`);
      }
    }
    return false;
  }

  const done: number[] = [];
  const failedCuts: number[] = [];
  for (const c of ready) {
    if (existing.has(`cut${c.n}.mp4`)) {
      console.log(`[cut${c.n}] 既に生成済みのためスキップ`);
      done.push(c.n);
      continue;
    }
    (await renderCut(c) ? done : failedCuts).push(c.n);
  }

  console.log(`\n完了: 成功 ${done.length} / 失敗 ${failedCuts.length}`);
  if (done.length > 0) {
    console.log(`次: npm run anime:ep1:stitch で ${OUT_DIR} の動画を1本につなぐ。`);
  }
  if (missing.length) {
    console.log(`※ 未配置(${missing.join(", ")})は cut<n> の画像を置いて再実行すれば追加生成できます。`);
  }
  if (failedCuts.length > 0) {
    console.log(`※ 失敗したカット: ${failedCuts.map(n => `cut${n}`).join(", ")}`);
    console.log(`   もう一度実行すると、出来ているカットはスキップして失敗ぶんだけ作り直します。`);
  }
  // 1本も作れなかったときだけ失敗扱いにする。
  // 一部失敗でも、出来たぶんを連結して受け取れるようにするため成功終了する。
  if (done.length === 0) process.exit(1);
}
