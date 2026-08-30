/**
 * 端末内AIの偽物。実機の on-device モデルを差し替えるまでの受け皿。
 *
 * 本物に差し替えるときは AiProvider を実装するだけでよい
 *（app.ts も画面も直さなくていい）。
 */

import type { AiMessage, AiProvider, AiReply, TranslationResult, VisionResult } from "../ai/provider.js";

export class MockAiProvider implements AiProvider {
  constructor(
    readonly kind: "local" | "cloud" = "local",
    private readonly ready = true,
  ) {}

  async available(): Promise<boolean> {
    return this.ready;
  }

  async chat(messages: AiMessage[]): Promise<AiReply> {
    const last = [...messages].reverse().find((m) => m.role === "user");
    return { text: `「${last?.text ?? ""}」のお返事です（${this.kind}）。`, source: this.kind };
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    return {
      sourceText: text,
      translatedText: `[${targetLang}] ${text}`,
      sourceLang,
      targetLang,
      source: this.kind,
    };
  }

  async describeImage(imagePath: string): Promise<VisionResult> {
    return {
      headline: "ボクシンググローブです",
      details: [`ファイル: ${imagePath.split("/").pop()}`, "赤い色の、大人用の大きさに見えます。"],
      source: this.kind,
    };
  }
}
