/**
 * アプリの本体。画面はここだけを見ればよい。
 *
 * 画面から呼ぶのは、ほぼこの4つ:
 *   app.connect() / app.importMedia() / app.home() / app.settings.setFontScale()
 *
 * ここに集めておくと、iOS版とAndroid版で作りが分かれない。
 */

import { Assistant } from "./ai/assistant.js";
import type { AiProvider } from "./ai/provider.js";
import { Translator } from "./ai/translate.js";
import { VisionAssistant } from "./ai/vision.js";
import { ConnectionManager, type ConnectionSnapshot } from "./device/connection.js";
import { asFriendly, type FriendlyError } from "./errors.js";
import { GalleryStore } from "./gallery/store.js";
import { T } from "./i18n.js";
import type { Platform } from "./platform.js";
import { SettingsStore } from "./settings.js";
import { TransferManager } from "./transfer/manager.js";
import { fontSize, tapTargetHeight, PRIMARY_BUTTON_HEIGHT_DP } from "./ui/tokens.js";
import type { AppSettings, MediaItem, TransferProgress } from "./types.js";

/** ホーム画面に出すもの、ぜんぶ。画面はこれをそのまま並べる。 */
export interface HomeView {
  /** 「つながっています」など。 */
  statusText: string;
  /** 状態を表す色の役割（色だけに頼らず statusText も必ず出す）。 */
  statusTone: "ok" | "warn" | "error" | "idle";
  /** 「メガネの電池 82%」。取れないときは undefined。 */
  batteryText?: string;
  batteryWarning?: string;
  /** 主役のボタン（画面にひとつだけ）。 */
  primaryAction: { label: string; kind: "connect" | "import" | "retry"; enabled: boolean; heightDp: number };
  /** 取り込み中だけ出す。 */
  progress?: TransferProgress;
  /** 直近の写真（4枚まで）。 */
  recent: MediaItem[];
  /** 取り込めずに残っているもの。 */
  pendingCount: number;
  /** 出ているエラー。 */
  error?: FriendlyError;
  /** 文字の大きさ（画面はこれを使う）。 */
  fontSizes: { title: number; body: number; button: number; status: number; caption: number };
}

export interface SmartGlassAppOptions {
  localAi?: AiProvider | null;
  cloudAi?: AiProvider | null;
}

type Listener = (view: HomeView) => void;

export class SmartGlassApp {
  readonly settings: SettingsStore;
  readonly gallery: GalleryStore;
  readonly connection: ConnectionManager;
  readonly transfer: TransferManager;
  readonly assistant: Assistant;
  readonly translator: Translator;
  readonly vision: VisionAssistant;

  private connectionSnapshot: ConnectionSnapshot = {
    state: "disconnected",
    device: null,
    status: {},
    lowBattery: false,
  };
  private progress: TransferProgress | null = null;
  private lastError: FriendlyError | null = null;
  private listeners = new Set<Listener>();
  /** 自動取り込みを、同じ接続で何度も走らせないための印。 */
  private autoTransferDoneFor: string | null = null;

  constructor(
    private readonly platform: Platform,
    options: SmartGlassAppOptions = {},
  ) {
    this.settings = new SettingsStore(platform.storage);
    this.gallery = new GalleryStore(platform.storage);
    this.connection = new ConnectionManager(platform);
    this.transfer = new TransferManager(platform, this.connection);

    const allowCloud = () => this.settings.get().allowCloudAi;
    const local = options.localAi ?? null;
    const cloud = options.cloudAi ?? null;
    this.assistant = new Assistant(local, cloud, { allowCloud });
    this.translator = new Translator(local, cloud, platform.speech, { allowCloud, now: () => platform.now() });
    this.vision = new VisionAssistant(local, cloud, { allowCloud });

    this.connection.subscribe((snapshot) => {
      const wasConnected = this.connectionSnapshot.state === "connected";
      this.connectionSnapshot = snapshot;
      this.emit();
      // つながった瞬間に、設定が入っていれば自動で取り込む。
      if (!wasConnected && snapshot.state === "connected") void this.maybeAutoTransfer();
    });

    this.transfer.subscribe((progress) => {
      this.progress = this.transfer.isRunning() ? progress : null;
      this.emit();
    });
  }

  /** 起動時に一度。設定と目録を読む。 */
  async start(): Promise<void> {
    await this.settings.load();
    await this.gallery.load();
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.home());
    return () => this.listeners.delete(listener);
  }

  /** つなぐ。失敗しても例外を投げず、やさしいエラーを画面に出す。 */
  async connect(): Promise<boolean> {
    this.lastError = null;
    this.emit();
    try {
      await this.connection.connect();
      return true;
    } catch (error) {
      this.lastError = asFriendly(error);
      this.emit();
      return false;
    }
  }

  /** 写真を取り込む。押しっぱなし・連打でも壊れない。 */
  async importMedia(): Promise<{ added: number; failed: number }> {
    if (this.transfer.isRunning()) return { added: 0, failed: 0 };
    this.lastError = null;
    try {
      const result = await this.transfer.run(this.gallery.knownIds());
      await this.gallery.add(result.completed);
      await this.gallery.setPending(result.failed);

      if (this.settings.get().autoSaveToCameraRoll) {
        for (const item of result.completed) {
          await this.gallery.saveToCameraRoll(item.id).catch(() => undefined);
        }
      }
      if (result.failed.length > 0) this.lastError = asFriendly(new Error("download_failed"));
      this.emit();
      return { added: result.completed.length, failed: result.failed.length };
    } catch (error) {
      this.lastError = asFriendly(error);
      this.emit();
      return { added: 0, failed: 0 };
    }
  }

  /** 取り込めなかったぶんを、もう一度。 */
  async retryFailed(): Promise<{ added: number; failed: number }> {
    this.transfer.retryFailed();
    return this.importMedia();
  }

  /** 音声ガイドが入なら読み上げる。切なら何もしない。 */
  async speak(text: string): Promise<void> {
    if (!this.settings.get().voiceGuide) return;
    await this.platform.speech.speak(text).catch(() => undefined);
  }

  dismissError(): void {
    this.lastError = null;
    this.emit();
  }

  /** ホーム画面に出すものを組み立てる。 */
  home(): HomeView {
    const settings: AppSettings = this.settings.get();
    const scale = settings.fontScale;
    const { state, status, lowBattery } = this.connectionSnapshot;

    const view: HomeView = {
      statusText: statusTextOf(state),
      statusTone: toneOf(state, lowBattery),
      primaryAction: this.primaryAction(),
      recent: this.gallery.all().slice(0, 4),
      pendingCount: this.gallery.pendingItems().length,
      fontSizes: {
        title: fontSize("title", scale),
        body: fontSize("body", scale),
        button: fontSize("button", scale),
        status: fontSize("status", scale),
        caption: fontSize("caption", scale),
      },
    };

    if (status.batteryPercent !== undefined) {
      view.batteryText = `${T.connection.batteryLabel} ${status.batteryPercent}%`;
      if (lowBattery) view.batteryWarning = T.connection.batteryLow;
    }
    if (this.progress) view.progress = this.progress;
    if (this.lastError) view.error = this.lastError;
    return view;
  }

  /**
   * 主役のボタンはいつも1つだけ。
   * つながっていなければ「つなぐ」、つながっていれば「取り込む」。
   * これで「どれを押せばいいのか」が消える。
   */
  private primaryAction(): HomeView["primaryAction"] {
    const scale = this.settings.get().fontScale;
    const heightDp = tapTargetHeight(scale, PRIMARY_BUTTON_HEIGHT_DP);
    const { state } = this.connectionSnapshot;

    if (state === "connected") {
      if (this.gallery.pendingItems().length > 0) {
        return { label: T.transfer.retryFailed, kind: "retry", enabled: true, heightDp };
      }
      return { label: T.transfer.start, kind: "import", enabled: true, heightDp };
    }
    if (state === "transferring") {
      return { label: T.transfer.start, kind: "import", enabled: false, heightDp };
    }
    if (state === "scanning" || state === "connecting") {
      return { label: T.connection.connect, kind: "connect", enabled: false, heightDp };
    }
    return {
      label: this.lastError ? T.connection.retry : T.connection.connect,
      kind: "connect",
      enabled: true,
      heightDp,
    };
  }

  /** つながったら、設定に従って自動で取り込む。 */
  private async maybeAutoTransfer(): Promise<void> {
    if (!this.settings.get().autoTransfer) return;
    const deviceId = this.connectionSnapshot.device?.id ?? null;
    if (deviceId && this.autoTransferDoneFor === deviceId) return;
    this.autoTransferDoneFor = deviceId;
    await this.importMedia();
  }

  private emit(): void {
    const view = this.home();
    for (const listener of this.listeners) listener(view);
  }
}

function statusTextOf(state: ConnectionSnapshot["state"]): string {
  switch (state) {
    case "connected":
      return T.connection.connected;
    case "connecting":
      return T.connection.connecting;
    case "scanning":
      return T.connection.scanning;
    case "transferring":
      return T.connection.transferring;
    default:
      return T.connection.disconnected;
  }
}

function toneOf(state: ConnectionSnapshot["state"], lowBattery: boolean): HomeView["statusTone"] {
  if (state === "connected" || state === "transferring") return lowBattery ? "warn" : "ok";
  if (state === "scanning" || state === "connecting") return "idle";
  return "error";
}
