/**
 * 実機なしで、つなぐ〜取り込むを丸ごと動かすための偽物。
 *
 * 使い道は2つ:
 *  1. テスト（実機がなくても回帰が取れる）
 *  2. デモ（`npm run glasses` で流れを目で見る）
 *
 * わざと失敗させられる（failDownloadsUntilAttempt）ので、
 * 「途中で切れても消えない」をきちんと確かめられる。
 */

import type {
  BleAdapter,
  HttpAdapter,
  HttpResponse,
  Platform,
  SpeechAdapter,
  StorageAdapter,
  WifiAdapter,
} from "../platform.js";
import { OpCode, decodeFrame, encodeCommand } from "../protocol/frame.js";
import type { CharacteristicRole } from "../protocol/uuids.js";
import type { GlassesDevice, WifiCredentials } from "../types.js";

export interface MockFile {
  fileName: string;
  sizeBytes: number;
}

export interface MockOptions {
  devices?: GlassesDevice[];
  files?: MockFile[];
  batteryPercent?: number;
  ssid?: string;
  password?: string;
  host?: string;
  /** 一覧の出し方。実機の2つの流儀を切り替えて試す。 */
  manifestStyle?: "config" | "json";
  /** この回数までのダウンロードは失敗する（リトライの確認用）。 */
  failDownloadsUntilAttempt?: number;
  /** Wi-Fi に入れない状況を作る。 */
  wifiJoinFails?: boolean;
  /** BLE が使えない状況を作る。 */
  bluetoothOff?: boolean;
  /** 見つからない状況を作る。 */
  noDevices?: boolean;
  now?: () => number;
}

export class MockBle implements BleAdapter {
  private connected = false;
  private notifyListeners = new Set<(data: Uint8Array) => void>();
  private disconnectListeners = new Set<() => void>();
  /** 送ったコマンドの記録（テストで中身を確かめる）。 */
  readonly sent: { role: CharacteristicRole; bytes: Uint8Array }[] = [];

  constructor(private readonly options: MockOptions) {}

  async isReady(): Promise<boolean> {
    return !this.options.bluetoothOff;
  }

  async scan(): Promise<GlassesDevice[]> {
    if (this.options.noDevices) return [];
    return (
      this.options.devices ?? [
        { id: "AA:BB:CC:DD:EE:FF", name: "FLATUP Glasses", rssi: -48 },
        { id: "11:22:33:44:55:66", name: "Glasses (far)", rssi: -85 },
      ]
    );
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  /** コマンドを受け取ったら、すぐ返事を流す（実機の通知に相当）。 */
  async write(role: CharacteristicRole, data: Uint8Array): Promise<void> {
    this.sent.push({ role, bytes: data });
    const frame = decodeFrame(data);
    if (!frame) return;

    if (frame.opcode === OpCode.BATTERY) {
      this.notify(encodeCommand(OpCode.BATTERY, new Uint8Array([this.options.batteryPercent ?? 82])));
      return;
    }
    if (frame.opcode === OpCode.OPEN_WIFI_TRANSFER) {
      const ssid = this.options.ssid ?? "HeyCyan-AABBCCDDEEFF";
      const password = this.options.password ?? "123456789";
      const payload = new TextEncoder().encode(`${ssid}\0${password}`);
      this.notify(encodeCommand(OpCode.OPEN_WIFI_TRANSFER, payload));
    }
  }

  subscribe(role: CharacteristicRole, listener: (data: Uint8Array) => void): () => void {
    if (role !== "notify") return () => undefined;
    this.notifyListeners.add(listener);
    return () => this.notifyListeners.delete(listener);
  }

  onDisconnected(listener: () => void): () => void {
    this.disconnectListeners.add(listener);
    return () => this.disconnectListeners.delete(listener);
  }

  /** テストから「切れた」を起こす。 */
  simulateDisconnect(): void {
    this.connected = false;
    for (const listener of this.disconnectListeners) listener();
  }

  private notify(bytes: Uint8Array): void {
    // 実機と同じく、少し遅れて届く。
    setTimeout(() => {
      for (const listener of this.notifyListeners) listener(bytes);
    }, 1);
  }
}

export class MockWifi implements WifiAdapter {
  joined: WifiCredentials | null = null;
  leaveCount = 0;

  constructor(private readonly options: MockOptions) {}

  async join(credentials: WifiCredentials): Promise<boolean> {
    if (this.options.wifiJoinFails) return false;
    this.joined = credentials;
    return true;
  }

  async leave(): Promise<void> {
    this.joined = null;
    this.leaveCount += 1;
  }

  async candidateHosts(): Promise<string[]> {
    return [this.options.host ?? "192.168.43.1"];
  }
}

export class MockHttp implements HttpAdapter {
  private attempts = new Map<string, number>();
  /** 落としたファイル（テストで中身を確かめる）。 */
  readonly downloaded = new Map<string, number>();

  constructor(
    private readonly options: MockOptions,
    private readonly storage: MockStorage,
  ) {}

  async get(url: string, _timeoutMs: number): Promise<HttpResponse> {
    const host = this.options.host ?? "192.168.43.1";
    if (!url.includes(host)) return { status: 0, text: "" };

    const wantsJson = (this.options.manifestStyle ?? "config") === "json";
    const isConfig = url.endsWith("/files/media.config");
    const isJson = url.endsWith("/manifest.json");
    if ((wantsJson && !isJson) || (!wantsJson && !isConfig)) return { status: 404, text: "" };

    const files = this.options.files ?? DEFAULT_FILES;
    return { status: 200, text: wantsJson ? toJsonManifest(files) : toConfigManifest(files) };
  }

  async download(
    url: string,
    destPath: string,
    options: { timeoutMs: number; fromByte?: number; onProgress?: (received: number, total: number) => void },
  ): Promise<{ path: string; sizeBytes: number }> {
    const fileName = decodeURIComponent(url.split("/").pop() ?? "");
    const file = (this.options.files ?? DEFAULT_FILES).find((f) => f.fileName === fileName);
    if (!file) throw new Error(`404 ${fileName}`);

    const attempt = (this.attempts.get(fileName) ?? 0) + 1;
    this.attempts.set(fileName, attempt);

    const failUntil = this.options.failDownloadsUntilAttempt ?? 0;
    if (attempt <= failUntil) {
      // 途中まで受け取ってから切れる（実機でよくある形）。
      const partial = Math.floor(file.sizeBytes / 2);
      this.storage.setSize(destPath, partial);
      options.onProgress?.(partial, file.sizeBytes);
      throw new Error("connection reset");
    }

    options.onProgress?.(file.sizeBytes, file.sizeBytes);
    this.storage.setSize(destPath, file.sizeBytes);
    this.downloaded.set(fileName, (this.downloaded.get(fileName) ?? 0) + 1);
    return { path: destPath, sizeBytes: file.sizeBytes };
  }
}

export class MockStorage implements StorageAdapter {
  private files = new Map<string, number>();
  private json = new Map<string, string>();
  readonly cameraRoll: string[] = [];

  mediaDir(): string {
    return "/mock/media";
  }

  setSize(path: string, size: number): void {
    this.files.set(path, size);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async sizeOf(path: string): Promise<number> {
    return this.files.get(path) ?? 0;
  }

  async remove(path: string): Promise<void> {
    this.files.delete(path);
  }

  async readJson<T>(key: string): Promise<T | null> {
    const raw = this.json.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async writeJson(key: string, value: unknown): Promise<void> {
    this.json.set(key, JSON.stringify(value));
  }

  async saveToCameraRoll(path: string): Promise<void> {
    this.cameraRoll.push(path);
  }
}

export class MockSpeech implements SpeechAdapter {
  readonly spoken: string[] = [];
  /** listen() がこの順で返す。 */
  heard: string[] = [];

  async speak(text: string): Promise<void> {
    this.spoken.push(text);
  }

  async stop(): Promise<void> {}

  async listen(): Promise<string> {
    return this.heard.shift() ?? "";
  }
}

const DEFAULT_FILES: MockFile[] = [
  { fileName: "IMG_20260825_101500.jpg", sizeBytes: 2_400_000 },
  { fileName: "IMG_20260825_101530.jpg", sizeBytes: 2_100_000 },
  { fileName: "VID_20260824_183012.mp4", sizeBytes: 48_000_000 },
  { fileName: "REC_20260824_090000.opus", sizeBytes: 320_000 },
  { fileName: "notes.txt", sizeBytes: 120 }, // 対象外。捨てられることの確認用。
];

function toConfigManifest(files: MockFile[]): string {
  return ["# media.config", ...files.map((f) => `${f.fileName},${f.sizeBytes}`)].join("\n");
}

function toJsonManifest(files: MockFile[]): string {
  return JSON.stringify({
    files: files.map((f) => ({ name: f.fileName, size: f.sizeBytes })),
  });
}

export interface MockPlatform extends Platform {
  ble: MockBle;
  wifi: MockWifi;
  http: MockHttp;
  storage: MockStorage;
  speech: MockSpeech;
}

/** すべての偽物をまとめて作る。 */
export function createMockPlatform(options: MockOptions = {}): MockPlatform {
  const storage = new MockStorage();
  return {
    os: "android",
    ble: new MockBle(options),
    wifi: new MockWifi(options),
    http: new MockHttp(options, storage),
    storage,
    speech: new MockSpeech(),
    now: options.now ?? (() => Date.now()),
  };
}
