/**
 * 画面に出す言葉。ここ以外に日本語を直接書かない。
 *
 * 書き方の約束（3つだけ）:
 *  1. 専門用語を使わない（BLE→「無線」、ペアリング→「つなぐ」）。
 *  2. ボタンは「動詞」で終える（「写真を取り込む」）。
 *  3. エラーは「何が起きたか」＋「次にどうするか」の2文で書く。
 */

export const T = {
  app: {
    name: "スマートグラス",
    tabHome: "ホーム",
    tabGallery: "写真",
    tabAi: "AI・翻訳",
    tabSettings: "設定",
  },

  connection: {
    disconnected: "つながっていません",
    scanning: "メガネをさがしています",
    connecting: "つないでいます",
    connected: "つながっています",
    transferring: "写真を取り込んでいます",
    connect: "メガネにつなぐ",
    retry: "もう一度つなぐ",
    disconnect: "接続をやめる",
    hintPowerOn: "メガネの電源を入れて、近くに置いてください。",
    batteryLabel: "メガネの電池",
    batteryUnknown: "電池：わかりません",
    batteryLow: "電池が少なくなっています。充電してください。",
  },

  transfer: {
    start: "写真を取り込む",
    startShort: "取り込む",
    none: "新しい写真はありません",
    preparing: "じゅんびしています",
    joiningWifi: "メガネの無線につないでいます",
    reading: "写真の一覧を読んでいます",
    done: "取り込みが終わりました",
    doneWithFailures: "いくつか取り込めませんでした",
    retryFailed: "取り込めなかったぶんを、もう一度取り込む",
    /** 「3枚中1枚 取り込み中」。 */
    progress: (done: number, total: number) => `${total}枚中${done}枚 取り込みました`,
    autoOn: "つないだら自動で取り込みます",
  },

  gallery: {
    title: "写真",
    empty: "まだ写真がありません。メガネで撮って、取り込んでください。",
    saveToPhone: "スマホに保存する",
    saved: "スマホに保存しました",
    share: "送る・共有する",
    delete: "削除する",
    today: "きょう",
    yesterday: "きのう",
    photo: "写真",
    video: "動画",
    audio: "録音",
  },

  ai: {
    title: "AI・翻訳",
    assistant: "AIにきく",
    ask: "質問する",
    speak: "声で話す",
    listening: "聞いています。どうぞお話しください。",
    thinking: "考えています",
    readAloud: "読み上げる",
    stopReading: "読み上げをやめる",
    shortcutWeather: "今日の天気は？",
    shortcutWhatIsThis: "これは何？",
    shortcutTime: "いま何時？",
    shortcutHowToUse: "このメガネの使い方",
    translate: "翻訳する",
    translateTitle: "会話の翻訳",
    interpretTitle: "同時通訳",
    myLanguage: "自分の言葉",
    theirLanguage: "相手の言葉",
    swap: "入れかえる",
    historyTitle: "翻訳の記録",
    vision: "これは何？",
    visionPick: "写真をえらぶ",
    visionRunning: "写真を見ています",
    localOnly: "この処理は、この端末の中だけで行います。",
    cloudNotice: "インターネットに送ってよいときだけ、クラウドを使います。",
  },

  settings: {
    title: "設定",
    fontSize: "文字の大きさ",
    fontSmall: "小",
    fontMedium: "中",
    fontLarge: "大",
    fontXLarge: "特大",
    voiceGuide: "音声ガイド",
    voiceGuideHint: "画面の内容を声でも知らせます。",
    autoTransfer: "自動で取り込む",
    autoTransferHint: "メガネにつながったら、新しい写真をひとりでに取り込みます。",
    autoSave: "スマホの写真アプリにも保存する",
    allowCloudAi: "AIにインターネットを使わせる",
    allowCloudAiHint: "切っておくと、この端末の中だけでAIを動かします。",
    tutorial: "はじめての方へ",
    help: "困ったときは",
    feedback: "ご意見・不具合を送る",
    version: "バージョン",
  },

  help: {
    searchPlaceholder: "知りたいことを入れてください",
    noResult: "見つかりませんでした。ちがう言葉でさがしてみてください。",
  },

  common: {
    ok: "はい",
    cancel: "やめる",
    next: "つぎへ",
    back: "もどる",
    close: "とじる",
    done: "できました",
    loading: "よみこんでいます",
  },
} as const;

/** 日付を「きょう / きのう / 8月25日」にする。 */
export function friendlyDate(timestamp: number, now: number = Date.now()): string {
  const d = new Date(timestamp);
  const today = startOfDay(now);
  const target = startOfDay(timestamp);
  const dayDiff = Math.round((today - target) / 86_400_000);
  if (dayDiff === 0) return T.gallery.today;
  if (dayDiff === 1) return T.gallery.yesterday;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** バイト数を「12.3 MB」にする。 */
export function friendlySize(bytes: number): string {
  if (bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}
