/**
 * つなぐ・つなぎ直す係。
 *
 * 画面がやることは2つだけ:
 *   connect() を呼ぶ / state を見る
 * それ以外（再接続、電池の見張り、指数バックオフ）はここが引き受ける。
 */

import { SmartGlassError } from "../errors.js";
import type { Platform } from "../platform.js";
import { OpCode, encodeCommand, decodeFrame, encodeTimeSyncPayload, parseBatteryPayload, parseWifiPayload } from "../protocol/frame.js";
import type { ConnectionState, DeviceStatus, GlassesDevice, WifiCredentials } from "../types.js";

/** 再接続の待ち時間（ミリ秒）。だんだん延ばして、電池を食わないようにする。 */
export const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

/** 電池がこれ以下なら警告を出す。 */
export const LOW_BATTERY_PERCENT = 20;

export interface ConnectionSnapshot {
  state: ConnectionState;
  device: GlassesDevice | null;
  status: DeviceStatus;
  /** 電池が少ないか。 */
  lowBattery: boolean;
}

export interface ConnectionOptions {
  scanTimeoutMs?: number;
  commandTimeoutMs?: number;
  /** 覚えているメガネのID（次からは選ばせない）。 */
  rememberedDeviceId?: string | null;
}

type Listener = (snapshot: ConnectionSnapshot) => void;

export class ConnectionManager {
  private state: ConnectionState = "disconnected";
  private device: GlassesDevice | null = null;
  private status: DeviceStatus = {};
  private listeners = new Set<Listener>();
  private unsubscribeDisconnect: (() => void) | null = null;
  private reconnectAttempt = 0;
  /** 利用者が自分で切ったときは、勝手につなぎ直さない。 */
  private manuallyDisconnected = false;
  private readonly scanTimeoutMs: number;
  private readonly commandTimeoutMs: number;
  private rememberedDeviceId: string | null;

  constructor(
    private readonly platform: Platform,
    options: ConnectionOptions = {},
  ) {
    this.scanTimeoutMs = options.scanTimeoutMs ?? 8_000;
    this.commandTimeoutMs = options.commandTimeoutMs ?? 5_000;
    this.rememberedDeviceId = options.rememberedDeviceId ?? null;
  }

  snapshot(): ConnectionSnapshot {
    return {
      state: this.state,
      device: this.device,
      status: this.status,
      lowBattery:
        this.status.batteryPercent !== undefined &&
        this.status.batteryPercent <= LOW_BATTERY_PERCENT &&
        !this.status.charging,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  /**
   * つなぐ。覚えているメガネがあればそれに、無ければ一番近い1台に。
   * 「どれにしますか」を出さないのが要点（迷わせない）。
   */
  async connect(): Promise<GlassesDevice> {
    this.manuallyDisconnected = false;
    if (!(await this.platform.ble.isReady())) {
      this.setState("disconnected");
      throw new SmartGlassError("bluetooth_off");
    }

    this.setState("scanning");
    const found = await this.platform.ble.scan(this.scanTimeoutMs);
    if (found.length === 0) {
      this.setState("disconnected");
      throw new SmartGlassError("not_found");
    }

    const target =
      found.find((d) => d.id === this.rememberedDeviceId) ?? pickStrongest(found);

    this.setState("connecting");
    try {
      await this.platform.ble.connect(target.id);
    } catch (error) {
      this.setState("disconnected");
      throw new SmartGlassError("connect_failed", String(error));
    }

    this.device = target;
    this.rememberedDeviceId = target.id;
    this.reconnectAttempt = 0;
    this.watchDisconnect();
    this.setState("connected");

    // つないだ直後にやっておくと、あとで迷わない。
    await this.syncTime().catch(() => undefined);
    await this.refreshStatus().catch(() => undefined);
    return target;
  }

  /** 利用者が自分で切る。以後、勝手にはつなぎ直さない。 */
  async disconnect(): Promise<void> {
    this.manuallyDisconnected = true;
    this.unsubscribeDisconnect?.();
    this.unsubscribeDisconnect = null;
    await this.platform.ble.disconnect().catch(() => undefined);
    this.device = null;
    this.status = {};
    this.setState("disconnected");
  }

  /** 電池と件数を取り直す。 */
  async refreshStatus(): Promise<DeviceStatus> {
    const reply = await this.request(OpCode.BATTERY);
    const percent = reply ? parseBatteryPayload(reply) : undefined;
    this.status = { ...this.status, ...(percent !== undefined ? { batteryPercent: percent } : {}) };
    this.emit();
    return this.status;
  }

  /** メガネの時計をスマホに合わせる（写真の日付がずれないように）。 */
  async syncTime(): Promise<void> {
    await this.platform.ble.write(
      "command",
      encodeCommand(OpCode.TIME_SYNC, encodeTimeSyncPayload(new Date(this.platform.now()))),
    );
  }

  /** 転送モードにして、Wi-Fi の情報をもらう。 */
  async openWifiTransfer(): Promise<WifiCredentials> {
    const reply = await this.request(OpCode.OPEN_WIFI_TRANSFER);
    const parsed = reply ? parseWifiPayload(reply) : null;
    if (!parsed) throw new SmartGlassError("glasses_not_reachable", "no wifi credentials");
    return parsed;
  }

  /** 転送モードを終える（メガネの電池を守る）。 */
  async closeWifi(): Promise<void> {
    await this.platform.ble.write("command", encodeCommand(OpCode.CLOSE_WIFI)).catch(() => undefined);
  }

  /** 転送中かどうかを画面に伝える。 */
  setTransferring(active: boolean): void {
    if (this.state === "disconnected" || this.state === "scanning" || this.state === "connecting") return;
    this.setState(active ? "transferring" : "connected");
  }

  /** コマンドを1本投げて、同じオペコードの返事を待つ。 */
  private async request(opcode: number): Promise<Uint8Array | null> {
    return new Promise<Uint8Array | null>((resolve) => {
      let settled = false;
      const finish = (value: Uint8Array | null) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        clearTimeout(timer);
        resolve(value);
      };
      const unsubscribe = this.platform.ble.subscribe("notify", (data) => {
        const frame = decodeFrame(data);
        if (frame && frame.opcode === opcode) finish(frame.payload);
      });
      const timer = setTimeout(() => finish(null), this.commandTimeoutMs);
      this.platform.ble
        .write("command", encodeCommand(opcode as never))
        .catch(() => finish(null));
    });
  }

  private watchDisconnect(): void {
    this.unsubscribeDisconnect?.();
    this.unsubscribeDisconnect = this.platform.ble.onDisconnected(() => {
      this.device = null;
      this.status = {};
      this.setState("disconnected");
      if (!this.manuallyDisconnected) void this.scheduleReconnect();
    });
  }

  /** 切れたら、だんだん間をあけながらつなぎ直す。 */
  private async scheduleReconnect(): Promise<void> {
    const delay = RECONNECT_DELAYS_MS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)]!;
    this.reconnectAttempt += 1;
    await sleep(delay);
    if (this.manuallyDisconnected || this.state !== "disconnected") return;
    try {
      await this.connect();
    } catch {
      if (this.reconnectAttempt < RECONNECT_DELAYS_MS.length) void this.scheduleReconnect();
      // これ以上は自動で追わない。画面の「もう一度つなぐ」を押してもらう。
    }
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    this.emit();
  }

  private emit(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}

/** いちばん電波の強い1台。強さが分からないものは最後に回す。 */
export function pickStrongest(devices: GlassesDevice[]): GlassesDevice {
  return [...devices].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999))[0]!;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
