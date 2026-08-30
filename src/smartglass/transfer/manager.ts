/**
 * 「写真を取り込む」の中身。
 *
 * 手順（Android も iOS も同じ道すじ。ちがうのは WifiAdapter の実装だけ）:
 *   1. BLE で転送モードにして、SSID とパスワードをもらう
 *   2. その Wi-Fi に入る（Android: Wi-Fi Direct / iOS: NEHotspotConfiguration joinOnce）
 *   3. メガネのIPをさがす（候補を同時に叩く）
 *   4. 一覧を読む（/files/media.config → だめなら /manifest.json）
 *   5. 1件ずつ落とす。切れたら続きから。だめでも次へ進む。
 *   6. Wi-Fi を抜けて、メガネの転送モードを終える
 */

import { SmartGlassError } from "../errors.js";
import type { Platform } from "../platform.js";
import { MANIFEST_PATHS, mediaFileUrl, parseManifest } from "../protocol/manifest.js";
import type { MediaItem, TransferProgress, WifiCredentials } from "../types.js";
import { TransferQueue } from "./queue.js";

/**
 * 取り込みに必要な、メガネ側の3つの動きだけを切り出したもの。
 *
 * スマホ版は ConnectionManager がそのまま当てはまる（BLE でやる）。
 * Web版（Mac が橋渡し）は BLE を使わず、覚えておいた SSID を返すだけの
 * 小さな実装を渡す。TransferManager 本体はどちらか知らなくてよい。
 */
export interface TransferSession {
  /** 転送モードにして、Wi-Fi の情報をもらう。 */
  openWifiTransfer(): Promise<WifiCredentials>;
  /** 転送モードを終える。 */
  closeWifi(): Promise<void>;
  /** 取り込み中かどうかを画面に伝える。 */
  setTransferring(active: boolean): void;
}

/** メガネがよく使うIP。上から順に、同時に叩いて生きているものを採る。 */
export const CANDIDATE_HOSTS = [
  "192.168.43.1", // Android ホットスポットの既定（Wi-Fi Direct のグループオーナー）
  "192.168.49.1", // Wi-Fi Direct のもう一つの既定
  "192.168.4.1",
  "192.168.1.1",
  "192.168.0.1",
  "10.0.0.1",
];

export interface TransferOptions {
  /** IPさがしの制限時間。 */
  discoverTimeoutMs?: number;
  /** 一覧の取得の制限時間。 */
  manifestTimeoutMs?: number;
  /** 1件あたりの取り込みの制限時間。 */
  downloadTimeoutMs?: number;
}

export interface TransferResult {
  /** 取り込めたもの。 */
  completed: MediaItem[];
  /** 取り込めなかったもの（次につないだときに自動で続きをやる）。 */
  failed: MediaItem[];
}

type ProgressListener = (progress: TransferProgress) => void;

export class TransferManager {
  private readonly queue = new TransferQueue();
  private listeners = new Set<ProgressListener>();
  private running = false;
  private readonly discoverTimeoutMs: number;
  private readonly manifestTimeoutMs: number;
  private readonly downloadTimeoutMs: number;

  constructor(
    private readonly platform: Platform,
    private readonly connection: TransferSession,
    options: TransferOptions = {},
  ) {
    this.discoverTimeoutMs = options.discoverTimeoutMs ?? 10_000;
    this.manifestTimeoutMs = options.manifestTimeoutMs ?? 10_000;
    this.downloadTimeoutMs = options.downloadTimeoutMs ?? 120_000;
  }

  subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.queue.snapshot().progress);
    return () => this.listeners.delete(listener);
  }

  progress(): TransferProgress {
    return this.queue.snapshot().progress;
  }

  isRunning(): boolean {
    return this.running;
  }

  /** 取り込めなかったぶんを、もう一度ならべる。 */
  retryFailed(): number {
    const count = this.queue.retryFailed();
    this.emit();
    return count;
  }

  /**
   * 取り込む。alreadyHaveIds に入っているものは飛ばす（二度取り込まない）。
   * 二重起動しない（ボタン連打で壊れないように）。
   */
  async run(alreadyHaveIds: ReadonlySet<string>): Promise<TransferResult> {
    if (this.running) return { completed: [], failed: [] };
    this.running = true;
    this.connection.setTransferring(true);

    let joined = false;
    try {
      // 前回ぶんの「取り込み済み」は外す。今回の結果だけを返すため。
      this.queue.resetForNewRun();
      const credentials = await this.connection.openWifiTransfer();
      joined = await this.platform.wifi.join(credentials);
      if (!joined) throw new SmartGlassError("wifi_join_failed");

      const baseUrl = await this.discoverGlassesUrl();
      const items = await this.fetchManifest(baseUrl);
      this.queue.enqueue(items, alreadyHaveIds);
      this.emit();

      await this.drain(baseUrl);
      return { completed: this.queue.completedItems(), failed: this.queue.failedItems() };
    } finally {
      if (joined) await this.platform.wifi.leave().catch(() => undefined);
      await this.connection.closeWifi();
      this.connection.setTransferring(false);
      this.running = false;
      this.emit();
    }
  }

  /** メガネのIPをさがす。候補を同時に叩いて、最初に返事をしたものを使う。 */
  private async discoverGlassesUrl(): Promise<string> {
    const provided = await this.platform.wifi.candidateHosts().catch(() => []);
    const hosts = [...new Set([...provided, ...CANDIDATE_HOSTS])];
    const perHostTimeout = Math.max(1_000, Math.floor(this.discoverTimeoutMs / 2));

    const attempts = hosts.map(async (host) => {
      const baseUrl = `http://${host}`;
      for (const path of MANIFEST_PATHS) {
        const response = await this.platform.http
          .get(`${baseUrl}${path}`, perHostTimeout)
          .catch(() => null);
        if (response && response.status >= 200 && response.status < 300) return baseUrl;
      }
      throw new Error(`no response from ${host}`);
    });

    try {
      return await Promise.any(attempts);
    } catch {
      throw new SmartGlassError("glasses_not_reachable");
    }
  }

  /** 一覧を読む。2つの流儀のどちらでも読める。 */
  private async fetchManifest(baseUrl: string): Promise<MediaItem[]> {
    for (const path of MANIFEST_PATHS) {
      const response = await this.platform.http
        .get(`${baseUrl}${path}`, this.manifestTimeoutMs)
        .catch(() => null);
      if (!response || response.status < 200 || response.status >= 300) continue;
      const items = parseManifest(response.text, this.platform.now());
      if (items.length > 0) return items;
      // 空の一覧も正しい返事。「新しい写真はありません」として扱う。
      return [];
    }
    throw new SmartGlassError("manifest_failed");
  }

  /** 順番に落とす。1件失敗しても、次へ進む。 */
  private async drain(baseUrl: string): Promise<void> {
    for (;;) {
      const entry = this.queue.next();
      if (!entry) break;
      this.emit();

      const destPath = `${this.platform.storage.mediaDir()}/${entry.item.fileName}`;
      const url = mediaFileUrl(baseUrl, entry.item.fileName);
      // 途中まであるなら、そこから続ける。
      const fromByte = entry.receivedBytes > 0 ? entry.receivedBytes : undefined;

      try {
        const result = await this.platform.http.download(url, destPath, {
          timeoutMs: this.downloadTimeoutMs,
          ...(fromByte !== undefined ? { fromByte } : {}),
          onProgress: (received) => {
            this.queue.updateProgress(entry.item.id, received);
            this.emit();
          },
        });
        this.queue.markDone(entry.item.id, result.path);
      } catch (error) {
        // 途中まで取れていれば、その量を覚えて次の周回で続きから。
        const partial = await this.platform.storage.sizeOf(destPath).catch(() => 0);
        this.queue.updateProgress(entry.item.id, partial);
        this.queue.markFailed(entry.item.id, String(error));
      }
      this.emit();
    }
  }

  private emit(): void {
    const progress = this.queue.snapshot().progress;
    for (const listener of this.listeners) listener(progress);
  }
}
