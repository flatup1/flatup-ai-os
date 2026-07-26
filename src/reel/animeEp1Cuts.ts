/**
 * FLATUP アニメ EP1 の8カット定義（画像プロンプト + 動画プロンプトの唯一の正本）。
 *
 * docs/flatup_anime_episode1.md の絵コンテと1対1で対応する。
 * 画像生成(animeEp1Images.ts)・動画化(animeEp1Video.ts)・CI(.github/workflows)が
 * すべてこの定義を参照するので、直すときはここだけ直す。
 */

/** 全カット共通の画風・舞台（ここを変えると全カットの見た目が揃って変わる） */
export const EP1_STYLE_SUFFIX =
  "warm 3D animation movie style, Pixar and Illumination quality, soft golden-hour lighting, " +
  "cinematic depth of field, FLATUP GYM interior with white floor, green mats, potted plants, " +
  "one yellow and one neon pink punching bag, white wall FLATUP GYM sign, heartwarming, " +
  "no scary faces, vertical 9:16";

/** 全カット共通の動かし方ルール（1動作・固定カメラ・6秒） */
export const EP1_MOTION_SUFFIX =
  "one gentle motion only, fixed camera, background unchanged, soft warm lighting, 6 seconds";

export interface Ep1Cut {
  n: number;
  /** 日本語のカット名（ログ表示用） */
  title: string;
  /** FLUX 画像プロンプト（EP1_STYLE_SUFFIX が自動で付く） */
  image: string;
  /** Hailuo I2V 動画プロンプト（EP1_MOTION_SUFFIX が自動で付く） */
  video: string;
}

export const EP1_CUT_DEFS: Ep1Cut[] = [
  {
    n: 1,
    title: "夜のジム外観",
    image:
      "Establishing shot, a cozy two-story martial-arts gym named FLAT UP GYM on a quiet Japanese town street at night, warm light glowing from the windows, a lit wooden FLAT UP GYM sign, wet asphalt reflecting streetlights, punching bags visible through the window, no people, cinematic wide shot",
    video:
      "Slow subtle dolly-in toward the gym, warm window light flickers gently, faint steam rises from the wet street, cozy calm night",
  },
  {
    n: 2,
    title: "あいさつ",
    image:
      "A cheerful young male coach in his late twenties with short black hair and a shonen-hero look, black FLAT UP GYM hoodie, smiling and greeting a small group of 2.5-head-tall chibi kids in FLAT UP GYM t-shirts, everyone smiling",
    video:
      "The coach raises one hand in a friendly greeting and the kids wave back with bright smiles, gentle breathing and blinking, warm and lively",
  },
  {
    n: 3,
    title: "今日のテーマ",
    image:
      "The young male coach kneeling and speaking gently to chibi kids sitting in seiza on the white gym floor, kids listening with big sparkling eyes, tender heartwarming mood",
    video:
      "The coach speaks warmly with a soft gesture, the seated kids nod and their eyes light up, gentle breathing, tender mood",
  },
  {
    n: 4,
    title: "基本練習",
    image:
      "A row of 2.5-head-tall chibi kids in FLAT UP GYM t-shirts and muay thai shorts throwing gentle jab punches in unison, barefoot, the coach watching with a proud smile, playful energetic mood",
    video:
      "The row of kids throws one clean jab punch forward in unison, the coach nods with a proud smile, light hair and clothing motion",
  },
  {
    n: 5,
    title: "ミット打ち",
    image:
      "The young coach holding a yellow-and-black focus mitt while a happy chibi kid punches it with a clean light hit, coach smiling and cheering, joyful mood",
    video:
      "The kid throws one straight punch into the focus mitt with a soft impact, the coach reacts with a cheerful expression",
  },
  {
    n: 6,
    title: "マススパー・礼",
    image:
      "Two friendly chibi kids wearing soft headgear and oversized boxing gloves facing each other in a gentle no-contact light spar, then bowing and touching gloves with big smiles, safe playful atmosphere, absolutely no aggression or pain",
    video:
      "The two kids touch gloves and bow to each other with big warm smiles, no impact, only a friendly respectful gesture",
  },
  {
    n: 7,
    title: "整列・礼",
    image:
      "A group of chibi kids in FLAT UP GYM t-shirts kneeling in a neat row in seiza and bowing respectfully, the coach bowing with them, calm grateful heartwarming mood",
    video:
      "The kneeling kids bow forward together in a respectful gesture, the coach bows with them, slow calm synchronized motion",
  },
  {
    n: 8,
    title: "外観に戻る・ロゴ",
    image:
      "Exterior night view of FLAT UP GYM, warm light from the windows with silhouettes of smiling kids inside, empty quiet street, gentle magical evening mood, space at center for a logo, cinematic",
    video:
      "Very slow pull-back from the gym exterior, the window silhouettes stay smiling, warm light glows steadily, magical calm ending",
  },
];

/** カットの完成した画像プロンプト（共通の画風付き） */
export function imagePrompt(cut: Ep1Cut): string {
  return `${cut.image}, ${EP1_STYLE_SUFFIX}`;
}

/** カットの完成した動画プロンプト（共通の動かし方付き） */
export function videoPrompt(cut: Ep1Cut): string {
  return `${cut.video}, ${EP1_MOTION_SUFFIX}`;
}
