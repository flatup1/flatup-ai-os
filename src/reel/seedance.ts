/**
 * Seedance 2.0 (fal.ai キュー API) クライアント。
 *
 * - 送信: POST https://queue.fal.run/{endpoint}
 * - 監視: レスポンスの status_url をポーリング
 * - 取得: response_url から video.url を得て MP4 をダウンロード
 *
 * 環境変数:
 * - FAL_KEY                 fal.ai の API キー(未設定なら DRY-RUN)
 * - SEEDANCE_ENDPOINT       既定 bytedance/seedance-2.0/fast/text-to-video(安い Fast 層)
 *                           品質重視は bytedance/seedance-2.0/text-to-video
 * - SEEDANCE_RESOLUTION     既定 720p (480p/720p)
 * - SEEDANCE_DURATION       既定 6 (4〜15 秒)
 */

import { writeFile } from "node:fs/promises";

export interface SeedanceOptions {
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  seed?: number;
}

export interface SeedanceResult {
  videoUrl: string;
  seed?: number;
}

const QUEUE_BASE = "https://queue.fal.run";
const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 10 * 60_000;

export function seedanceEndpoint(): string {
  return process.env.SEEDANCE_ENDPOINT || "bytedance/seedance-2.0/fast/text-to-video";
}

/**
 * FAL_KEY の形が正しいか検査する(プレースホルダのまま・全角文字混入を弾く)。
 * HTTP ヘッダに乗せられない文字が入っていると fetch が
 * 「Cannot convert argument to a ByteString」で6回失敗するため、実行前に1回で止める。
 */
export function assertValidFalKey(): void {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY が未設定です(.env に FAL_KEY=... を追加)");
  if (!/^[\x21-\x7e]+$/.test(key)) {
    throw new Error(
      "FAL_KEY に日本語などの全角文字が入っています。「ここにキーを貼る」のままになっていませんか?\n" +
      "https://fal.ai/dashboard/keys で発行された英数字のキーを .env の FAL_KEY= に貼ってください。\n" +
      `修正例: echo 'FAL_KEY=実際のキー' > .env`
    );
  }
}

function authHeaders(): Record<string, string> {
  assertValidFalKey();
  return { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" };
}

async function fetchJson(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Seedance API ${res.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as Record<string, unknown>;
}

/** 1本生成してホスト先の動画 URL を返す(完了までブロック) */
export async function generateVideo(prompt: string, opts: SeedanceOptions = {}): Promise<SeedanceResult> {
  const endpoint = seedanceEndpoint();
  const body: Record<string, unknown> = {
    prompt,
    aspect_ratio: opts.aspectRatio ?? "9:16",
    resolution: opts.resolution ?? process.env.SEEDANCE_RESOLUTION ?? "720p",
    duration: opts.duration ?? process.env.SEEDANCE_DURATION ?? "6",
  };
  if (opts.seed !== undefined) body.seed = opts.seed;

  const submitted = await fetchJson(`${QUEUE_BASE}/${endpoint}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const statusUrl = String(submitted.status_url ?? "");
  const responseUrl = String(submitted.response_url ?? "");
  if (!statusUrl || !responseUrl) {
    // キュー形式でない(同期)レスポンスの場合はそのまま解釈する
    return extractResult(submitted);
  }

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

  const result = await fetchJson(responseUrl, { headers: authHeaders() });
  return extractResult(result);
}

function extractResult(payload: Record<string, unknown>): SeedanceResult {
  const video = payload.video as { url?: string } | undefined;
  const url = video?.url;
  if (!url) {
    throw new Error(`レスポンスに video.url がありません: ${JSON.stringify(payload).slice(0, 300)}`);
  }
  const seed = typeof payload.seed === "number" ? payload.seed : undefined;
  return { videoUrl: url, seed };
}

/** 動画 URL をローカルに保存する */
export async function downloadVideo(url: string, filePath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`動画のダウンロードに失敗: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buf);
}
