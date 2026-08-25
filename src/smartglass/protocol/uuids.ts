/**
 * BLE の識別子と、その出どころ。
 *
 * ⚠ここは推測で書かない。出どころのないUUIDは足さないこと。
 * 出どころ:
 *  - ebowwa/HeyCyanSmartGlassesSDK（README / WIFI_TRANSFER_ARCHITECTURE.md）
 *  - FerSaiyan/Alternative-HeyCyan-App-and-SDK（CyanBridge の転送手順）
 * 詳しくは docs/smartglass_protocol.md。
 */

/** 主サービス。HeyCyan系グラスはこれを広告する。 */
export const PRIMARY_SERVICE_UUID = "7905FFF0-B5CE-4E99-A40F-4B1E122D00D0";

/** 副サービス（機種・ファーム世代によってはこちらだけ出る）。 */
export const SECONDARY_SERVICE_UUID = "6e40fff0-b5a3-f393-e0a9-e50e24dcca9e";

/**
 * スキャン時に見るサービス。どちらか一方しか広告しない個体があるので両方見る。
 */
export const SCAN_SERVICE_UUIDS = [PRIMARY_SERVICE_UUID, SECONDARY_SERVICE_UUID];

/**
 * 特性（キャラクタリスティック）の役割。
 * UUID そのものはベンダーAAR/QCSDK.framework 側に隠れており、機種差もあるため
 * 「役割」で持ち、実際の UUID 解決は BleAdapter の実装に任せる。
 */
export type CharacteristicRole =
  /** アプリ → グラス。コマンドを書く。 */
  | "command"
  /** グラス → アプリ。応答・状態通知を受ける。 */
  | "notify"
  /** グラス → アプリ。AI画像などの大きなデータを分割で受ける。 */
  | "data";

/** UUID の表記ゆれ（大文字小文字・16bit短縮）を吸収して比べる。 */
export function isSameUuid(a: string, b: string): boolean {
  return normalizeUuid(a) === normalizeUuid(b);
}

/** 16bit 短縮形（"fff0"）を 128bit のベースUUIDへ展開して正規化する。 */
export function normalizeUuid(uuid: string): string {
  const raw = uuid.trim().toLowerCase().replace(/[{}]/g, "");
  if (/^0x[0-9a-f]{4}$/.test(raw)) return expandShortUuid(raw.slice(2));
  if (/^[0-9a-f]{4}$/.test(raw)) return expandShortUuid(raw);
  return raw;
}

function expandShortUuid(short: string): string {
  return `0000${short}-0000-1000-8000-00805f9b34fb`;
}
