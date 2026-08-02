/**
 * 「閉館後のFLATUP」第0話のショット銀行。
 * 正本: docs/emotional_movie_ep0.md / docs/emotional_movie_ep0_prompts.md
 *
 * キャラDNA・スタイルの各ブロックは正本と一字一句同じものを機械的に合成する。
 * ブロックを変更するときは必ず docs 側も同時に更新すること（キャラ固定の生命線）。
 */

// 絵柄の正本は assets/canon/ の確定素材(2026-07-28 JIN承認)。文章はその写し。
// 2026-08-02 JIN指示で「もっと可愛く・愛されるキャラに」更新。
// 狙いは劇場CGアニメの主役キャラ級の「かわいさ(appeal)」。
// 既存作品名は法務上プロンプトに書けないので、見た目を構成する要素に分解して指定する。
const STYLE =
  "Character-driven 3D animated feature film look, rendered to be instantly lovable: " +
  "very large glossy eyes with big dark irises, several bright catchlights and soft " +
  "reflections, thick soft eyelashes and expressive rounded eyebrows; a small rounded " +
  "face with full chubby cheeks and warm pink blush; a small friendly open smile. " +
  "Soft rounded chibi proportions with a big head and a small plump body, short " +
  "stubby limbs, no sharp edges anywhere — everything gently squashy and huggable, " +
  "like a plush toy you want to pick up. " +
  "Polished cinematic CG rendering: soft subsurface scattering, gentle rim light, " +
  "creamy soft shadows. " +
  "Bright, warm, evenly lit interior — no harsh shadows and no moody darkness. " +
  "Cheerful, tender and charming, never scary and never creepy. " +
  "Materials still read as real: worn leather, soft fabric, rubber, brushed metal. " +
  "Completely original character design, not based on any existing animated film or " +
  "franchise. No tattoos on any character. " +
  "No text, no letters, no logos anywhere in the image. Vertical 9:16.";

const LIGHT_NIGHT =
  "Night interior lighting: the ceiling strip lights are off, soft cool moonlight " +
  "blue comes through the windows and one warm amber light glows low. Still bright " +
  "enough to read every expression clearly. Quiet, secret, cozy atmosphere. " +
  "Cinematic shallow depth of field, the background softly out of focus.";

const LIGHT_DAY =
  "Daytime lighting: the long ceiling strip lights are on, bright even warm light, " +
  "airy, clean and welcoming. " +
  "Cinematic shallow depth of field, the background softly out of focus.";

// ジムの内装は assets/canon/ の確定素材どおり。想像で描かせない。
const GYM =
  "the interior of FLATUP GYM: a small bright spotlessly clean Japanese kickboxing " +
  "studio with a seamless off-white floor, pale green padded wall panels, a large " +
  "tropical foliage mural with a white tiger illustration, trailing ivy and small " +
  "potted plants along the shelves, a full mirror wall, long linear ceiling lights, " +
  "a dusty-pink curtain by the window, and a red LED wall timer. " +
  "Nothing intimidating: a space where children and beginners feel safe.";

/** ジムの基準写真を実際に添付したときだけプロンプト末尾に足す(未添付で書くとモデルが混乱する) */
export const REF_PHOTO_CLAUSE =
  "Match the layout, equipment and color scheme of the attached reference photo of the real gym.";

/** キャラ正本画像を実際に添付したときだけプロンプト末尾に足す */
export const CHAR_REFS_CLAUSE =
  "Keep every character exactly consistent with the attached character reference sheets: " +
  "same colors, same proportions, same stitching, same eye placement.";

// 道具たちの構成は assets/canon/tools_night_concept.jpg が正本。
// ただし目の描き方はコンセプト画（白目の大きい西洋カートゥーン調）ではなく、
// マサキ・メルティと同じアニメ調（大きな濃い瞳＋ハイライト）に統一する（JIN確定 2026-07-29）。
const GLOVE =
  "GLOVE — a matching pair of coral-red boxing gloves, about 25 cm tall each, " +
  "standing upright side by side. They always appear together, move in sync and " +
  "act as one character. Plump pillowy rounded mitts of soft worn leather with a " +
  "little velcro strap, no sharp corners. Its whole front is its face: huge glossy " +
  "dark eyes with big irises and bright catchlights taking up most of the face, soft " +
  "expressive dark eyebrows, round blushed cheeks and a small happy open smile. " +
  "Two tiny stubby leather arms each. The wide-eyed curious little kid of the group: " +
  "innocent, eager and instantly lovable.";

const MITT =
  "MITT — a round golden-yellow focus punch mitt with a dark rim and a red leather " +
  "strap, slightly larger than a glove (about 30 cm), standing upright. Softly " +
  "rounded and cushiony like a warm pillow. Large glossy dark eyes with big irises " +
  "and bright catchlights, gently arched eyebrows, rosy blushed cheeks and a tender " +
  "smile with the eyes slightly crinkled with kindness. One small yellow hand it " +
  "uses to gesture. Calm, motherly, reassuring — the one everybody wants a hug from.";

const SANDBAG =
  "SANDBAGS — two large hanging punching bags with faces, one coral-pink and one " +
  "golden-yellow, about 120 cm tall each, hanging from chains. Big soft rounded " +
  "bodies with a gentle squashy bulge at the bottom. Large glossy dark eyes with " +
  "bright catchlights, soft friendly eyebrows, warm blushed cheeks, sleepy easy " +
  "smiles, and two short stubby arms. The big cuddly easy-going seniors of the " +
  "group: they stay hanging and watch over the others, rarely speaking.";

const TIMER =
  "TIMER — a small black-cased digital gym interval timer with a red LED display " +
  "(the same kind of round-timer that hangs on the gym wall), about 15 cm tall, " +
  "with softly rounded corners like a smooth pebble, standing on little rubber feet, " +
  "with two short stubby arms. Its rectangular red LED display is its face: the " +
  "glowing red segments form big round friendly eyes, eyebrows and expressions. " +
  "The smallest one, earnest and tidy and secretly kind — a tiny mascot that tries " +
  "very hard to be taken seriously.";

// 人間キャラは ANIMATION BIBLE v3.0(docs/flatup_animation_bible.md)の正本に従う。
// TSUMU = シリーズ主人公ツム(5歳・最初は怖がり)、MASAKI = マサキ(19歳・EP1指導役)。
const GIRL =
  "TSUMU — a small shy Japanese girl about 5 years old, an original 3-head-tall " +
  "chibi character with large glossy dark eyes and soft blushed cheeks, light brown " +
  "hair tied in a small high ponytail, wearing a plain white t-shirt and FLAT UP GYM " +
  "muay thai shorts, barefoot. Timid at first, gentle. " +
  "Not resembling any real person or any existing animated character.";

const MOTHER =
  "MOTHER — Tsumu's mother, early 30s, gentle face, casual clothes. Original character.";

// マサキの姿は assets/canon/masaki_*.jpg が正本(2026-07-28 JIN承認)。
const COACH =
  "MASAKI — a cheerful young male kickboxing instructor, 19 years old, in the same " +
  "stylized 3D anime look as the children but taller (about 5 heads tall). " +
  "Voluminous spiky black hair with neatly faded short sides, thick dark eyebrows, " +
  "large glossy dark brown eyes, open friendly smile. Wearing a black FLAT UP GYM " +
  "sleeveless tank top (or a black FLAT UP GYM hoodie), muay thai shorts, and a " +
  "black digital watch on his left wrist. Barefoot. " +
  "Always warm and encouraging, never stern or intimidating. Original character.";

const BLOCKS: Record<string, string> = {
  STYLE,
  "LIGHT-NIGHT": LIGHT_NIGHT,
  "LIGHT-DAY": LIGHT_DAY,
  GYM,
  GLOVE,
  MITT,
  TIMER,
  SANDBAG,
  GIRL,
  MOTHER,
  COACH,
};

export type Phase = "refs" | "scenes" | "cuts";

export interface Shot {
  id: string;
  title: string;
  phase: Phase;
  /** [GLOVE] のようなトークンを含むテンプレート */
  template: string;
  /** cuts のみ: 起点になる静止画のショットID */
  sourceStill?: string;
  /** cuts のみ: 秒数(Seedance duration) */
  durationSec?: number;
}

/** トークンをブロック本文へ展開して最終プロンプトを返す */
export function buildShotPrompt(shot: Shot): string {
  let out = shot.template;
  for (const [token, text] of Object.entries(BLOCKS)) {
    out = out.split(`[${token}]`).join(text);
  }
  const leftover = out.match(/\[[A-Z-]+\]/);
  if (leftover) throw new Error(`未定義のブロック: ${leftover[0]} (shot ${shot.id})`);
  return out.replace(/\s+/g, " ").trim();
}

export const SHOTS: Shot[] = [
  // ---- Day 1: 正本(キャラクター参照画像) ----
  {
    id: "M1",
    title: "夜のFLATUP GYM全景",
    phase: "refs",
    template:
      "Wide establishing shot of [GYM] at night, empty, after all the children have " +
      "gone home. [LIGHT-NIGHT] A wall clock reads late evening. Everything is still. [STYLE]",
  },
  {
    id: "M2a",
    title: "グローブ ターンアラウンド",
    phase: "refs",
    template:
      "Character design sheet, plain light-gray studio background: [GLOVE] " +
      "Three views of the exact same character side by side: front view, side view, " +
      "back view. Neutral standing pose, eyes open. Consistent proportions. [STYLE]",
  },
  {
    id: "M2b",
    title: "グローブ 表情シート",
    phase: "refs",
    template:
      "Expression sheet, plain light-gray studio background: [GLOVE] " +
      "The exact same character six times in a 2x3 grid, only the expression changes: " +
      "(1) asleep, eyelid folds closed (2) just waking up, one eye half open " +
      "(3) curious and alert (4) deeply moved, eyes glistening but not crying " +
      "(5) warm gentle smile (6) determined and proud. [STYLE]",
  },
  {
    id: "M3a",
    title: "ミット ターンアラウンド",
    phase: "refs",
    template:
      "Character design sheet, plain light-gray studio background: [MITT] " +
      "Three views of the exact same character: front, side, back. [STYLE]",
  },
  {
    id: "M3b",
    title: "ミット 表情シート",
    phase: "refs",
    template:
      "Expression sheet, plain light-gray studio background: [MITT] " +
      "The exact same character four times in a 2x2 grid, only the expression changes: " +
      "(1) calm listening (2) gentle knowing smile (3) proud quiet nod, eyes closed " +
      "(4) tender, almost tearful warmth. [STYLE]",
  },
  {
    id: "M4a",
    title: "タイマー ターンアラウンド",
    phase: "refs",
    template:
      "Character design sheet, plain light-gray studio background: [TIMER] " +
      "Three views of the exact same character: front, side, back. The LED display " +
      "shows an abstract neutral pattern of glowing segments (no readable numbers or " +
      "letters). [STYLE]",
  },
  {
    id: "M4b",
    title: "タイマー 表情シート",
    phase: "refs",
    template:
      "Expression sheet, plain light-gray studio background: [TIMER] " +
      "The exact same character four times in a 2x2 grid; only the glowing LED " +
      "segment pattern changes to suggest: (1) neutral attention (2) surprise " +
      "(3) busy counting (4) quiet pride. Abstract segments only, no readable text. [STYLE]",
  },
  {
    id: "M5",
    title: "サンドバッグ設定画",
    phase: "refs",
    template:
      "Character design sheet, plain light-gray studio background: [SANDBAG] " +
      "Both bags shown hanging side by side, front view, friendly neutral " +
      "expressions. Consistent proportions. [STYLE]",
  },
  {
    id: "M6",
    title: "全員の身長比較",
    phase: "refs",
    template:
      "Lineup on a plain light-gray studio background, all characters on the same " +
      "floor line with correct relative sizes (SANDBAGS 120cm hanging above > " +
      "MITT 30cm > GLOVE 25cm each > TIMER 15cm): [SANDBAG] [MITT] [GLOVE] [TIMER] " +
      "Front view, neutral poses. [STYLE]",
  },

  // ---- Day 2: シーン静止画 ----
  {
    id: "C1",
    title: "Scene1 グローブの目覚め(寄り)",
    phase: "scenes",
    template:
      "Close-up on the floor of [GYM] at night: [GLOVE] lying on the mat, eyelid " +
      "folds still closed, asleep. In the soft-focus background, [TIMER] glows " +
      "faintly. [LIGHT-NIGHT] Quiet, secret mood. [STYLE]",
  },
  {
    id: "C2",
    title: "Scene2 夜の全景+小さな3体",
    phase: "scenes",
    template:
      "Wide shot of [GYM] at night, empty and still. Tiny in the frame, on the mats: " +
      "[GLOVE] [MITT] [TIMER] beginning to stir. [LIGHT-NIGHT] [STYLE]",
  },
  {
    id: "C3",
    title: "Scene3 秘密の会議",
    phase: "scenes",
    template:
      "Medium shot: [GLOVE] [MITT] [TIMER] gathered in a small circle on the mat of " +
      "[GYM] at night, as if holding a secret meeting. Hanging just behind them and " +
      "watching over the little meeting: [SANDBAG] [LIGHT-NIGHT] Warm, " +
      "slightly humorous, conspiratorial mood. [STYLE]",
  },
  {
    id: "C4",
    title: "Scene4 昼の回想・強い子",
    phase: "scenes",
    template:
      "Daytime flashback in [GYM]: [COACH] holding a focus mitt while an energetic " +
      "boy about 8 years old (original character) throws a strong confident punch " +
      "into it. Dynamic but safe and joyful, nothing aggressive. [LIGHT-DAY] [STYLE]",
  },
  {
    id: "C5a",
    title: "Scene5 母の後ろに隠れる女の子",
    phase: "scenes",
    template:
      "Daytime in [GYM]: [GIRL] hiding behind [MOTHER]'s legs near the entrance, " +
      "peeking out shyly at the gym. [LIGHT-DAY] Gentle, empathetic mood. [STYLE]",
  },
  {
    id: "C5b",
    title: "Scene5 先生が目線を合わせる",
    phase: "scenes",
    template:
      "Daytime in [GYM]: [COACH] kneeling down to the eye level of [GIRL], gently " +
      "holding out a focus mitt toward her, patient warm smile. The girl hesitates. " +
      "[LIGHT-DAY] [STYLE]",
  },
  {
    id: "C5c",
    title: "Scene5 手元クローズアップ(最重要)",
    phase: "scenes",
    template:
      "Extreme close-up, only two hands in frame against a soft-focus gym background: " +
      "a mother's hand holding a small child's hand. The child's small fingers are " +
      "just beginning to slip out of the mother's hand. No faces, no bodies, hands " +
      "only. [LIGHT-DAY] Tender, quiet, emotional. [STYLE]",
  },
  {
    id: "C5d",
    title: "Scene5 一歩前へ",
    phase: "scenes",
    template:
      "Daytime in [GYM], low camera at child height: [GIRL] alone in the frame, " +
      "taking one small brave step forward, slightly nervous but determined. " +
      "[MOTHER] out of focus far behind her. [LIGHT-DAY] [STYLE]",
  },
  {
    id: "C5e",
    title: "Scene5 はじめてのミット",
    phase: "scenes",
    template:
      "Daytime in [GYM]: [GIRL] softly touching a focus mitt held by kneeling " +
      "[COACH] with her small gloved fist — a first gentle punch, weak but hers. " +
      "[LIGHT-DAY] Joyful, tender. [STYLE]",
  },
  {
    id: "C5f",
    title: "Scene5 母の表情",
    phase: "scenes",
    template:
      "Daytime in [GYM], portrait shot: [MOTHER] watching from a distance, a subtle " +
      "complex expression — slight surprise, quiet joy and a touch of loneliness at " +
      "the same time, a soft smile, absolutely no tears. [LIGHT-DAY] [STYLE]",
  },
  {
    id: "C6",
    title: "Scene6 決定の瞬間",
    phase: "scenes",
    template:
      "Medium close shot of the night meeting in [GYM]: [GLOVE] smiling with eyes " +
      "glistening (moved, not crying), [MITT] nodding warmly with eyes closed, " +
      "[TIMER] standing straight with a single proud glowing segment lit on its " +
      "display (abstract, no readable text). [LIGHT-NIGHT] [STYLE]",
  },
  {
    id: "C7",
    title: "Scene7 朝",
    phase: "scenes",
    template:
      "Wide shot of [GYM] in the early morning: golden sunlight streaming through " +
      "the windows, dust motes in the light. On the mat, [GLOVE] [MITT] [TIMER] sit " +
      "perfectly still, ordinary objects again. The entrance door is half open and " +
      "[GIRL] is stepping in by herself, [MOTHER] visible small and out of focus " +
      "outside the door. [STYLE]",
  },

  // ---- Day 4: 優先動画カット(image-to-video) ----
  {
    id: "V1",
    title: "グローブが目を開ける",
    phase: "cuts",
    sourceStill: "C1",
    durationSec: 4,
    template:
      "The red boxing glove's leather eyelid folds slowly open, like someone gently " +
      "waking up. It blinks once. Nothing else moves. Static camera, night gym " +
      "lighting unchanged, character keeps exactly the same shape and colors.",
  },
  {
    id: "V2",
    title: "手がそっと離れる",
    phase: "cuts",
    sourceStill: "C5c",
    durationSec: 4,
    template:
      "The child's small hand slowly and gently slips out of the mother's hand, " +
      "fingertips lingering for a moment before letting go. Hands only, no faces. " +
      "Very slow, tender motion. Static camera, same soft lighting.",
  },
  {
    id: "V3",
    title: "一歩前へ",
    phase: "cuts",
    sourceStill: "C5d",
    durationSec: 4,
    template:
      "The little girl takes one single small step forward, slightly hesitant, " +
      "then stands firm. One step only. Static low camera at child height, " +
      "background unchanged.",
  },
  {
    id: "V4",
    title: "朝日が差し込む",
    phase: "cuts",
    sourceStill: "C7",
    durationSec: 5,
    template:
      "Morning sunlight slowly grows brighter through the windows, dust motes " +
      "drifting in the light beams. The three objects on the mat stay perfectly " +
      "still. Very subtle, slow change. Static camera.",
  },
];

export function shotsByPhase(phase: Phase): Shot[] {
  return SHOTS.filter(s => s.phase === phase);
}

export function findShot(id: string): Shot | undefined {
  return SHOTS.find(s => s.id.toLowerCase() === id.toLowerCase());
}
