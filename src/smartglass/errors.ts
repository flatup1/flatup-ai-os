/**
 * つまずいたときの言葉。
 *
 * 決まり:
 *  - 「何が起きたか」と「次にどうするか」を必ず分けて持つ。
 *  - 責める書き方をしない（「〜してください」で終える）。
 *  - 直せる操作があるときは action を付ける（画面の大きなボタンになる）。
 */

export type AppErrorCode =
  | "bluetooth_off"
  | "bluetooth_permission"
  | "not_found"
  | "connect_failed"
  | "connection_lost"
  | "wifi_join_failed"
  | "wifi_permission"
  | "glasses_not_reachable"
  | "manifest_failed"
  | "download_failed"
  | "storage_full"
  | "camera_roll_permission"
  | "ai_offline"
  | "ai_failed"
  | "unknown";

/** 画面がそのまま出せる、やさしいエラー。 */
export interface FriendlyError {
  code: AppErrorCode;
  /** 何が起きたか。 */
  what: string;
  /** 次にどうするか。 */
  next: string;
  /** 押せるボタンの名前。無ければ「とじる」だけ出す。 */
  action?: string;
  /** もう一度やれば直る見込みがあるか。 */
  retryable: boolean;
}

const TABLE: Record<AppErrorCode, Omit<FriendlyError, "code">> = {
  bluetooth_off: {
    what: "スマホのBluetoothが切れています。",
    next: "設定でBluetoothを入れてから、もう一度おためしください。",
    action: "もう一度つなぐ",
    retryable: true,
  },
  bluetooth_permission: {
    what: "このアプリが近くの機器をさがす許可を持っていません。",
    next: "スマホの設定で、このアプリに許可を出してください。",
    action: "設定をひらく",
    retryable: true,
  },
  not_found: {
    what: "近くにメガネが見つかりませんでした。",
    next: "メガネの電源を入れて、スマホの近く（1メートル以内）に置いてください。",
    action: "もう一度さがす",
    retryable: true,
  },
  connect_failed: {
    what: "メガネにつなげませんでした。",
    next: "メガネの電源を入れ直して、もう一度おためしください。",
    action: "もう一度つなぐ",
    retryable: true,
  },
  connection_lost: {
    what: "メガネとの接続が切れました。",
    next: "メガネを近づけると、ひとりでにつなぎ直します。",
    action: "もう一度つなぐ",
    retryable: true,
  },
  wifi_join_failed: {
    what: "メガネの無線につなげませんでした。",
    next: "スマホのWi-Fiを入れて、もう一度「写真を取り込む」を押してください。",
    action: "もう一度取り込む",
    retryable: true,
  },
  wifi_permission: {
    what: "Wi-Fiにつなぐ許可がありません。",
    next: "スマホの設定で、このアプリにWi-Fiの許可を出してください。",
    action: "設定をひらく",
    retryable: true,
  },
  glasses_not_reachable: {
    what: "メガネの無線には入れましたが、メガネが応答しません。",
    next: "メガネを近づけて、もう一度「写真を取り込む」を押してください。",
    action: "もう一度取り込む",
    retryable: true,
  },
  manifest_failed: {
    what: "メガネの中の写真の一覧を読めませんでした。",
    next: "少し待ってから、もう一度おためしください。",
    action: "もう一度取り込む",
    retryable: true,
  },
  download_failed: {
    what: "写真の取り込みが途中で止まりました。",
    next: "取り込めたぶんは残っています。もう一度押すと、続きから取り込みます。",
    action: "続きから取り込む",
    retryable: true,
  },
  storage_full: {
    what: "スマホの空き容量が足りません。",
    next: "いらない写真やアプリを消してから、もう一度おためしください。",
    retryable: false,
  },
  camera_roll_permission: {
    what: "スマホの写真アプリへ保存する許可がありません。",
    next: "スマホの設定で、このアプリに写真の許可を出してください。",
    action: "設定をひらく",
    retryable: true,
  },
  ai_offline: {
    what: "インターネットにつながっていません。",
    next: "この端末の中だけでできることは、そのまま使えます。",
    retryable: true,
  },
  ai_failed: {
    what: "AIの返事を用意できませんでした。",
    next: "もう一度、短い言葉でたずねてみてください。",
    action: "もう一度きく",
    retryable: true,
  },
  unknown: {
    what: "うまくいきませんでした。",
    next: "もう一度おためしください。直らないときは、設定の「ご意見・不具合を送る」からお知らせください。",
    action: "もう一度",
    retryable: true,
  },
};

/** 内部エラーを、画面に出せる形にする。 */
export function toFriendlyError(code: AppErrorCode): FriendlyError {
  return { code, ...TABLE[code] };
}

/** core の中で投げる例外。code を持たせて、画面側で言い換える。 */
export class SmartGlassError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "SmartGlassError";
    this.code = code;
  }

  toFriendly(): FriendlyError {
    return toFriendlyError(this.code);
  }
}

/** 何が飛んできても FriendlyError にする（画面が落ちないように）。 */
export function asFriendly(error: unknown): FriendlyError {
  if (error instanceof SmartGlassError) return error.toFriendly();
  return toFriendlyError("unknown");
}
