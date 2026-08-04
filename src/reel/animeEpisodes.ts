/**
 * FLATUP アニメ シリーズの話数レジストリ。
 *
 * 各話の8カット（画像プロンプト + 動画プロンプト）をここに集約する。
 * 画像生成・動画化・CIはすべてこの定義を参照するので、直すときはここだけ直す。
 *
 * キャラ・世界観の正本は docs/flatup_animation_bible.md（v3.0）。
 * 各話の絵コンテは docs/flatup_anime_episode<N>.md と1対1で対応する。
 */

import { EP1_CUT_DEFS, EP1_STYLE_SUFFIX, EP1_MOTION_SUFFIX, type Ep1Cut } from "./animeEp1Cuts.js";

export type EpisodeCut = Ep1Cut;

export interface Episode {
  n: number;
  /** 話タイトル（バイブルのシリーズ構成と一致させる） */
  title: string;
  /** 芯のメッセージ */
  message: string;
  cuts: EpisodeCut[];
  /** カット順の字幕（CapCutでそのまま使う） */
  subtitles: string[];
}

/**
 * EP2「ありがとうが言えるかな？」
 *
 * ツム(5)はまだ「ありがとう」が言えない。グローブを落として困っているところを
 * リク(7)が拾ってくれる。メルティが背中をそっと押し、最後にツムが自分の言葉で伝える。
 * バイブルの共通ルール（あいさつ・礼・笑顔・仲間を応援・ありがとう・自分で考える）を満たす。
 */
const EP2_CUTS: EpisodeCut[] = [
  {
    n: 1,
    title: "朝のジム・ツム登場",
    image:
      "A shy 5-year-old chibi girl with soft light-brown hair in a small high ponytail tied with a dark red hair tie, big brown eyes, wearing a plain white short-sleeve t-shirt and light blue FLAT UP GYM shorts, barefoot, standing alone near the entrance holding oversized boxing gloves, looking down a little nervously, morning light through the window",
    video:
      "The shy little girl hugs her gloves a bit tighter and glances up hesitantly, gentle breathing and blinking, tender quiet mood",
  },
  {
    n: 2,
    title: "グローブを落とす",
    image:
      "The same shy chibi girl (light-brown ponytail, white t-shirt, light blue shorts) fumbles and drops one oversized boxing glove on the white gym floor, a small surprised expression on her face, other chibi kids warming up in the soft background, bright clean gym",
    video:
      "One glove slips from her arms and lands softly on the floor, she freezes with a small surprised expression, gentle motion only",
  },
  {
    n: 3,
    title: "リクが拾ってくれる",
    image:
      "A cheerful 7-year-old chibi boy with messy dark hair in a FLAT UP GYM t-shirt kneeling down to pick up the dropped yellow-trimmed boxing glove, smiling warmly at the shy girl, bright clean gym floor, kind helpful atmosphere",
    video:
      "The cheerful boy picks up the glove and holds it out toward her with a big friendly smile, one gentle motion only",
  },
  {
    n: 4,
    title: "言えないツム",
    image:
      "Close view of the shy chibi girl (light-brown ponytail, white t-shirt, light blue shorts) receiving the glove with both hands, her mouth slightly open as if a word is stuck, cheeks faintly pink, eyes lowered, soft warm light, tender and a little bittersweet mood",
    video:
      "She takes the glove with both hands and her lips part as if trying to speak, then she looks down shyly, very gentle motion",
  },
  {
    n: 5,
    title: "メルティが寄り添う",
    image:
      "A kind female instructor in her late twenties with a warm smile, wearing a black FLAT UP GYM shirt, kneeling to eye level beside the shy chibi girl and speaking gently to her, bright clean gym, reassuring atmosphere",
    video:
      "The instructor kneels to eye level and speaks warmly with a soft encouraging gesture, the girl listens and slowly lifts her eyes",
  },
  {
    n: 6,
    title: "小さな勇気",
    image:
      "The shy chibi girl taking a small breath and lifting her face with quiet courage, hands gripping the glove, soft hopeful light streaming in from the window, the boy waiting nearby with a patient smile",
    video:
      "She takes one small breath and lifts her face with quiet determination, soft hopeful light glows, one gentle motion only",
  },
  {
    n: 7,
    title: "ありがとう",
    image:
      "The shy chibi girl finally smiling and bowing slightly toward the cheerful boy, both children smiling at each other, other kids and instructors watching warmly in the background, bright clean gym, joyful heartwarming moment",
    video:
      "She smiles and bows slightly toward the boy, he beams back happily, warm gentle motion, everyone's expression softens",
  },
  {
    n: 8,
    title: "みんなで練習・ロゴ",
    image:
      "A group of chibi kids and instructors standing together in a bright clean gym, everyone smiling, the shy girl now standing among them with her gloves on, warm afternoon light, space at center for a logo, cinematic",
    video:
      "Very slow pull-back from the smiling group, warm light glows steadily, calm happy ending, one gentle motion only",
  },
];

export const EPISODES: Episode[] = [
  {
    n: 1,
    title: "はじめてのキックボクシング",
    message: "最初の一歩を踏み出す",
    cuts: EP1_CUT_DEFS,
    subtitles: [
      "FLATUP GYM",
      "こんばんは！",
      "今日は「優しくなること」",
      "まっすぐ、いいね！",
      "ナイス！",
      "勝ち負けじゃない",
      "ありがとうございました！",
      "世界一やさしい格闘技ジム",
    ],
  },
  {
    n: 2,
    title: "ありがとうが言えるかな？",
    message: "感謝を言葉にする",
    cuts: EP2_CUTS,
    subtitles: [
      "ツム、5さい。",
      "あっ…",
      "はい、どうぞ！",
      "…（言えない）",
      "ゆっくりでいいよ",
      "すぅ…",
      "ありがとう！",
      "世界一やさしい格闘技ジム",
    ],
  },
];

/** 話数から定義を引く。未定義の話数はエラーにして誤生成を防ぐ */
export function getEpisode(n: number): Episode {
  const ep = EPISODES.find(e => e.n === n);
  if (!ep) {
    throw new Error(
      `EP${n} はまだ定義されていません。利用できるのは ${EPISODES.map(e => `EP${e.n}`).join(", ")} です。` +
      `（新しい話は src/reel/animeEpisodes.ts に追加してください）`
    );
  }
  return ep;
}

/** 引数 --episode N から話数を読む（既定1） */
export function parseEpisodeArg(args: string[]): number {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--episode" || args[i] === "--ep") {
      const v = Number(args[i + 1]);
      if (Number.isInteger(v) && v > 0) return v;
    }
  }
  const env = Number(process.env.ANIME_EPISODE);
  return Number.isInteger(env) && env > 0 ? env : 1;
}

export { EP1_STYLE_SUFFIX as STYLE_SUFFIX, EP1_MOTION_SUFFIX as MOTION_SUFFIX };

/** カットの完成した画像プロンプト（共通の画風付き） */
export function imagePromptOf(cut: EpisodeCut): string {
  return `${cut.image}, ${EP1_STYLE_SUFFIX}`;
}

/** カットの完成した動画プロンプト（共通の動かし方付き） */
export function videoPromptOf(cut: EpisodeCut): string {
  return `${cut.video}, ${EP1_MOTION_SUFFIX}`;
}
