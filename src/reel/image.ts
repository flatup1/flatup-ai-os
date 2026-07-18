/**
 * 基準画像・キャラクターシート生成 CLI(fal FLUX)。
 *
 * 使い方:
 *   npm run img -- "英語プロンプト"                     # 縦9:16で1枚
 *   npm run img -- "英語プロンプト" --count 4           # 4枚(キャラシート選定用)
 *   npm run img -- "英語プロンプト" --size 1080x1920    # サイズ指定
 *
 * FAL_KEY 未設定時は DRY-RUN(コストゼロ)。
 * 生成物: output/images/YYYY-MM-DD/img_<n>.png
 *
 * 環境変数:
 * - FAL_IMAGE_MODEL  既定 fal-ai/flux/dev
 */

import "../utils/loadEnv.js";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { falQueueRequest, downloadVideo as downloadFile, hasApiKey, assertValidApiKey, requiredKeyName } from "./seedance.js";

export function imageEndpoint(): string {
  return process.env.FAL_IMAGE_MODEL || "fal-ai/flux/dev";
}

/** --size の値をペイロード用に解釈する("1080x1920" → {width,height} / プリセット名はそのまま) */
export function parseImageSize(size: string | undefined): string | { width: number; height: number } {
  if (!size) return "portrait_16_9";
  const m = size.match(/^(\d{2,4})x(\d{2,4})$/i);
  if (m) return { width: Number(m[1]), height: Number(m[2]) };
  return size;
}

const args = process.argv.slice(2);
const isMain = process.argv[1]?.endsWith("image.ts") || process.argv[1]?.endsWith("image.js");

if (isMain) {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`基準画像生成 (fal FLUX)

Usage:
  npm run img -- "<英語プロンプト>" [--count N] [--size WxH|プリセット]

例:
  npm run img -- "A photorealistic gray tabby cat standing upright..." --count 4`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  let count = 1;
  let size: string | undefined;
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--count") {
      const v = Number(args[++i]);
      if (Number.isInteger(v) && v > 0) count = Math.min(v, 8);
    } else if (a === "--size") {
      size = args[++i];
    } else if (!a.startsWith("--")) {
      positional.push(a);
    }
  }
  const prompt = positional.join(" ").trim();
  if (!prompt) {
    console.error(`プロンプトが空です。例: npm run img -- "A cute cat boxer..."`);
    process.exit(1);
  }

  const body = {
    prompt,
    image_size: parseImageSize(size),
    num_images: count,
  };

  if (!hasApiKey()) {
    console.log(`[DRY-RUN] ${requiredKeyName()} が未設定のため、生成はスキップしました(コストゼロ)。\n`);
    console.log(`エンドポイント: ${imageEndpoint()}`);
    console.log(`リクエスト: ${JSON.stringify(body, null, 2)}`);
    process.exit(0);
  }

  try {
    assertValidApiKey();
  } catch (err) {
    console.error(`[error] ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const date = new Date().toISOString().slice(0, 10);
  const outDir = join(process.cwd(), "output", "images", date);
  await mkdir(outDir, { recursive: true });

  console.log(`エンドポイント: ${imageEndpoint()} / ${count}枚を生成します`);
  const result = await falQueueRequest(imageEndpoint(), body);
  const images = (result.images ?? []) as Array<{ url?: string }>;
  if (images.length === 0) {
    console.error(`[error] レスポンスに images がありません: ${JSON.stringify(result).slice(0, 300)}`);
    process.exit(1);
  }

  const stamp = Date.now().toString(36);
  let n = 0;
  for (const img of images) {
    if (!img.url) continue;
    n++;
    const file = join(outDir, `img_${stamp}_${n}.png`);
    await downloadFile(img.url, file);
    console.log(`保存: ${file}`);
  }
  console.log(`\n完了: ${n}枚。良い1枚を選んで npm run reel -- "..." --image <ファイル> で動画化`);
}
