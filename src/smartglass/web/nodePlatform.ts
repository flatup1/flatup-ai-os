/**
 * Mac（橋渡し役）で動かすための差し込み口。
 *
 * スマホ版と同じ core をそのまま動かすための、Node 版の実装。
 * 依存ゼロ（Node 18+ の fetch と標準モジュールだけ）。
 */

import { execFile } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import path from "node:path";

import type { HttpAdapter, HttpResponse, StorageAdapter, WifiAdapter } from "../platform.js";
import type { WifiCredentials } from "../types.js";

const run = promisify(execFile);

// ────────────────────────────────── HTTP

export class NodeHttpAdapter implements HttpAdapter {
  async get(url: string, timeoutMs: number): Promise<HttpResponse> {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return { status: response.status, text: await response.text() };
  }

  /**
   * ファイルを落とす。途中まであるなら Range で続きから。
   * サーバが Range を無視して 200 を返したら、最初から書き直す（壊れないように）。
   */
  async download(
    url: string,
    destPath: string,
    options: { timeoutMs: number; fromByte?: number; onProgress?: (received: number, total: number) => void },
  ): Promise<{ path: string; sizeBytes: number }> {
    await mkdir(path.dirname(destPath), { recursive: true });

    const headers: Record<string, string> = {};
    if (options.fromByte && options.fromByte > 0) headers.Range = `bytes=${options.fromByte}-`;

    const response = await fetch(url, { headers, signal: AbortSignal.timeout(options.timeoutMs) });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
    if (!response.body) throw new Error(`no body ${url}`);

    // 206 なら続き、200 なら最初から。
    const resuming = response.status === 206 && Boolean(options.fromByte);
    const already = resuming ? options.fromByte! : 0;
    const total = already + Number(response.headers.get("content-length") ?? 0);

    let received = already;
    const source = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
    source.on("data", (chunk: Buffer) => {
      received += chunk.length;
      options.onProgress?.(received, total);
    });

    await pipeline(source, createWriteStream(destPath, { flags: resuming ? "a" : "w" }));
    return { path: destPath, sizeBytes: (await stat(destPath)).size };
  }
}

// ────────────────────────────────── 保存

export class NodeStorageAdapter implements StorageAdapter {
  constructor(private readonly baseDir: string) {}

  mediaDir(): string {
    return path.join(this.baseDir, "media");
  }

  async exists(target: string): Promise<boolean> {
    return stat(target).then(() => true, () => false);
  }

  async sizeOf(target: string): Promise<number> {
    return stat(target).then((s) => s.size, () => 0);
  }

  async remove(target: string): Promise<void> {
    await rm(target, { force: true });
  }

  async readJson<T>(key: string): Promise<T | null> {
    try {
      return JSON.parse(await readFile(this.jsonPath(key), "utf8")) as T;
    } catch {
      return null;
    }
  }

  async writeJson(key: string, value: unknown): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
    await writeFile(this.jsonPath(key), JSON.stringify(value, null, 2), "utf8");
  }

  /** Mac では「カメラロール」に当たるものが無いので、写真フォルダへ複製する。 */
  async saveToCameraRoll(target: string): Promise<void> {
    const dest = path.join(this.baseDir, "saved", path.basename(target));
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, await readFile(target));
  }

  private jsonPath(key: string): string {
    return path.join(this.baseDir, `${key.replace(/[^\w.-]/g, "_")}.json`);
  }
}

// ────────────────────────────────── Wi-Fi（macOS）

/**
 * Mac の Wi-Fi を、メガネ ⇄ 家のネットワーク で切り替える。
 *
 * ⚠ Mac は同時に1つの Wi-Fi にしか入れない。
 *   取り込み中だけメガネ側に移り、終わったら家のネットワークに戻す。
 *   （その間、iPhone から Mac は一時的に見えなくなる。数秒〜十数秒）
 *
 * macOS 以外、または networksetup が使えないときは「切り替えない」。
 * その場合は利用者が手で Wi-Fi を選ぶ運用になる（それでも動く）。
 */
export class MacWifiAdapter implements WifiAdapter {
  private previousSsid: string | null = null;

  constructor(
    /** 家のWi-Fi（戻り先）。分からなければ、切り替え前の接続先を自動で覚える。 */
    private readonly homeSsid: string | null = null,
    /** 家のWi-Fiのパスワード。キーチェーンに入っていれば不要。 */
    private readonly homePassword: string | null = null,
    /** Wi-Fi のインターフェイス名。 */
    private readonly device = "en0",
  ) {}

  async join(credentials: WifiCredentials): Promise<boolean> {
    if (process.platform !== "darwin") return true; // 切り替えない＝手動運用
    this.previousSsid = this.homeSsid ?? (await this.currentSsid());
    try {
      await run("networksetup", [
        "-setairportnetwork",
        this.device,
        credentials.ssid,
        credentials.password,
      ]);
      // つながるまで少し待つ（すぐ叩くと必ず失敗する）。
      await waitUntil(async () => (await this.currentSsid()) === credentials.ssid, 15_000);
      return true;
    } catch {
      return false;
    }
  }

  async leave(): Promise<void> {
    if (process.platform !== "darwin" || !this.previousSsid) return;
    const back = this.previousSsid;
    this.previousSsid = null;
    const args = ["-setairportnetwork", this.device, back];
    if (this.homePassword) args.push(this.homePassword);
    await run("networksetup", args).catch(() => undefined);
    await waitUntil(async () => (await this.currentSsid()) === back, 20_000).catch(() => undefined);
  }

  async candidateHosts(): Promise<string[]> {
    if (process.platform !== "darwin") return [];
    // ルーター（＝メガネ）のアドレスが分かるなら、それが最有力。
    const { stdout } = await run("sh", ["-c", `route -n get default 2>/dev/null | awk '/gateway/{print $2}'`]).catch(
      () => ({ stdout: "" }),
    );
    const gateway = stdout.trim();
    return gateway ? [gateway] : [];
  }

  /** いまつながっている Wi-Fi の名前。 */
  async currentSsid(): Promise<string | null> {
    if (process.platform !== "darwin") return null;
    const { stdout } = await run("networksetup", ["-getairportnetwork", this.device]).catch(() => ({ stdout: "" }));
    const match = stdout.match(/:\s*(.+)$/m);
    return match ? match[1]!.trim() : null;
  }
}

async function waitUntil(check: () => Promise<boolean>, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await check()) return;
    if (Date.now() > deadline) throw new Error("timeout");
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
}

/** このマシンの、家のネットワークでのアドレス（iPhone から開くURLに使う）。 */
export async function lanAddress(): Promise<string | null> {
  const { networkInterfaces } = await import("node:os");
  for (const list of Object.values(networkInterfaces())) {
    for (const info of list ?? []) {
      if (info.family === "IPv4" && !info.internal) return info.address;
    }
  }
  return null;
}
