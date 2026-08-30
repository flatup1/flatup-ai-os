/**
 * 困ったときの答えと、はじめての方への案内。
 *
 * 書き方: 質問は利用者の言葉で（「写真が出てこない」）。
 *         答えは番号つきの手順で。1手順=1動作。
 */

export type FaqCategory = "つなぐ" | "写真" | "AI・翻訳" | "設定" | "その他";

export interface FaqEntry {
  id: string;
  category: FaqCategory;
  question: string;
  /** 手順。1行1動作。 */
  steps: string[];
  /** 検索に引っかける言葉（利用者が使いそうな言い方）。 */
  keywords: string[];
}

export const FAQ: FaqEntry[] = [
  {
    id: "connect-fail",
    category: "つなぐ",
    question: "メガネにつながりません",
    steps: [
      "メガネの電源が入っているか確かめてください。",
      "メガネをスマホの近く（1メートル以内）に置いてください。",
      "スマホの設定でBluetoothが入っているか確かめてください。",
      "ホーム画面の「もう一度つなぐ」を押してください。",
    ],
    keywords: ["つながらない", "接続", "ペアリング", "bluetooth", "ブルートゥース"],
  },
  {
    id: "no-photo",
    category: "写真",
    question: "写真が出てきません",
    steps: [
      "ホーム画面が「つながっています」になっているか見てください。",
      "「写真を取り込む」を押してください。",
      "取り込みが終わるまで、メガネをスマホの近くに置いたままにしてください。",
      "終わったら「写真」を押すと、一覧に出ます。",
    ],
    keywords: ["写真", "出てこない", "取り込み", "転送", "同期"],
  },
  {
    id: "transfer-stop",
    category: "写真",
    question: "取り込みが途中で止まりました",
    steps: [
      "取り込めたぶんは消えていません。そのまま残っています。",
      "メガネをスマホの近くに戻してください。",
      "もう一度「写真を取り込む」を押すと、続きから取り込みます。",
    ],
    keywords: ["止まった", "途中", "失敗", "エラー", "続き"],
  },
  {
    id: "save-phone",
    category: "写真",
    question: "スマホの写真アプリに残したい",
    steps: [
      "「写真」を押します。",
      "残したい写真を押して、大きく表示します。",
      "「スマホに保存する」を押します。",
    ],
    keywords: ["保存", "カメラロール", "アルバム", "残す", "ダウンロード"],
  },
  {
    id: "share",
    category: "写真",
    question: "家族に写真を送りたい",
    steps: [
      "「写真」を押して、送りたい写真を押します。",
      "「送る・共有する」を押します。",
      "LINEやメールなど、送りたいアプリを選びます。",
    ],
    keywords: ["共有", "送る", "line", "ライン", "メール", "家族"],
  },
  {
    id: "font-size",
    category: "設定",
    question: "文字が小さくて読めません",
    steps: [
      "「設定」を押します。",
      "「文字の大きさ」で「大」か「特大」を押します。",
      "すぐに画面全体の文字が大きくなります。",
    ],
    keywords: ["文字", "小さい", "見えない", "大きく", "サイズ"],
  },
  {
    id: "voice",
    category: "設定",
    question: "画面を声で読んでほしい",
    steps: [
      "「設定」を押します。",
      "「音声ガイド」を入にします。",
      "画面が変わるたびに、内容を声でお知らせします。",
    ],
    keywords: ["読み上げ", "声", "音声", "しゃべる"],
  },
  {
    id: "battery",
    category: "つなぐ",
    question: "メガネの電池がすぐ減ります",
    steps: [
      "写真を取り込んだあとは、メガネの無線が自動で切れます。そのままで大丈夫です。",
      "使わないときは、メガネをケースに戻して充電してください。",
      "ホーム画面でメガネの電池残量をいつでも確かめられます。",
    ],
    keywords: ["電池", "バッテリー", "減る", "充電"],
  },
  {
    id: "translate",
    category: "AI・翻訳",
    question: "外国の人と話したい",
    steps: [
      "「AI・翻訳」を押します。",
      "「会話の翻訳」を押します。",
      "自分の言葉と相手の言葉を選びます。",
      "話しかけると、画面に大きな文字で訳が出ます。",
    ],
    keywords: ["翻訳", "外国", "英語", "通訳", "会話"],
  },
  {
    id: "privacy",
    category: "AI・翻訳",
    question: "写真や会話は外に送られますか",
    steps: [
      "送りません。はじめの設定では、この端末の中だけでAIを動かします。",
      "インターネットを使うのは、設定で「AIにインターネットを使わせる」を入にしたときだけです。",
      "外へ送るときは、送る前に必ず画面でおたずねします。",
    ],
    keywords: ["プライバシー", "個人情報", "クラウド", "送信", "安全"],
  },
];

/** ことばでさがす。ゆるく当てる（言い方が違っても見つかるように）。 */
export function searchFaq(query: string, entries: FaqEntry[] = FAQ): FaqEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  const terms = q.split(/\s+/).filter(Boolean);

  const scored = entries.map((entry) => {
    const haystack = [entry.question, ...entry.keywords, ...entry.steps].join(" ").toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (entry.question.toLowerCase().includes(term)) score += 3;
      else if (entry.keywords.some((k) => k.toLowerCase().includes(term))) score += 2;
      else if (haystack.includes(term)) score += 1;
    }
    return { entry, score };
  });

  return scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.entry);
}

/** カテゴリごとにまとめる（一覧の見出しに使う）。 */
export function faqByCategory(entries: FaqEntry[] = FAQ): { category: FaqCategory; entries: FaqEntry[] }[] {
  const order: FaqCategory[] = ["つなぐ", "写真", "AI・翻訳", "設定", "その他"];
  return order
    .map((category) => ({ category, entries: entries.filter((e) => e.category === category) }))
    .filter((group) => group.entries.length > 0);
}

/** はじめての方へ。1画面1動作。5分で「写真を見る」まで行けるように。 */
export interface TutorialStep {
  title: string;
  body: string;
  /** その画面で押すボタン。 */
  action?: string;
}

export const TUTORIAL: TutorialStep[] = [
  {
    title: "はじめまして",
    body: "このアプリで、メガネで撮った写真をスマホに取り込めます。3つの手順で終わります。",
    action: "はじめる",
  },
  {
    title: "① メガネの電源を入れる",
    body: "メガネの電源を入れて、スマホの近くに置いてください。",
    action: "できました",
  },
  {
    title: "② 「メガネにつなぐ」を押す",
    body: "大きな青いボタンです。画面の上が「つながっています」になれば成功です。",
    action: "つないでみる",
  },
  {
    title: "③ 「写真を取り込む」を押す",
    body: "メガネの中の写真がスマホに入ります。終わるまで、メガネを近くに置いたままにしてください。",
    action: "取り込んでみる",
  },
  {
    title: "写真を見る",
    body: "下の「写真」を押すと、取り込んだ写真が並びます。押すと大きく表示できます。",
    action: "おわり",
  },
];
