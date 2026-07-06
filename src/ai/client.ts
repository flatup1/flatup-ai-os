import "../utils/loadEnv.js";
import { retryWithBackoff } from "../utils/retry.js";
import { appendUsageLog } from "../utils/usageLog.js";
import { getCurrentRoute } from "../utils/context.js";

/**
 * 本番 LINE Bot (/root/line_webhook.py) と同じスタックで呼ぶ:
 *   - OpenRouter 経由 (Chat Completions 形式)
 *   - モデル: anthropic/claude-haiku-4-5
 *   - thinking なし、temperature 0.4
 *   - fetch 直叩き (依存ゼロ)
 */

const apiKey = process.env.OPENROUTER_API_KEY;
const baseUrl = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
const model = process.env.AIKA_MODEL || "anthropic/claude-haiku-4-5";
const maxTokens = Number(process.env.AIKA_MAX_TOKENS) || 4096;
const temperature = Number(process.env.AIKA_TEMPERATURE);
const defaultTemperature = Number.isFinite(temperature) ? temperature : 0.4;
const referer = process.env.OPENROUTER_REFERER || "https://line.flatupnarita.jp";
const title = process.env.OPENROUTER_TITLE || "FLATUP AI OS";

/** prompts.ts が組み立てる中間表現。OpenRouter には単一 system 文字列としてまとめて送る。 */
export interface SystemBlock {
  type: "text";
  text: string;
  /**
   * Anthropic 直叩き時に prompt cache を効かせるためのヒント。
   * OpenRouter 経由ではプロバイダ依存で挙動が変わるため、現状は無視される。
   * 将来的に Anthropic ダイレクトに戻した時の互換のため型は残す。
   */
  cache_control?: { type: "ephemeral" };
}

export type SystemBlocks = SystemBlock[];

export interface GenerateOptions {
  /** 個別タスクで max_tokens を上書きしたい時に使用 */
  maxTokens?: number;
  /** 個別タスクで temperature を上書き */
  temperature?: number;
}

interface ChatCompletionResponse {
  id?: string;
  model?: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    // OpenRouter が Anthropic から passthrough する場合に来ることがある
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    prompt_tokens_details?: {
      cached_tokens?: number;
    };
  };
}

/**
 * AIKA の本体呼び出し。
 *
 * - OpenRouter Chat Completions に対して fetch で POST する
 * - 429 / 5xx は指数バックオフで最大 3 回再試行
 * - 成功時は logs/usage.jsonl に 1 行追記(prompt/completion トークン + 推定 cache 読み)
 * - OPENROUTER_API_KEY が未設定なら、コストを発生させずに dry-run プレビューを返す
 */
export async function generateWithAI(
  system: SystemBlocks,
  userPrompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const systemText = system.map(b => b.text).join("\n\n");
  const requestMaxTokens = options.maxTokens ?? maxTokens;
  const requestTemperature = options.temperature ?? defaultTemperature;

  if (!apiKey) {
    return [
      "[DRY-RUN] OPENROUTER_API_KEY が未設定のため、AI呼び出しはスキップしました。",
      "",
      `Model: ${model}`,
      `Endpoint: ${baseUrl}/chat/completions`,
      `max_tokens: ${requestMaxTokens} / temperature: ${requestTemperature}`,
      "",
      "=== System (preview) ===",
      systemText.slice(0, 1500) + "...",
      "",
      "=== User ===",
      userPrompt,
    ].join("\n");
  }

  const route = getCurrentRoute();
  let retryCount = 0;
  const startedAt = Date.now();

  const body = {
    model,
    messages: [
      { role: "system", content: systemText },
      { role: "user", content: userPrompt },
    ],
    max_tokens: requestMaxTokens,
    temperature: requestTemperature,
  };

  let response: ChatCompletionResponse;
  try {
    response = await retryWithBackoff(
      async () => {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": referer,
            "X-Title": title,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30_000),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          const err = new Error(
            `OpenRouter ${res.status}: ${text.slice(0, 500)}`
          ) as Error & { status?: number };
          err.status = res.status;
          throw err;
        }

        return (await res.json()) as ChatCompletionResponse;
      },
      {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30_000,
        onRetry: (err, attempt, waitMs) => {
          retryCount = attempt;
          const status = (err as { status?: number })?.status ?? "?";
          const message = err instanceof Error ? err.message : String(err);
          console.error(
            `[retry ${attempt}/3] status=${status} after ${waitMs}ms — ${message.slice(0, 200)}`
          );
        },
      }
    );
  } catch (err) {
    const status = (err as { status?: number })?.status ?? "?";
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[openrouter-error] status=${status} — ${message}`);
    throw err;
  }

  // usage を JSONL に記録
  const usage = response.usage ?? {};
  const cacheRead =
    usage.cache_read_input_tokens ??
    usage.prompt_tokens_details?.cached_tokens ??
    0;
  await appendUsageLog({
    route,
    model,
    thinking_enabled: false, // Haiku + Chat Completions では未使用
    input_tokens: (usage.prompt_tokens ?? 0) - cacheRead,
    output_tokens: usage.completion_tokens ?? 0,
    cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: cacheRead,
    duration_ms: Date.now() - startedAt,
    retry_count: retryCount,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
