/**
 * 会話の翻訳と、同時通訳。
 *
 * 会話モード: 自分の言葉 ↔ 相手の言葉。押すたびに向きが決まっている（迷わない）。
 * 通訳モード: 聞こえたものを、切れ目ごとに次々と訳して出す。
 */

import { SmartGlassError } from "../errors.js";
import type { SpeechAdapter } from "../platform.js";
import type { AiProvider, TranslationResult } from "./provider.js";

/** よく使う言語。国旗と日本語名を持つ（アイコンだけにしない）。 */
export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
  /** 音声認識に渡すロケール。 */
  locale: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "ja", label: "日本語", flag: "🇯🇵", locale: "ja-JP" },
  { code: "en", label: "英語", flag: "🇺🇸", locale: "en-US" },
  { code: "zh", label: "中国語", flag: "🇨🇳", locale: "zh-CN" },
  { code: "ko", label: "韓国語", flag: "🇰🇷", locale: "ko-KR" },
  { code: "pt", label: "ポルトガル語", flag: "🇧🇷", locale: "pt-BR" },
  { code: "vi", label: "ベトナム語", flag: "🇻🇳", locale: "vi-VN" },
  { code: "th", label: "タイ語", flag: "🇹🇭", locale: "th-TH" },
  { code: "es", label: "スペイン語", flag: "🇪🇸", locale: "es-ES" },
];

export function findLanguage(code: string): LanguageOption | undefined {
  return LANGUAGES.find((lang) => lang.code === code);
}

/** よく使う言語を上に出す（設定の favoriteLanguages を使う）。 */
export function orderedLanguages(favorites: readonly string[]): LanguageOption[] {
  const top: LanguageOption[] = [];
  for (const code of favorites) {
    const lang = findLanguage(code);
    if (lang) top.push(lang);
  }
  const rest = LANGUAGES.filter((lang) => !favorites.includes(lang.code));
  return [...top, ...rest];
}

export interface TranslationEntry extends TranslationResult {
  at: number;
  /** どちら向きか。画面の左右の出し分けに使う。 */
  direction: "mine" | "theirs";
}

export interface TranslatorOptions {
  allowCloud: () => boolean;
  now: () => number;
  /** 覚えておく件数。 */
  historyLimit?: number;
}

export class Translator {
  private history: TranslationEntry[] = [];
  private readonly historyLimit: number;
  private interpreting = false;

  constructor(
    private readonly local: AiProvider | null,
    private readonly cloud: AiProvider | null,
    private readonly speech: SpeechAdapter,
    private readonly options: TranslatorOptions,
  ) {
    this.historyLimit = options.historyLimit ?? 200;
  }

  entries(): TranslationEntry[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  /** 文字を訳す。 */
  async translateText(
    text: string,
    sourceLang: string,
    targetLang: string,
    direction: "mine" | "theirs" = "mine",
  ): Promise<TranslationEntry> {
    const trimmed = text.trim();
    if (!trimmed) throw new SmartGlassError("ai_failed", "empty text");
    const provider = await this.pickProvider();
    const result = await provider
      .translate(trimmed, sourceLang, targetLang)
      .catch((error: unknown) => {
        throw new SmartGlassError("ai_failed", String(error));
      });
    const entry: TranslationEntry = { ...result, at: this.options.now(), direction };
    this.history.push(entry);
    if (this.history.length > this.historyLimit) this.history = this.history.slice(-this.historyLimit);
    return entry;
  }

  /** マイクで聞いて、そのまま訳す（会話モードの1往復）。 */
  async listenAndTranslate(
    sourceLang: string,
    targetLang: string,
    direction: "mine" | "theirs",
    timeoutMs = 15_000,
  ): Promise<TranslationEntry> {
    const locale = findLanguage(sourceLang)?.locale ?? sourceLang;
    const heard = await this.speech.listen(locale, timeoutMs);
    return this.translateText(heard, sourceLang, targetLang, direction);
  }

  /**
   * 同時通訳。止めるまで、聞こえたものを次々と訳して onEntry に渡す。
   * 戻り値を呼ぶと止まる。
   */
  startInterpreting(
    sourceLang: string,
    targetLang: string,
    onEntry: (entry: TranslationEntry) => void,
    onError: (error: SmartGlassError) => void,
  ): () => void {
    if (this.interpreting) return () => undefined;
    this.interpreting = true;
    const locale = findLanguage(sourceLang)?.locale ?? sourceLang;

    void (async () => {
      while (this.interpreting) {
        try {
          const heard = await this.speech.listen(locale, 10_000);
          if (!this.interpreting) break;
          if (!heard.trim()) continue;
          onEntry(await this.translateText(heard, sourceLang, targetLang, "theirs"));
        } catch (error) {
          if (!this.interpreting) break;
          onError(
            error instanceof SmartGlassError ? error : new SmartGlassError("ai_failed", String(error)),
          );
          // 一度の失敗では止めない。会議の途中で黙らないため。
        }
      }
    })();

    return () => {
      this.interpreting = false;
      void this.speech.stop().catch(() => undefined);
    };
  }

  isInterpreting(): boolean {
    return this.interpreting;
  }

  private async pickProvider(): Promise<AiProvider> {
    if (this.local && (await this.local.available())) return this.local;
    if (this.cloud && this.options.allowCloud() && (await this.cloud.available())) return this.cloud;
    throw new SmartGlassError("ai_offline");
  }
}
