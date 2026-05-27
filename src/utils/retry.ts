/**
 * HTTP ベースのリトライヘルパー。OpenRouter / 一般的な REST API 共通で使える。
 *
 * - status エラー: 408 / 409 / 429 / 500 / 502 / 503 / 504 / 529 でリトライ
 * - ネットワーク系: fetch が throw する TypeError(name === "TypeError")
 *   / AbortError(timeout) / connection 系の Error をリトライ対象
 * - 400/401/403/404 は即時 throw
 */

const RETRYABLE_STATUSES = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

interface ErrorWithStatus {
  status?: number;
  name?: string;
  code?: string;
}

function isRetryable(err: unknown): boolean {
  if (!err) return false;
  const e = err as ErrorWithStatus;
  if (typeof e.status === "number" && RETRYABLE_STATUSES.has(e.status)) return true;
  // タイムアウト・ネットワーク断
  if (e.name === "AbortError" || e.name === "TimeoutError") return true;
  if (e.name === "TypeError" && err instanceof Error && /fetch failed|network/i.test(err.message)) {
    return true;
  }
  if (e.code === "ECONNRESET" || e.code === "ETIMEDOUT" || e.code === "ENOTFOUND") return true;
  return false;
}

export interface RetryOptions {
  /** 最大試行回数(初回含む)。既定 3 */
  maxAttempts?: number;
  /** 初回バックオフ ms。既定 1000 */
  baseDelayMs?: number;
  /** バックオフ上限 ms。既定 30000 */
  maxDelayMs?: number;
  /** リトライ前にログ等を出すフック */
  onRetry?: (err: unknown, attempt: number, waitMs: number) => void;
}

/**
 * 指数バックオフ + フルジッターで関数を再試行する。
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 30_000;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const canRetry = isRetryable(err) && attempt < maxAttempts;
      if (!canRetry) {
        throw err;
      }
      const expDelay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const waitMs = Math.floor(Math.random() * expDelay);
      options.onRetry?.(err, attempt, waitMs);
      await sleep(waitMs);
    }
  }
  throw lastErr;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
