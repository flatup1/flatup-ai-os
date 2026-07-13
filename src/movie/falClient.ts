/**
 * fal.ai キュー API の汎用クライアント(画像/動画共用)。
 * reel/seedance.ts と同じキュー方式: submit → status ポーリング → response 取得。
 *
 * 環境変数:
 * - FAL_KEY              未設定なら呼び出し側で DRY-RUN にする
 * - MOVIE_IMAGE_ENDPOINT 静止画生成。既定 fal-ai/nano-banana(参照画像ありは /edit)
 * - MOVIE_I2V_ENDPOINT   image-to-video。既定 bytedance/seedance-2.0/fast/image-to-video
 */

import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { assertValidFalKey } from "../reel/seedance.js";

const QUEUE_BASE = "https://queue.fal.run";
const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 10 * 60_000;

export function imageEndpoint(withRefs: boolean): string {
  const base = process.env.MOVIE_IMAGE_ENDPOINT || "fal-ai/nano-banana";
  if (process.env.MOVIE_IMAGE_ENDPOINT) return base;
  return withRefs ? `${base}/edit` : base;
}

export function i2vEndpoint(): string {
  return process.env.MOVIE_I2V_ENDPOINT || "bytedance/seedance-2.0/fast/image-to-video";
}

function authHeaders(): Record<string, string> {
  assertValidFalKey();
  return { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" };
}

async function fetchJson(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`fal API ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text) as Record<string, unknown>;
}

/** キューに投げて完了レスポンスを返す(完了までブロック) */
export async function submitAndWait(
  endpoint: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const submitted = await fetchJson(`${QUEUE_BASE}/${endpoint}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const statusUrl = String(submitted.status_url ?? "");
  const responseUrl = String(submitted.response_url ?? "");
  if (!statusUrl || !responseUrl) return submitted; // 同期レスポンス

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  for (;;) {
    if (Date.now() > deadline) {
      throw new Error(`生成がタイムアウトしました(${POLL_TIMEOUT_MS / 60000}分)。status: ${statusUrl}`);
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    const status = await fetchJson(statusUrl, { headers: authHeaders() });
    const s = String(status.status ?? "");
    if (s === "COMPLETED") break;
    if (s === "FAILED" || s === "CANCELLED" || s === "ERROR") {
      throw new Error(`生成が失敗しました: ${JSON.stringify(status).slice(0, 300)}`);
    }
  }
  return fetchJson(responseUrl, { headers: authHeaders() });
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
