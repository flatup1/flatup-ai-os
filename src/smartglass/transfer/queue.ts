/**
 * 取り込みの順番待ち。
 *
 * ここがいちばん大事な部品。約束は3つ:
 *  1. 途中で切れても、取り込めたぶんは消えない。
 *  2. 同じ写真を二度取り込まない。
 *  3. 失敗したものは覚えておいて、次につながったときに自動で続きをやる。
 */

import type { MediaItem, TransferItemProgress, TransferProgress } from "../types.js";
import { T } from "../i18n.js";

/** 1件あたりの再挑戦の上限。これを超えたら「あとで」に回す。 */
export const MAX_ATTEMPTS = 3;

export interface QueueSnapshot {
  items: TransferItemProgress[];
  progress: TransferProgress;
}

export class TransferQueue {
  private entries = new Map<string, TransferItemProgress>();

  /** 取り込む候補を積む。すでに取り込み済みのものは積まない。 */
  enqueue(items: MediaItem[], alreadyHaveIds: ReadonlySet<string>): number {
    let added = 0;
    for (const item of items) {
      if (alreadyHaveIds.has(item.id)) continue;
      const existing = this.entries.get(item.id);
      if (existing && existing.status !== "failed") continue;
      this.entries.set(item.id, {
        item,
        receivedBytes: existing?.receivedBytes ?? 0,
        status: "waiting",
        attempts: existing?.attempts ?? 0,
      });
      added += 1;
    }
    return added;
  }

  /** 次に取り込むもの。小さいものから取り込む（早く1枚見せられる）。 */
  next(): TransferItemProgress | null {
    const waiting = [...this.entries.values()].filter((e) => e.status === "waiting");
    if (waiting.length === 0) return null;
    waiting.sort((a, b) => a.item.sizeBytes - b.item.sizeBytes);
    const picked = waiting[0]!;
    picked.status = "downloading";
    picked.attempts += 1;
    return picked;
  }

  /** 途中まで受け取った量を覚える（Range で続きから取るため）。 */
  updateProgress(id: string, receivedBytes: number): void {
    const entry = this.entries.get(id);
    if (entry) entry.receivedBytes = receivedBytes;
  }

  markDone(id: string, localPath: string): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    entry.status = "done";
    entry.item = { ...entry.item, localPath };
    entry.receivedBytes = entry.item.sizeBytes || entry.receivedBytes;
  }

  /**
   * 失敗を記録する。上限までは "waiting" に戻して、あとでもう一度やる。
   * 戻り値は「まだ挑戦の余地があるか」。
   */
  markFailed(id: string, error: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.lastError = error;
    if (entry.attempts < MAX_ATTEMPTS) {
      entry.status = "waiting";
      return true;
    }
    entry.status = "failed";
    return false;
  }

  /** 失敗したものを、もう一度ならべ直す（「もう一度取り込む」ボタン用）。 */
  retryFailed(): number {
    let count = 0;
    for (const entry of this.entries.values()) {
      if (entry.status !== "failed") continue;
      entry.status = "waiting";
      entry.attempts = 0;
      count += 1;
    }
    return count;
  }

  /** 取り込めなかったもの（画面の「あとで取り込む」一覧に出す）。 */
  failedItems(): MediaItem[] {
    return [...this.entries.values()].filter((e) => e.status === "failed").map((e) => e.item);
  }

  /** 取り込みが終わったもの。 */
  completedItems(): MediaItem[] {
    return [...this.entries.values()].filter((e) => e.status === "done").map((e) => e.item);
  }

  /** 残りがあるか。 */
  hasWork(): boolean {
    return [...this.entries.values()].some((e) => e.status === "waiting" || e.status === "downloading");
  }

  size(): number {
    return this.entries.size;
  }

  /**
   * 次の取り込みのために片づける。
   * 取り込み済みは外し、取り込めなかったものは残す（続きからやるため）。
   */
  resetForNewRun(): void {
    for (const [id, entry] of this.entries) {
      if (entry.status === "done") this.entries.delete(id);
    }
  }

  clear(): void {
    this.entries.clear();
  }

  /** 画面がそのまま出せる形にまとめる。 */
  snapshot(): QueueSnapshot {
    const items = [...this.entries.values()];
    const total = items.length;
    const completed = items.filter((e) => e.status === "done").length;
    const failed = items.filter((e) => e.status === "failed").length;

    // バイト基準にする。大きな動画1本で棒が止まって見えるのを防ぐ。
    const totalBytes = items.reduce((sum, e) => sum + Math.max(e.item.sizeBytes, 1), 0);
    const doneBytes = items.reduce(
      (sum, e) => sum + (e.status === "done" ? Math.max(e.item.sizeBytes, 1) : Math.min(e.receivedBytes, Math.max(e.item.sizeBytes, 1))),
      0,
    );
    const current = items.find((e) => e.status === "downloading");

    return {
      items,
      progress: {
        total,
        completed,
        failed,
        ratio: totalBytes > 0 ? Math.min(doneBytes / totalBytes, 1) : 0,
        message: total === 0 ? T.transfer.none : T.transfer.progress(completed, total),
        ...(current ? { currentFileName: current.item.fileName } : {}),
      },
    };
  }
}
