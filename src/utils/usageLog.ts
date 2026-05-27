import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 1 リクエスト = 1 行(JSONL) で `logs/usage.jsonl` に追記する。
 *
 * 後から `jq` で集計可能:
 *   jq -s 'map(.cache_hit_ratio) | add/length' logs/usage.jsonl   # 平均キャッシュヒット率
 *   jq 'select(.route=="risk_check")' logs/usage.jsonl            # route 別フィルタ
 */
const logPath = fileURLToPath(new URL("../../logs/usage.jsonl", import.meta.url));

export interface UsageInput {
  route?: string;
  model: string;
  thinking_enabled: boolean;
  thinking_budget?: number;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  duration_ms: number;
  retry_count: number;
}

export interface UsageRecord extends UsageInput {
  ts: string;
  total_input_tokens: number;
  cache_hit_ratio: number;
}

export async function appendUsageLog(record: UsageInput): Promise<void> {
  const totalInput =
    record.input_tokens +
    record.cache_creation_input_tokens +
    record.cache_read_input_tokens;
  const cacheHitRatio = totalInput > 0 ? record.cache_read_input_tokens / totalInput : 0;

  const full: UsageRecord = {
    ts: new Date().toISOString(),
    ...record,
    total_input_tokens: totalInput,
    // 小数 3 桁に丸めて見やすく
    cache_hit_ratio: Math.round(cacheHitRatio * 1000) / 1000,
  };

  try {
    await mkdir(dirname(logPath), { recursive: true });
    await appendFile(logPath, JSON.stringify(full) + "\n", "utf8");
  } catch (err) {
    // usage ログの失敗で AI 応答自体を失わせない
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[usageLog] failed to write: ${msg}`);
  }
}
