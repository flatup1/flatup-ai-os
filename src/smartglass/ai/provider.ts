/**
 * AI の差し込み口。
 *
 * 方針は「端末の中だけ」が既定。クラウドは設定で明示的に許したときだけ。
 * 個人の写真と会話を、黙って外へ出さない。
 */

export interface AiMessage {
  role: "user" | "assistant";
  text: string;
}

export interface AiReply {
  text: string;
  /** どこで考えたか。画面に必ず出す（利用者が分かるように）。 */
  source: "local" | "cloud";
}

export interface TranslationResult {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  source: "local" | "cloud";
}

export interface VisionResult {
  /** 「これは何？」の答え。ひと言で。 */
  headline: string;
  /** 補足。1〜3行。 */
  details: string[];
  source: "local" | "cloud";
}

/** 端末の中で動く AI（オンデバイス）。無い端末では null を返してよい。 */
export interface AiProvider {
  readonly kind: "local" | "cloud";
  /** いま使えるか（モデル未取得・圏外など）。 */
  available(): Promise<boolean>;
  chat(messages: AiMessage[]): Promise<AiReply>;
  translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult>;
  describeImage(imagePath: string): Promise<VisionResult>;
}
