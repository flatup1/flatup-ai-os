/**
 * 端末まわりの「差し込み口」。
 *
 * ここを iOS / Android / テスト用モック でそれぞれ実装する。
 * core（この下の層）は OS を一切知らない＝テストが実機なしで回る。
 */

import type { CharacteristicRole } from "./protocol/uuids.js";
import type { GlassesDevice, WifiCredentials } from "./types.js";

/** BLE。スキャンと接続、コマンドの読み書き。 */
export interface BleAdapter {
  /** Bluetooth が使える状態か（電源オフ・権限なしは false）。 */
  isReady(): Promise<boolean>;
  /** 近くのグラスをさがす。timeoutMs で自動的に止まる。 */
  scan(timeoutMs: number): Promise<GlassesDevice[]>;
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  /** つながっているか。 */
  isConnected(): boolean;
  /** コマンドを書く。 */
  write(role: CharacteristicRole, data: Uint8Array): Promise<void>;
  /** 通知を受け取る。戻り値を呼ぶと解除。 */
  subscribe(role: CharacteristicRole, listener: (data: Uint8Array) => void): () => void;
  /** 接続が切れたときに呼ばれる。戻り値を呼ぶと解除。 */
  onDisconnected(listener: () => void): () => void;
}

/**
 * Wi-Fi。
 *  - Android: Wi-Fi Direct（グラスがグループオーナー）
 *  - iOS:     NEHotspotConfiguration で通常のAPに joinOnce で入る
 * どちらも「SSIDとパスワードを渡すと、グラスに届くネットワークに入る」だけを約束する。
 */
export interface WifiAdapter {
  /** グラスのネットワークに入る。入れたら true。 */
  join(credentials: WifiCredentials): Promise<boolean>;
  /** 抜ける。元の Wi-Fi に戻す。 */
  leave(): Promise<void>;
  /**
   * グラスのIPを見つける。分かっているなら候補を返すだけでよい。
   * 実装が空配列を返したら core 側が既定の候補を総当たりする。
   */
  candidateHosts(): Promise<string[]>;
}

export interface HttpResponse {
  status: number;
  /** 本文（テキスト）。 */
  text: string;
}

/** HTTP。グラスの簡易サーバから一覧とファイルを取る。 */
export interface HttpAdapter {
  /** テキストを取る（一覧の取得と、IPの生存確認に使う）。 */
  get(url: string, timeoutMs: number): Promise<HttpResponse>;
  /**
   * ファイルを端末に落とす。落とせたら保存先パスを返す。
   * onProgress は受信バイト数。Range 再開に対応できるなら fromByte を使う。
   */
  download(
    url: string,
    destPath: string,
    options: { timeoutMs: number; fromByte?: number; onProgress?: (receivedBytes: number, totalBytes: number) => void },
  ): Promise<{ path: string; sizeBytes: number }>;
}

/** 端末のファイル置き場と、カメラロール。 */
export interface StorageAdapter {
  /** 取り込んだメディアを置くディレクトリ。 */
  mediaDir(): string;
  exists(path: string): Promise<boolean>;
  sizeOf(path: string): Promise<number>;
  remove(path: string): Promise<void>;
  /** 小さな JSON を覚えておく（ギャラリー目録・設定・未転送リスト）。 */
  readJson<T>(key: string): Promise<T | null>;
  writeJson(key: string, value: unknown): Promise<void>;
  /** 端末の写真アプリへ保存する。 */
  saveToCameraRoll(path: string): Promise<void>;
}

/** 読み上げ（音声ガイド）。 */
export interface SpeechAdapter {
  speak(text: string): Promise<void>;
  stop(): Promise<void>;
  /** マイクで聞き取る。lang は "ja-JP" など。 */
  listen(lang: string, timeoutMs: number): Promise<string>;
}

/** すべての差し込み口。 */
export interface Platform {
  ble: BleAdapter;
  wifi: WifiAdapter;
  http: HttpAdapter;
  storage: StorageAdapter;
  speech: SpeechAdapter;
  /** "ios" | "android"。転送のやり方の分岐に使う。 */
  os: "ios" | "android";
  /** いまの時刻（テストで固定できるように）。 */
  now(): number;
}
