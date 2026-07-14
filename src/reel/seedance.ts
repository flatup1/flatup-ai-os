/**
 * fal.ai / BytePlus 動画生成クライアント(プロバイダ + モデル切替式)。
 *
 * SEEDANCE_PROVIDER で接続先を選ぶ。
 * - fal      (既定) fal.ai キュー API。個人向け・最安。キーは FAL_KEY
 * - byteplus BytePlus ModelArk(ByteDance 公式)。キーは ARK_API_KEY
 *
 * fal 側は FAL_VIDEO_MODEL でモデルを差し替えられる。
 * - 既定は Seedance 2.0 Fast の text-to-video(プロンプトだけで生成)。
 * - Hailuo 2.3 Fast などの image-to-video を指定すると、入力画像を起点に生成する
 *   モードへ自動で切り替わる(モデルパスに "image-to-video" を含むかで判定)。
 *
 *     FAL_VIDEO_MODEL=fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video
 *
 * どちらも「送信 → ポーリング → 動画 URL 取得」の非同期タスク方式。
 *
 * 環境変数:
 * - SEEDANCE_PROVIDER       fal (既定) / byteplus
 * - FAL_KEY                 fal.ai の API キー
 * - FAL_VIDEO_MODEL         fal 用モデル。未設定なら SEEDANCE_ENDPOINT →
 *                           既定 bytedance/seedance-2.0/fast/text-to-video
 * - FAL_PROMPT_OPTIMIZER    image-to-video のプロンプト最適化(既定 true)
 * - SEEDANCE_ENDPOINT       (後方互換)FAL_VIDEO_MODEL 未設定時の fal モデル
 * - ARK_API_KEY             BytePlus ModelArk の API キー
 * - SEEDANCE_ARK_MODEL      既定 dreamina-seedance-2-0-fast-260128(安い Fast 層)
 *                           品質重視は dreamina-seedance-2-0-260128
 * - SEEDANCE_RESOLUTION     text-to-video の解像度。既定 720p (480p/720p)
 *                           ※ image-to-video(Hailuo standard)は 768p 固定で送らない
 * - SEEDANCE_DURATION       既定 6 (秒)
 */

import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";

export interface SeedanceOptions {
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  seed?: number;
  /** image-to-video 用: 既にホストされている画像 URL(http/https/data URI) */
  imageUrl?: string;
  /** image-to-video 用: ローカル画像ファイル。base64 data URI にして送る */
  imagePath?: string;
}

export interface SeedanceResult {
  videoUrl: string;
  seed?: number;
}

export type SeedanceProvider = "fal" | "byteplus";

const FAL_QUEUE_BASE = "https://queue.fal.run";
const ARK_BASE = "https://ark.ap-southeast.bytepluses.com/api/v3";
const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 10 * 60_000;

/** 拡張子 → MIME(image-to-video の data URI 生成用) */
const IMAGE_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export function seedanceProvider(): SeedanceProvider {
  const p = (process.env.SEEDANCE_PROVIDER || "fal").toLowerCase();
  if (p === "byteplus" || p === "ark") return "byteplus";
  return "fal";
}

/** 現在のプロバイダで使うモデル/エンドポイント ID */
export function videoModel(): string {
  if (seedanceProvider() === "byteplus") {
    return process.env.SEEDANCE_ARK_MODEL || "dreamina-seedance-2-0-fast-260128";
  }
  return (
    process.env.FAL_VIDEO_MODEL ||
    process.env.SEEDANCE_ENDPOINT ||
    "bytedance/seedance-2.0/fast/text-to-video"
  );
}

/** 後方互換の別名(generate.ts の表示などで使用) */
export const seedanceEndpoint = videoModel;

/** fal で image-to-video モデルが選ばれているか(入力画像が必須になる) */
export function isImageToVideo(): boolean {
  return seedanceProvider() === "fal" && /image-to-video|\bi2v\b/.test(videoModel());
}

/** image-to-video のプロンプト最適化フラグ(既定 ON) */
export function falPromptOptimizer(): boolean {
  const v = (process.env.FAL_PROMPT_OPTIMIZER ?? "true").toLowerCase();
  return v !== "false" && v !== "0" && v !== "off" && v !== "no";
}

/** 現在のプロバイダが必要とする API キーの環境変数名 */
export function requiredKeyName(): string {
  return seedanceProvider() === "byteplus" ? "ARK_API_KEY" : "FAL_KEY";
}

/** API キーが設定されているか(DRY-RUN 判定用) */
export function hasApiKey(): boolean {
  return Boolean(process.env[requiredKeyName()]);
}

/**
 * API キーの形が正しいか検査する(プレースホルダのまま・全角文字混入を弾く)。
 * HTTP ヘッダに乗せられない文字が入っていると fetch が
 * 「Cannot convert argument to a ByteString」で全件失敗するため、実行前に1回で止める。
 */
export function assertValidApiKey(): void {
  const name = requiredKeyName();
  const key = process.env[name];
  if (!key) {
    throw new Error(`${name} が未設定です(.env に ${name}=... を追加)`);
  }
  if (!/^[\x21-\x7e]+$/.test(key)) {
    throw new Error(
      `${name} に日本語などの全角文字が入っています。「ここにキーを貼る」のままになっていませんか?\n` +
      (name === "FAL_KEY"
        ? "https://fal.ai/dashboard/keys で発行された英数字のキーを .env に貼ってください。\n"
        : "BytePlus ModelArk の API Key Management で発行された英数字のキーを .env に貼ってください。\n") +
      `修正例: echo '${name}=実際のキー' > .env`
    );
  }
}

/** 拡張子から画像 MIME を判定する(未対応形式は弾く) */
export function imageMimeType(path: string): string {
  const ext = extname(path).toLowerCase();
  const mime = IMAGE_MIME[ext];
  if (!mime) {
    throw new Error(
      `対応していない画像形式です: ${ext || path}(png / jpg / jpeg / webp のみ対応)`
    );
  }
  return mime;
}

/** ローカル画像を base64 data URI にする(fal の image_url にそのまま渡せる) */
export async function imageToDataUri(path: string): Promise<string> {
  const mime = imageMimeType(path); // 先に形式を検査してから読む
  const buf = await readFile(path);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function fetchJson(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`動画 API ${res.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as Record<string, unknown>;
}

function resolvedOptions(opts: SeedanceOptions): Required<Pick<SeedanceOptions, "aspectRatio" | "resolution" | "duration">> & { seed?: number } {
  return {
    aspectRatio: opts.aspectRatio ?? "9:16",
    resolution: opts.resolution ?? process.env.SEEDANCE_RESOLUTION ?? "720p",
    duration: opts.duration ?? process.env.SEEDANCE_DURATION ?? "6",
    seed: opts.seed,
  };
}

/** 1本生成してホスト先の動画 URL を返す(完了までブロック) */
export async function generateVideo(prompt: string, opts: SeedanceOptions = {}): Promise<SeedanceResult> {
  assertValidApiKey();
  const o = resolvedOptions(opts);
  if (seedanceProvider() === "byteplus") return generateViaByteplus(prompt, o);
  if (isImageToVideo()) return generateViaFalImageToVideo(prompt, o, opts);
  return generateViaFalTextToVideo(prompt, o);
}

// --- fal.ai ---

function falHeaders(): Record<string, string> {
  return { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" };
}

/** fal キューへ投げて完了までポーリングし、動画 URL を取り出す(T2V/I2V 共通の転送) */
async function submitAndAwaitFal(body: Record<string, unknown>): Promise<SeedanceResult> {
  const submitted = await fetchJson(`${FAL_QUEUE_BASE}/${videoModel()}`, {
    method: "POST",
    headers: falHeaders(),
    body: JSON.stringify(body),
  });

  const statusUrl = String(submitted.status_url ?? "");
  const responseUrl = String(submitted.response_url ?? "");
  if (!statusUrl || !responseUrl) {
    // キュー形式でない(同期)レスポンスの場合はそのまま解釈する
    return extractFalResult(submitted);
  }

  await pollUntil(async () => {
    const status = await fetchJson(statusUrl, { headers: falHeaders() });
    const s = String(status.status ?? "");
    if (s === "COMPLETED") return true;
    if (s === "FAILED" || s === "CANCELLED" || s === "ERROR") {
      throw new Error(`生成が失敗しました: ${JSON.stringify(status).slice(0, 300)}`);
    }
    return false;
  }, statusUrl);

  return extractFalResult(await fetchJson(responseUrl, { headers: falHeaders() }));
}

async function generateViaFalTextToVideo(prompt: string, o: ReturnType<typeof resolvedOptions>): Promise<SeedanceResult> {
  const body: Record<string, unknown> = {
    prompt,
    aspect_ratio: o.aspectRatio,
    resolution: o.resolution,
    duration: o.duration,
  };
  if (o.seed !== undefined) body.seed = o.seed;
  return submitAndAwaitFal(body);
}

/**
 * image-to-video(Hailuo 2.3 Fast standard 等)。
 * 入力画像が必須。resolution は standard=768p 固定・aspect ratio は入力画像に従うため送らない。
 */
async function generateViaFalImageToVideo(
  prompt: string,
  o: ReturnType<typeof resolvedOptions>,
  opts: SeedanceOptions
): Promise<SeedanceResult> {
  const imageUrl = await resolveInputImage(opts);
  const body: Record<string, unknown> = {
    prompt,
    image_url: imageUrl,
    duration: o.duration,
    prompt_optimizer: falPromptOptimizer(),
  };
  return submitAndAwaitFal(body);
}

/** image-to-video の入力画像を解決する(URL 優先、なければローカルを data URI 化) */
async function resolveInputImage(opts: SeedanceOptions): Promise<string> {
  if (opts.imageUrl) return opts.imageUrl;
  if (opts.imagePath) return imageToDataUri(opts.imagePath);
  throw new Error(
    `image-to-video(${videoModel()})では入力画像が必須です。` +
    "起点になる画像を --image <ファイル or URL> で指定してください。"
  );
}

function extractFalResult(payload: Record<string, unknown>): SeedanceResult {
  const video = payload.video as { url?: string } | undefined;
  const url = video?.url;
  if (!url) {
    throw new Error(`レスポンスに video.url がありません: ${JSON.stringify(payload).slice(0, 300)}`);
  }
  const seed = typeof payload.seed === "number" ? payload.seed : undefined;
  return { videoUrl: url, seed };
}

// --- BytePlus ModelArk (Seedance 公式) ---

function arkHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${process.env.ARK_API_KEY}`, "Content-Type": "application/json" };
}

/** Seedance のテキストコマンド(--ratio 等)をプロンプト末尾に付ける */
export function arkCommandText(prompt: string, o: { aspectRatio: string; resolution: string; duration: string; seed?: number }): string {
  let text = `${prompt} --ratio ${o.aspectRatio} --resolution ${o.resolution} --duration ${o.duration}`;
  if (o.seed !== undefined) text += ` --seed ${o.seed}`;
  return text;
}

async function generateViaByteplus(prompt: string, o: ReturnType<typeof resolvedOptions>): Promise<SeedanceResult> {
  const submitted = await fetchJson(`${ARK_BASE}/contents/generations/tasks`, {
    method: "POST",
    headers: arkHeaders(),
    body: JSON.stringify({
      model: videoModel(),
      content: [{ type: "text", text: arkCommandText(prompt, o) }],
    }),
  });

  const taskId = String(submitted.id ?? "");
  if (!taskId) {
    throw new Error(`タスク ID が返ってきません: ${JSON.stringify(submitted).slice(0, 300)}`);
  }

  let last: Record<string, unknown> = submitted;
  await pollUntil(async () => {
    last = await fetchJson(`${ARK_BASE}/contents/generations/tasks/${taskId}`, { headers: arkHeaders() });
    const s = String(last.status ?? "").toLowerCase();
    if (s === "succeeded") return true;
    if (s === "failed" || s === "cancelled") {
      throw new Error(`生成が失敗しました: ${JSON.stringify(last).slice(0, 300)}`);
    }
    return false;
  }, `task ${taskId}`);

  const content = last.content as { video_url?: string } | undefined;
  const url = content?.video_url;
  if (!url) {
    throw new Error(`レスポンスに content.video_url がありません: ${JSON.stringify(last).slice(0, 300)}`);
  }
  const seed = typeof last.seed === "number" ? last.seed : undefined;
  return { videoUrl: url, seed };
}

// --- 共通 ---

async function pollUntil(check: () => Promise<boolean>, label: string): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  for (;;) {
    if (Date.now() > deadline) {
      throw new Error(`生成がタイムアウトしました(${POLL_TIMEOUT_MS / 60000}分)。${label}`);
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    if (await check()) return;
  }
}

/** 動画 URL をローカルに保存する */
export async function downloadVideo(url: string, filePath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`動画のダウンロードに失敗: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buf);
}
