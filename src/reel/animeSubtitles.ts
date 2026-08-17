/**
 * 指定した話の字幕表をMarkdownで出力する（CapCut作業用）。
 *
 * 使い方: npm run anime:subtitles -- --episode 2
 * CIの実行サマリからも呼ばれ、話数に応じた字幕がそのまま表示される。
 */

import { getEpisode, parseEpisodeArg } from "./animeEpisodes.js";

const isMain =
  process.argv[1]?.endsWith("animeSubtitles.ts") || process.argv[1]?.endsWith("animeSubtitles.js");

if (isMain) {
  let ep;
  try {
    ep = getEpisode(parseEpisodeArg(process.argv.slice(2)));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
  console.log(`**EP${ep.n}「${ep.title}」** — ${ep.message}`);
  console.log("");
  console.log("| カット | 字幕 |");
  console.log("|---|---|");
  ep.cuts.forEach((cut, i) => {
    console.log(`| ${cut.n} ${cut.title} | ${ep.subtitles[i] ?? ""} |`);
  });
}
