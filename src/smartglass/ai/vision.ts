/**
 * 「これは何？」— 写真をAIに見てもらう。
 *
 * 端末の中で見るのが既定。クラウドへ送るときは、送る前にひと言ことわる。
 */

import { SmartGlassError } from "../errors.js";
import type { AiProvider, VisionResult } from "./provider.js";

export interface VisionOptions {
  allowCloud: () => boolean;
}

export interface VisionAnswer extends VisionResult {
  /** 読み上げ用の1本の文（音声ガイド向け）。 */
  spoken: string;
}

export class VisionAssistant {
  constructor(
    private readonly local: AiProvider | null,
    private readonly cloud: AiProvider | null,
    private readonly options: VisionOptions,
  ) {}

  /**
   * クラウドに送る必要があるか（送る前の確認を出すかどうか）。
   * 端末の中でできるなら false。
   */
  async needsCloudConsent(): Promise<boolean> {
    if (this.local && (await this.local.available())) return false;
    return this.cloud !== null;
  }

  async describe(imagePath: string): Promise<VisionAnswer> {
    const provider = await this.pickProvider();
    const result = await provider.describeImage(imagePath).catch((error: unknown) => {
      throw new SmartGlassError("ai_failed", String(error));
    });
    return { ...result, spoken: [result.headline, ...result.details].join("。") };
  }

  private async pickProvider(): Promise<AiProvider> {
    if (this.local && (await this.local.available())) return this.local;
    if (this.cloud && this.options.allowCloud() && (await this.cloud.available())) return this.cloud;
    throw new SmartGlassError("ai_offline");
  }
}
