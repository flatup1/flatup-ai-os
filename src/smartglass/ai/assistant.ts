/**
 * AIアシスタント。
 *
 * 決まり:
 *  - まず端末の中（local）で試す。
 *  - 端末の中で無理で、かつ利用者が「インターネットを使ってよい」と言っているときだけ cloud。
 *  - どちらで答えたかを、かならず画面に出す。
 */

import { SmartGlassError } from "../errors.js";
import { T } from "../i18n.js";
import type { AiMessage, AiProvider, AiReply } from "./provider.js";

/** ホームに出す定型の質問。押すだけで聞ける。 */
export const SHORTCUT_QUESTIONS = [
  T.ai.shortcutWhatIsThis,
  T.ai.shortcutWeather,
  T.ai.shortcutTime,
  T.ai.shortcutHowToUse,
] as const;

export interface AssistantOptions {
  /** 設定の「AIにインターネットを使わせる」。 */
  allowCloud: () => boolean;
  /** 会話をどれだけ覚えておくか（往復の数）。 */
  historyTurns?: number;
}

export class Assistant {
  private history: AiMessage[] = [];
  private readonly historyTurns: number;

  constructor(
    private readonly local: AiProvider | null,
    private readonly cloud: AiProvider | null,
    private readonly options: AssistantOptions,
  ) {
    this.historyTurns = options.historyTurns ?? 6;
  }

  messages(): AiMessage[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
  }

  /** 質問する。返事は画面にそのまま出せる。 */
  async ask(question: string): Promise<AiReply> {
    const text = question.trim();
    if (!text) throw new SmartGlassError("ai_failed", "empty question");

    this.history.push({ role: "user", text });
    this.trim();

    const provider = await this.pickProvider();
    try {
      const reply = await provider.chat(this.history);
      this.history.push({ role: "assistant", text: reply.text });
      this.trim();
      return reply;
    } catch (error) {
      // 失敗したぶんの質問は残す（もう一度押せば同じことを聞ける）。
      throw new SmartGlassError("ai_failed", String(error));
    }
  }

  /** 端末の中 → （許されていれば）クラウド、の順で選ぶ。 */
  private async pickProvider(): Promise<AiProvider> {
    if (this.local && (await this.local.available())) return this.local;
    if (this.cloud && this.options.allowCloud() && (await this.cloud.available())) return this.cloud;
    throw new SmartGlassError("ai_offline");
  }

  /** 古い会話は捨てる（端末の負荷とプライバシーの両方のため）。 */
  private trim(): void {
    const max = this.historyTurns * 2;
    if (this.history.length > max) this.history = this.history.slice(-max);
  }
}
