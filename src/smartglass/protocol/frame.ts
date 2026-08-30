/**
 * グラスへ送るコマンドの組み立てと、返事の読み取り。
 *
 * フレーム構成（QCSDK系の公開情報にもとづく）:
 *   [0]     ヘッダ 0xAB（固定）
 *   [1]     オペコード
 *   [2]     ペイロード長 (0-255)
 *   [3..]   ペイロード
 *   [末尾]  チェックサム = オペコード〜ペイロードの総和の下位8bit
 *
 * ⚠機種・ファームによって差がある領域。実機で確認できるまで
 *   「この形で組み立て、違ったらここだけ直す」ための一枚にしている。
 */

export const FRAME_HEADER = 0xab;

/** オペコード。名前は QCSDK の QCOperatorDeviceMode* に合わせてある。 */
export const OpCode = {
  /** 写真を1枚撮る。 */
  PHOTO: 0x01,
  /** 動画の撮影を始める。 */
  VIDEO_START: 0x02,
  /** 動画の撮影を止める。 */
  VIDEO_STOP: 0x03,
  /** 録音を始める。 */
  AUDIO_START: 0x04,
  /** 録音を止める。 */
  AUDIO_STOP: 0x05,
  /** AI画像の生成を頼む。 */
  AI_PHOTO: 0x06,
  /** 電池残量をたずねる。 */
  BATTERY: 0x10,
  /** メディアの件数をたずねる。 */
  MEDIA_COUNT: 0x11,
  /** 時刻を合わせる。 */
  TIME_SYNC: 0x12,
  /** 転送モードにして、Wi-Fi の SSID とパスワードをもらう。 */
  OPEN_WIFI_TRANSFER: 0x20,
  /** 転送モードを終える（Wi-Fi を落とす）。 */
  CLOSE_WIFI: 0x21,
} as const;

export type OpCodeValue = (typeof OpCode)[keyof typeof OpCode];

/** チェックサム（オペコード〜ペイロードの総和の下位8bit）。 */
export function checksum(opcode: number, payload: Uint8Array): number {
  let sum = opcode + payload.length;
  for (const b of payload) sum += b;
  return sum & 0xff;
}

/** コマンドを1本のバイト列にする。 */
export function encodeCommand(opcode: OpCodeValue, payload: Uint8Array = new Uint8Array(0)): Uint8Array {
  if (payload.length > 255) {
    throw new Error(`payload too long: ${payload.length} (max 255)`);
  }
  const frame = new Uint8Array(4 + payload.length);
  frame[0] = FRAME_HEADER;
  frame[1] = opcode;
  frame[2] = payload.length;
  frame.set(payload, 3);
  frame[3 + payload.length] = checksum(opcode, payload);
  return frame;
}

export interface DecodedFrame {
  opcode: number;
  payload: Uint8Array;
}

/**
 * グラスからの返事を読む。壊れていたら null（例外にしない）。
 * BLE の通知は途中で切れることがあるので、呼ぶ側は null を「まだ揃っていない」
 * として扱ってよい。
 */
export function decodeFrame(bytes: Uint8Array): DecodedFrame | null {
  if (bytes.length < 4) return null;
  if (bytes[0] !== FRAME_HEADER) return null;
  const opcode = bytes[1]!;
  const length = bytes[2]!;
  if (bytes.length < 4 + length) return null;
  const payload = bytes.slice(3, 3 + length);
  const expected = checksum(opcode, payload);
  if (bytes[3 + length] !== expected) return null;
  return { opcode, payload };
}

/** 時刻合わせのペイロード（年下2桁, 月, 日, 時, 分, 秒）。 */
export function encodeTimeSyncPayload(date: Date): Uint8Array {
  return new Uint8Array([
    date.getFullYear() % 100,
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ]);
}

/** 電池の返事を読む（先頭バイトが％）。 */
export function parseBatteryPayload(payload: Uint8Array): number | undefined {
  if (payload.length < 1) return undefined;
  const percent = payload[0]!;
  return percent <= 100 ? percent : undefined;
}

/**
 * 転送モードの返事から SSID とパスワードを取り出す。
 * 形式: "<ssid>\0<password>" または "<ssid>,<password>"。
 * パスワードが無いときは既定値 "123456789"（HeyCyan の既定）を使う。
 */
export const DEFAULT_WIFI_PASSWORD = "123456789";

export function parseWifiPayload(payload: Uint8Array): { ssid: string; password: string } | null {
  const text = new TextDecoder().decode(payload).replace(/\0+$/, "");
  if (!text) return null;
  const parts = text.split(/[\0,]/).filter((p) => p.length > 0);
  const ssid = parts[0];
  if (!ssid) return null;
  return { ssid, password: parts[1] ?? DEFAULT_WIFI_PASSWORD };
}
