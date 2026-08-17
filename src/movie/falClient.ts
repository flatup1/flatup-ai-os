/**
 * 第0話の素材生成で使う fal.ai 入出力ヘルパー。
 *
 * キュー送信・ポーリングは `reel/seedance.ts` の falQueueRequest を再利用する
 * (タイムアウト・リトライの実装をひとつに保つため、ここでは複製しない)。
 *
 * 環境変数:
 * - MOVIE_IMAGE_ENDPOINT 静止画生成。既定 fal-ai/nano-banana(参照画像ありは /edit)
 * - MOVIE_I2V_ENDPOINT   image-to-video。既定 bytedance/seedance-2.0/fast/image-to-video
 */

import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";

export { falQueueRequest as submitAndWait } from "../reel/seedance.js";

export function imageEndpoint(withRefs: boolean): string {
  const base = process.env.MOVIE_IMAGE_ENDPOINT || "fal-ai/nano-banana";
  if (process.env.MOVIE_IMAGE_ENDPOINT) return base;
  return withRefs ? `${base}/edit` : base;
}

export function i2vEndpoint(): string {
  return process.env.MOVIE_I2V_ENDPOINT || "bytedance/seedance-2.0/fast/image-to-video";
}

/** レスポンスから画像URL群を取り出す(images[].url / image.url の両対応) */
export function extractImageUrls(payload: Record<string, unknown>): string[] {
  const images = payload.images as Array<{ url?: string }> | undefined;
  if (Array.isArray(images) && images.length > 0) {
    return images.map(i => i.url).filter((u): u is string => typeof u === "string");
  }
  const image = payload.image as { url?: string } | undefined;
  if (image?.url) return [image.url];
  throw new Error(`レスポンスに画像URLがありません: ${JSON.stringify(payload).slice(0, 300)}`);
}

/** レスポンスから動画URLを取り出す */
export function extractVideoUrl(payload: Record<string, unknown>): string {
  const video = payload.video as { url?: string } | undefined;
  if (video?.url) return video.url;
  throw new Error(`レスポンスに video.url がありません: ${JSON.stringify(payload).slice(0, 300)}`);
}

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/** ローカル画像を data URI にする(fal の image_url 系入力に直接渡せる) */
export async function toDataUri(filePath: string): Promise<string> {
  const mime = MIME[extname(filePath).toLowerCase()];
  if (!mime) throw new Error(`対応していない画像形式です: ${filePath}(png/jpg/webp のみ)`);
  const buf = await readFile(filePath);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/** URL の中身をローカルへ保存する */
export async function download(url: string, filePath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ダウンロードに失敗: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buf);
}
