/**
 * AIスマートグラス コンパニオン — 共通の型。
 *
 * ここは「画面」にも「通信」にも依存しない、いちばん内側の言葉の定義。
 * 依存ゼロ（Node 標準のみ）。
 */

/** グラスとの接続の状態。画面にはこの5つしか出さない（迷わせないため）。 */
export type ConnectionState =
  | "disconnected" // つながっていません
  | "scanning" // さがしています
  | "connecting" // つないでいます
  | "connected" // つながっています
  | "transferring"; // 写真を取り込んでいます

/** 見つかったグラス。 */
export interface GlassesDevice {
  /** BLE の識別子（Android: MAC / iOS: UUID）。 */
  id: string;
  /** 画面に出す名前。例: "FLATUP Glasses"。 */
  name: string;
  /** 電波の強さ（dBm）。近いほど 0 に近い。 */
  rssi?: number;
}

/** グラスの状態（BLE で定期的に取得する）。 */
export interface DeviceStatus {
  /** 電池残量 0-100。取れないときは undefined。 */
  batteryPercent?: number;
  /** 充電中かどうか。 */
  charging?: boolean;
  /** グラス内に残っているメディアの数。 */
  mediaCount?: number;
  /** 空き容量（バイト）。 */
  freeBytes?: number;
}

export type MediaKind = "photo" | "video" | "audio";

/** 1件のメディア。グラス上にあるものも、取り込み済みのものも同じ型で扱う。 */
export interface MediaItem {
  /** アプリ内で一意。ファイル名 + サイズから作る（重複取り込み防止）。 */
  id: string;
  /** グラス上のファイル名。例: "IMG_20260825_101500.jpg"。 */
  fileName: string;
  kind: MediaKind;
  /** バイト数。分からないときは 0。 */
  sizeBytes: number;
  /** 撮影時刻（epoch ミリ秒）。分からないときは取り込み時刻。 */
  takenAt: number;
  /** 動画・音声の長さ（秒）。 */
  durationSec?: number;
  /** 端末内の保存先パス。取り込み前は undefined。 */
  localPath?: string;
  /** サムネイルのパス。 */
  thumbnailPath?: string;
  /** カメラロールへ保存済みか。 */
  savedToCameraRoll?: boolean;
}

/** 1件ぶんの転送の進み具合。 */
export interface TransferItemProgress {
  item: MediaItem;
  receivedBytes: number;
  status: "waiting" | "downloading" | "done" | "failed";
  /** 失敗した回数（リトライ判断に使う）。 */
  attempts: number;
  /** 最後の失敗理由（やさしい日本語ではなく内部用）。 */
  lastError?: string;
}

/** 転送全体の進み具合。画面はこれをそのまま出せばよい。 */
export interface TransferProgress {
  /** 全体の件数。 */
  total: number;
  /** 取り込みが終わった件数。 */
  completed: number;
  /** 失敗して残っている件数。 */
  failed: number;
  /** 0-1。件数ではなくバイト基準（大きな動画で進捗が止まって見えないように）。 */
  ratio: number;
  /** 「3枚中1枚 取り込み中」のような、そのまま出せる文。 */
  message: string;
  /** いま取り込んでいるファイル名。 */
  currentFileName?: string;
}

/** グラスの Wi-Fi 情報（BLE 経由で受け取る）。 */
export interface WifiCredentials {
  ssid: string;
  password: string;
}

/** 文字サイズ。デフォルトは "large"（高齢の方にそのまま渡せるように）。 */
export type FontScaleName = "small" | "medium" | "large" | "xlarge";

/** アプリの設定。 */
export interface AppSettings {
  fontScale: FontScaleName;
  /** 音声ガイド（読み上げ）を使うか。 */
  voiceGuide: boolean;
  /** つないだら自動で取り込むか。 */
  autoTransfer: boolean;
  /** 取り込んだらカメラロールにも保存するか。 */
  autoSaveToCameraRoll: boolean;
  /** AI をクラウドに送ってよいか（既定は false = 端末内だけ）。 */
  allowCloudAi: boolean;
  /** 翻訳でよく使う言語（上に固定して出す）。 */
  favoriteLanguages: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontScale: "large",
  voiceGuide: true,
  autoTransfer: true,
  autoSaveToCameraRoll: false,
  allowCloudAi: false,
  favoriteLanguages: ["ja", "en"],
};
