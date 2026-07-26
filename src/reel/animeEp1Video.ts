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
import {
  generateVideo,
  downloadVideo,
  seedanceEndpoint,
  requiredKeyName,
  hasApiKey,
  assertValidApiKey,
} from "./seedance.js";

/** EP1 8カットの Hailuo I2V プロンプト（docs/flatup_anime_episode1.md と一致） */
export const EP1_CUTS: Array<{ n: number; prompt: string }> = [
  { n: 1, prompt: "Slow subtle dolly-in toward the gym, warm window light flickers gently, faint steam rises from the wet street, cozy calm night, one gentle motion only, fixed camera, background unchanged, 6 seconds" },
  { n: 2, prompt: "The coach raises one hand in a friendly greeting and the kids wave back with bright smiles, gentle breathing and blinking, warm and lively, one gentle motion only, fixed camera, background unchanged, 6 seconds" },
  { n: 3, prompt: "The coach speaks warmly with a soft gesture, the seated kids nod and their eyes light up, gentle breathing, tender mood, one gentle motion only, fixed camera, background unchanged, 6 seconds" },
  { n: 4, prompt: "The row of kids throws one clean jab punch forward in unison, the coach nods with a proud smile, light hair and clothing motion, one gentle motion only, fixed camera, background unchanged, 6 seconds" },
  { n: 5, prompt: "The kid throws one straight punch into the focus mitt with a soft impact, the coach reacts with a cheerful expression, gentle motion, one action only, fixed camera, background unchanged, 6 seconds" },
  { n: 6, prompt: "The two kids touch gloves and bow to each other with big warm smiles, no impact, only a friendly respectful gesture, soft motion, fixed camera, background unchanged, 6 seconds" },
  { n: 7, prompt: "The kneeling kids bow forward together in a respectful gesture, the coach bows with them, slow calm synchronized motion, fixed camera, background unchanged, 6 seconds" },
  { n: 8, prompt: "Very slow pull-back from the gym exterior, the window silhouettes stay smiling, warm light glows steadily, magical calm ending, one gentle motion only, fixed camera, background unchanged, 6 seconds" },
];

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
  let ok = 0;
  let failed = 0;
  for (const c of ready) {
    const started = Date.now();
    process.stdout.write(`[cut${c.n}] 生成中...`);
    try {
      const imageUrl = await toDataUri(c.img!);
      const result = await generateVideo(c.prompt, { imageUrl, duration: "6", aspectRatio: "9:16" });
      const file = join(OUT_DIR, `cut${c.n}.mp4`);
      await downloadVideo(result.videoUrl, file);
      const sec = Math.round((Date.now() - started) / 1000);
      console.log(` 完了 (${sec}s) → ${file}`);
      ok++;
    } catch (err) {
      console.log(` 失敗: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  console.log(`\n完了: 成功 ${ok} / 失敗 ${failed}`);
  if (ok > 0) {
    console.log(`次: npm run anime:ep1:stitch で ${OUT_DIR} の動画を1本につなぐ。`);
  }
  if (missing.length) {
    console.log(`※ 未配置(${missing.join(", ")})は cut<n> の画像を置いて再実行すれば追加生成できます。`);
  }
  if (failed > 0) process.exit(1);
}
