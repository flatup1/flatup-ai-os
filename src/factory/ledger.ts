/**
 * 量産の台帳（logs/factory.jsonl）。
 *
 * 1本 = 1行。「どの場面を、どのseedで、いくらで、いつ作ったか」を残す。
 * 当たったseedを再利用する / 使ったお金を数える / 二重生成を防ぐ、の3つに使う。
 *
 * PII は入れない（プロンプトは英語の演出指示のみ、顧客情報は扱わない）。
 */

import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface LedgerEntry {
  ts: string;
  backend: "fal" | "h3";
  model: string;
  scene: string;
  seed: number;
  label: string;
  status: "ok" | "failed" | "dry-run";
  file?: string;
  duration_ms?: number;
  est_cost_usd?: number;
  error?: string;
}

export function ledgerPath(cwd = process.cwd()): string {
  return join(cwd, "logs", "factory.jsonl");
}

export async function appendLedger(entry: LedgerEntry, path = ledgerPath()): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, JSON.stringify(entry) + "\n", "utf8");
}

/** 台帳を読む（壊れた行は捨てる。集計で落ちないことを優先する） */
export async function readLedger(path = ledgerPath()): Promise<LedgerEntry[]> {
  const text = await readFile(path, "utf8").catch(() => "");
  const out: LedgerEntry[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as LedgerEntry);
    } catch {
      // 壊れた行は無視
    }
  }
  return out;
}

export interface LedgerSummary {
  total: number;
  ok: number;
  failed: number;
  costUsd: number;
  byScene: Array<{ scene: string; ok: number; failed: number }>;
}

/** 台帳の集計（`--summary` で表示する） */
export function summarize(entries: LedgerEntry[]): LedgerSummary {
  const real = entries.filter(e => e.status !== "dry-run");
  const byScene = new Map<string, { ok: number; failed: number }>();
  let cost = 0;
  for (const e of real) {
    const row = byScene.get(e.scene) ?? { ok: 0, failed: 0 };
    if (e.status === "ok") row.ok++;
    else row.failed++;
    byScene.set(e.scene, row);
    if (e.status === "ok") cost += e.est_cost_usd ?? 0;
  }
  return {
    total: real.length,
    ok: real.filter(e => e.status === "ok").length,
    failed: real.filter(e => e.status === "failed").length,
    costUsd: Math.round(cost * 100) / 100,
    byScene: [...byScene.entries()].map(([scene, v]) => ({ scene, ...v })),
  };
}
