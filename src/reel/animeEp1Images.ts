/**
 * FLATUP アニメ EP1 の8カットの元画像を生成し、そのまま cut1.png ... cut8.png として
 * output/clips_src/ に保存する（＝人が選んで名前を付け直す作業が不要）。
 *
 * 使い方:
 *   npm run anime:ep1:images            # 8カット×1枚（全自動用）
 *   npm run anime:ep1:images -- --count 4   # 各カット4枚（選びたい人向け。1枚目が cut<n>.png）
 *
 * FAL_KEY 未設定時は DRY-RUN（コストゼロ）。
 */

import "../utils/loadEnv.js";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { EP1_CUT_DEFS, imagePrompt } from "./animeEp1Cuts.js";
import { falQueueRequest, downloadVideo as downloadFile, hasApiKey, assertValidApiKey, requiredKeyName } from "./seedance.js";

export function imageEndpoint(): string {
  return process.env.FAL_IMAGE_MODEL || "fal-ai/flux/dev";
}

/** 一時的な失敗（fal混雑・応答遅延）に備えた1カットあたりの試行回数 */
const MAX_ATTEMPTS = 2;

const OUT_DIR = join(process.cwd(), "output", "clips_src");

const isMain =
  process.argv[1]?.endsWith("animeEp1Images.ts") || process.argv[1]?.endsWith("animeEp1Images.js");

if (isMain) {
  const args = process.argv.slice(2);
  let count = 1;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--count") {
      const v = Number(args[++i]);
      if (Number.isInteger(v) && v > 0) count = Math.min(v, 4);
    }
  }

  console.log(`FLATUP アニメ EP1 — 8カットの元画像を生成`);
  console.log(`モデル: ${imageEndpoint()} / 各カット${count}枚`);
  console.log(`保存先: ${OUT_DIR}（cut1.png 〜 cut8.png）\n`);

  if (!hasApiKey()) {
    console.log(`[DRY-RUN] ${requiredKeyName()} が未設定のため、生成はスキップしました(コストゼロ)。\n`);
    for (const cut of EP1_CUT_DEFS) {
      console.log(`--- cut${cut.n}（${cut.title}）→ cut${cut.n}.png ---`);
      console.log(`${imagePrompt(cut)}\n`);
    }
    process.exit(0);
  }

  try {
    assertValidApiKey();
  } catch (err) {
    console.error(`[error] ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  let ok = 0;
  let failed = 0;

  for (const cut of EP1_CUT_DEFS) {
    let done = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !done; attempt++) {
      process.stdout.write(
        `[cut${cut.n}] ${cut.title}${attempt > 1 ? ` 再試行${attempt - 1}` : ""} 生成中...`
      );
      try {
        const result = await falQueueRequest(imageEndpoint(), {
          prompt: imagePrompt(cut),
          image_size: "portrait_16_9",
          num_images: count,
        });
        const images = (result.images ?? []) as Array<{ url?: string }>;
        const urls = images.map(i => i.url).filter((u): u is string => Boolean(u));
        if (urls.length === 0) throw new Error("レスポンスに images がありません");

        // 1枚目を本番採用（cut<n>.png）。2枚目以降は差し替え候補として別名で残す。
        await downloadFile(urls[0], join(OUT_DIR, `cut${cut.n}.png`));
        for (let k = 1; k < urls.length; k++) {
          await downloadFile(urls[k], join(OUT_DIR, `alt_cut${cut.n}_${k + 1}.png`));
        }
        console.log(` 完了 → cut${cut.n}.png${urls.length > 1 ? `（候補${urls.length - 1}枚も保存）` : ""}`);
        ok++;
        done = true;
      } catch (err) {
        console.log(` 失敗: ${err instanceof Error ? err.message : String(err)}`);
        if (attempt === MAX_ATTEMPTS) failed++;
        else console.log(`  → cut${cut.n} をもう一度試します`);
      }
    }
  }

  console.log(`\n完了: 成功 ${ok} / 失敗 ${failed}`);
  if (ok > 0) console.log(`次: npm run anime:ep1:video で6秒動画にする`);
  if (failed > 0) process.exit(1);
}
