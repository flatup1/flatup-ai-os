/**
 * Mac で動かす「橋渡し」サーバ。
 *
 *   メガネ ──Wi-Fi──▶ Mac（このサーバ） ──家のWi-Fi──▶ ブラウザ（Mac / iPhone）
 *
 * やることは3つだけ:
 *  1. メガネから写真を取り込む（core の TransferManager をそのまま使う）
 *  2. 取り込んだ写真をブラウザに見せる
 *  3. 変化があったら、開いている全部のブラウザに押し届ける（SSE）
 *
 * 依存ゼロ（node:http だけ）。ビルド不要。
 */

import { createReadStream } from "node:fs";
import http from "node:http";
import path from "node:path";

import { GalleryStore } from "../gallery/store.js";
import { asFriendly, type FriendlyError } from "../errors.js";
import { friendlyDate, friendlySize, T } from "../i18n.js";
import type { Platform } from "../platform.js";
import { SettingsStore } from "../settings.js";
import { TransferManager, type TransferSession } from "../transfer/manager.js";
import type { FontScaleName, MediaItem, TransferProgress, WifiCredentials } from "../types.js";
import { MacWifiAdapter, NodeHttpAdapter, NodeStorageAdapter, lanAddress } from "./nodePlatform.js";
import { renderPage } from "./page.js";

/** メガネの Wi-Fi 情報。BLE を使わず、覚えておいたものを返すだけ。 */
class SavedWifiSession implements TransferSession {
  constructor(
    private readonly credentials: WifiCredentials,
    private readonly onTransferring: (active: boolean) => void,
  ) {}

  async openWifiTransfer(): Promise<WifiCredentials> {
    return this.credentials;
  }

  async closeWifi(): Promise<void> {
    // BLE を使わないので、メガネ側の転送モードは自動で切れるのを待つ。
  }

  setTransferring(active: boolean): void {
    this.onTransferring(active);
  }
}

export interface ServerOptions {
  /** メガネが出す Wi-Fi の名前。 */
  glassesSsid: string;
  /** メガネの Wi-Fi のパスワード。 */
  glassesPassword: string;
  /** 取り込んだ写真の置き場。 */
  dataDir: string;
  port: number;
  /** 家のWi-Fi（取り込み後の戻り先）。省略時は切り替え前の接続先を覚える。 */
  homeSsid?: string | null;
  homePassword?: string | null;
  /** テスト用に差し替えるための入口。省略時は Node 実装を使う。 */
  platform?: Platform;
}

export interface SmartGlassServer {
  server: http.Server;
  /** ブラウザに出す、いまの状態。 */
  state(): Promise<StateView>;
  /** 取り込みを1回走らせる。 */
  importOnce(): Promise<void>;
  close(): Promise<void>;
}

export interface StateView {
  busy: boolean;
  mediaCount: number;
  pendingCount: number;
  progress: TransferProgress | null;
  error: FriendlyError | null;
  fontScale: FontScaleName;
  hint: string;
  openHint: string;
  sections: { title: string; items: { id: string; fileName: string; kind: string; size: string }[] }[];
}

export async function createSmartGlassServer(options: ServerOptions): Promise<SmartGlassServer> {
  const platform: Platform = options.platform ?? nodePlatform(options);

  const settings = new SettingsStore(platform.storage);
  const gallery = new GalleryStore(platform.storage);
  await settings.load();
  await gallery.load();

  let busy = false;
  let progress: TransferProgress | null = null;
  let lastError: FriendlyError | null = null;
  // 開いているブラウザたち。転送の購読より先に用意する（購読はすぐ1回呼ばれる）。
  const clients = new Set<http.ServerResponse>();

  const session = new SavedWifiSession(
    { ssid: options.glassesSsid, password: options.glassesPassword },
    (active) => {
      busy = active;
      void broadcast();
    },
  );
  const transfer = new TransferManager(platform, session);
  transfer.subscribe((next) => {
    progress = transfer.isRunning() ? next : null;
    void broadcast();
  });

  const openHint = await buildOpenHint(options.port);

  async function state(): Promise<StateView> {
    return {
      busy,
      mediaCount: gallery.all().length,
      pendingCount: gallery.pendingItems().length,
      progress,
      error: lastError,
      fontScale: settings.get().fontScale,
      hint: gallery.all().length === 0 ? T.connection.hintPowerOn : "",
      openHint,
      sections: gallery.sections(platform.now()).map((section) => ({
        title: section.title,
        items: section.items.map((item) => ({
          id: item.id,
          fileName: item.fileName,
          kind: item.kind,
          size: friendlySize(item.sizeBytes),
        })),
      })),
    };
  }

  async function broadcast(): Promise<void> {
    if (clients.size === 0) return;
    const payload = `data: ${JSON.stringify(await state())}\n\n`;
    for (const client of clients) client.write(payload);
  }

  async function importOnce(): Promise<void> {
    if (transfer.isRunning()) return;
    lastError = null;
    if (gallery.pendingItems().length > 0) transfer.retryFailed();
    try {
      const result = await transfer.run(gallery.knownIds());
      await gallery.add(result.completed);
      await gallery.setPending(result.failed);
      if (result.failed.length > 0) lastError = asFriendly(new Error("download_failed"));
    } catch (error) {
      lastError = asFriendly(error);
    }
    await broadcast();
  }

  const server = http.createServer((req, res) => {
    void handle(req, res).catch(() => {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end("error");
    });
  });

  async function handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(renderPage());
      return;
    }

    if (url.pathname === "/api/state") {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify(await state()));
      return;
    }

    if (url.pathname === "/api/import" && req.method === "POST") {
      res.writeHead(202, { "content-type": "application/json" });
      res.end("{}");
      void importOnce();
      return;
    }

    if (url.pathname === "/api/settings" && req.method === "POST") {
      const body = await readBody(req);
      const scale = (JSON.parse(body || "{}") as { fontScale?: FontScaleName }).fontScale;
      if (scale) await settings.setFontScale(scale);
      res.writeHead(200, { "content-type": "application/json" });
      res.end("{}");
      return;
    }

    if (url.pathname === "/events") {
      res.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        connection: "keep-alive",
      });
      res.write(`data: ${JSON.stringify(await state())}\n\n`);
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    if (url.pathname.startsWith("/media/")) {
      const id = decodeURIComponent(url.pathname.slice("/media/".length));
      // 目録にあるものだけ返す。パスを直接受け取らない（外のファイルを読ませない）。
      const item = gallery.all().find((candidate) => candidate.id === id);
      if (!item?.localPath) {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("not found");
        return;
      }
      const headers: Record<string, string> = {
        "content-type": contentTypeOf(item),
        "cache-control": "private, max-age=86400",
      };
      if (url.searchParams.get("download")) {
        headers["content-disposition"] = `attachment; filename*=UTF-8''${encodeURIComponent(item.fileName)}`;
      }
      res.writeHead(200, headers);
      createReadStream(item.localPath).pipe(res);
      return;
    }

    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
  }

  return {
    server,
    state,
    importOnce,
    async close() {
      for (const client of clients) client.end();
      clients.clear();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

function nodePlatform(options: ServerOptions): Platform {
  const storage = new NodeStorageAdapter(options.dataDir);
  return {
    os: "android", // core は転送の分岐に使わない。Mac は「入って出るだけ」で同じ。
    ble: notUsedBle(),
    wifi: new MacWifiAdapter(options.homeSsid ?? null, options.homePassword ?? null),
    http: new NodeHttpAdapter(),
    storage,
    speech: notUsedSpeech(),
    now: () => Date.now(),
  };
}

/** Web版は BLE を使わない（ブラウザからは触れないため）。呼ばれても静かに何もしない。 */
function notUsedBle(): Platform["ble"] {
  return {
    async isReady() {
      return false;
    },
    async scan() {
      return [];
    },
    async connect() {
      throw new Error("ble not used in web mode");
    },
    async disconnect() {},
    isConnected() {
      return false;
    },
    async write() {},
    subscribe() {
      return () => undefined;
    },
    onDisconnected() {
      return () => undefined;
    },
  };
}

function notUsedSpeech(): Platform["speech"] {
  return {
    async speak() {},
    async stop() {},
    async listen() {
      return "";
    },
  };
}

function contentTypeOf(item: MediaItem): string {
  const ext = path.extname(item.fileName).slice(1).toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic",
    heif: "image/heif", webp: "image/webp",
    mp4: "video/mp4", mov: "video/quicktime", m4v: "video/x-m4v", avi: "video/x-msvideo",
    opus: "audio/ogg", wav: "audio/wav", mp3: "audio/mpeg", m4a: "audio/mp4",
    aac: "audio/aac", amr: "audio/amr",
  };
  return map[ext] ?? "application/octet-stream";
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

/** 「Macでは…、iPhoneでは…」の案内文を作る。 */
async function buildOpenHint(port: number): Promise<string> {
  const lan = await lanAddress();
  const phone = lan ? `iPhone では http://${lan}:${port}` : "";
  return `Mac では http://localhost:${port}${phone ? " ／ " + phone : ""}`;
}

/** 日付の見出しをテストから使えるように再輸出する。 */
export { friendlyDate };
