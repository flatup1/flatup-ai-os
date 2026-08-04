/**
 * FLATUP 動画ファクトリーの場面バンク（プロンプトの正本）。
 *
 * 1場面 = 6秒1本。プロンプトは「世界観 → Timeline → Audio → 禁止事項」の順で組む。
 * この順番は MiniMax H3 / Hailuo 系の I2V で最も破綻が少ない。
 *
 * キャラの出典は2系統ある。**混ぜない**こと。
 *   bible  … docs/flatup_animation_bible.md v3.0（シリーズ本編の正本。マサキ・ツム等）
 *            姿かたちは src/reel/characters.ts の look をそのまま引くので、
 *            npm run img / npm run reel で作った画像と必ず一致する
 *   studio … docs/flatup_anime_studio.md（2026-07-16 JIN確定のSNSリール用マスコット）
 *            あぷちゃん・ミットくん。本編キャストではない
 *
 * 場面を増やすときは SCENES に1件足すだけ。notebooks/colab_minimax_h3_i2v.ipynb の
 * ⑦セルと同じキーを持たせる（ズレたら scenes.test.ts が落ちる）。
 */

import { findCharacter } from "../reel/characters.js";

/** キャラ設定の出典 */
export type CanonSource = "bible" | "studio";

export interface Scene {
  /** CLI で指定するキー */
  key: string;
  /** 日本語の場面名 */
  jp: string;
  /** キャラ設定の出典 */
  source: CanonSource;
  /** 世界観ブロック（毎カット同じ文にしてブレを止める） */
  world: string;
  /** 秒で区切った動き。1カット1技を守る */
  timeline: string[];
  /** 音の指定（H3は音も同時に作る。fal 側では雰囲気の補助になる） */
  audio: string;
  /** 投稿文の下書きの種（そのまま投稿しない。sns_post ルートに渡す） */
  captionJa: string;
}

/** ANIMATION BIBLE v3.0 のキャラ姿かたちを characters.ts から引く（二重管理を避ける） */
function look(id: string): string {
  const c = findCharacter(id);
  if (!c) throw new Error(`characters.ts に ${id} がいません（バイブルと不整合）`);
  return c.look;
}

const GYM_BIBLE =
  "Setting: a bright clean gym with a white floor and green mats, soft warm light. " +
  "The environment is constant throughout.";

const GYM_STUDIO =
  "Setting: a bright clean gym with a white floor, a big pink star circle on the floor, potted plants, " +
  "a yellow punching bag and a neon pink punching bag, soft natural light. " +
  "The environment is constant throughout.";

const STYLE = "Warm 3D animation movie style, bright and gentle mood. ";

/** あぷちゃん（studio・2026-07-16 JIN確定のマスコット） */
const APU_LOOK =
  "A cute 2.5-head-tall chibi girl character with big brown eyes and a tall strong dark brown ponytail, " +
  "wearing a pink heart-pattern T-shirt and pink-and-black muay thai shorts, oversized red boxing gloves, barefoot.";

/** ミットくん（studio） */
const MITT_LOOK =
  "A white-and-green focus mitt with big gentle eyes, resting on the ring apron.";

export const WORLD_APU = STYLE + APU_LOOK + " " + GYM_STUDIO;
export const WORLD_MASAKI = STYLE + look("masaki") + ". " + GYM_BIBLE;
export const WORLD_TSUMU = STYLE + look("tsumu") + ". " + GYM_BIBLE;
export const WORLD_NIGHT =
  "Warm 3D animation movie style, quiet night mood. An empty gym after closing time, " +
  "moonlight through the window. " + MITT_LOOK +
  " Deep blue shadows with a small warm lamp. The environment is constant throughout.";

/**
 * 全カット共通の禁止事項。
 * ANIMATION BIBLE v3.0「描いてはいけないもの」＋ src/data/sparring_policy.md に準拠。
 */
export const RULES =
  "No text, no logo, no subtitles, no watermark. " +
  "No real people, no photorealistic humans, no resemblance to any real gym member. " +
  "No blood, no injury, no expression of pain, no scary face, no angry shouting. " +
  "No contact between fighters, no sparring, no opponent knocked down, no celebrating a win over someone. " +
  "Single subject only. Vertical 9:16 framing, subject centered and fully inside the frame.";

export const SCENES: Scene[] = [
  {
    key: "first_punch",
    jp: "はじめの一歩（緊張→笑顔→やさしいストレート）",
    source: "studio",
    world: WORLD_APU,
    timeline: [
      "[0s-2s] The character stands still, looking a little nervous, both red gloves held close to her chest.",
      "[2s-4s] Her expression softens into a small smile, and she takes one careful step forward.",
      "[4s-6s] She gently throws exactly one straight punch toward a soft yellow foam pad standing on a small " +
        "training stand in front of her, then brings the glove back and smiles proudly.",
    ],
    audio:
      "Audio: one soft footstep, a light padded tap on the foam pad, warm uplifting music. No voice, no shouting.",
    captionJa: "はじめの一歩は、こんなに小さくていい。",
  },
  {
    key: "wave",
    jp: "おいでおいで（体験募集リールの冒頭）",
    source: "studio",
    world: WORLD_APU,
    timeline: [
      "[0s-2s] The character stands in the middle of the pink star circle, notices the camera and lights up with a big smile.",
      "[2s-4s] She raises one red glove and waves hello twice, then beckons with a friendly come-here gesture.",
      "[4s-6s] She hops once on the spot with both gloves up, ponytail bouncing, and holds a warm welcoming smile.",
    ],
    audio: "Audio: light cheerful ukulele and soft claps, one small cute hop sound, gentle room tone. No voice.",
    captionJa: "はじめてでも大丈夫。まずは見学からどうぞ。",
  },
  {
    key: "jab",
    jp: "左ジャブ1発（技の紹介リール）",
    source: "studio",
    world: WORLD_APU,
    timeline: [
      "[0s-2s] The character settles into a relaxed guard, both red gloves up, eyes focused but friendly.",
      "[2s-4s] She throws exactly one crisp left jab into the air, glove snapping forward and back to guard.",
      "[4s-6s] She smiles proudly, gives a small nod, and returns to the guard stance.",
    ],
    audio: "Audio: soft glove swish on the jab, a light snare-like snap, calm upbeat background beat. No voice.",
    captionJa: "ジャブは「強く」より「まっすぐ」から。",
  },
  {
    key: "high_kick",
    jp: "元気なハイキック（動きの大きいリール）",
    source: "studio",
    world: WORLD_APU,
    timeline: [
      "[0s-2s] The character takes one small step, gloves up, weight shifting onto the front foot.",
      "[2s-4s] She performs one friendly high kick into the air, body turning smoothly, ponytail swinging.",
      "[4s-6s] She lands lightly, wobbles once in a cute way, then grins and gives a thumbs-up with the glove.",
    ],
    audio: "Audio: a light whoosh on the kick, a soft landing thud, cheerful marimba background. No voice.",
    captionJa: "うまくいかない日も、笑って終われたら合格。",
  },
  {
    key: "rest",
    jp: "休憩中（癒し系・保存されやすい）",
    source: "studio",
    world: WORLD_APU,
    timeline: [
      "[0s-2s] The character leans against the yellow punching bag, shoulders dropping, breathing out slowly.",
      "[2s-4s] Her eyes close, head tilting gently against the bag as she drifts into a short nap.",
      "[4s-6s] The bag sways a few centimeters, she stirs slightly and smiles in her sleep.",
    ],
    audio: "Audio: quiet gym room tone, a faint creak of the punching bag chain, slow soft piano. No voice.",
    captionJa: "がんばったあとの休憩まで、練習のうち。",
  },
  {
    key: "mitt_night",
    jp: "夜のジムでミットくんが目を覚ます（ブランド広告EP1系）",
    source: "studio",
    world: WORLD_NIGHT,
    timeline: [
      "[0s-2s] The dark empty gym is still, moonlight sliding slowly across the floor.",
      "[2s-4s] The focus mitt opens its big gentle eyes, looking around at the quiet room.",
      "[4s-6s] It looks toward the door where everyone left, then smiles softly and settles back down.",
    ],
    audio:
      "Audio: quiet night room tone, a distant clock tick, a single soft piano note, gentle strings swelling at the end.",
    captionJa: "今日もおつかれさま。ミットくんは、みんなの一歩を覚えています。",
  },
  {
    key: "masaki_welcome",
    jp: "マサキ先生のごあいさつ（バイブル正本キャスト）",
    source: "bible",
    world: WORLD_MASAKI,
    timeline: [
      "[0s-2s] The coach turns toward the camera and smiles softly, one hand raised in a small greeting.",
      "[2s-4s] He gestures to the empty mat beside him, inviting the viewer in with a calm open palm.",
      "[4s-6s] He bows politely, then straightens up with a warm reassuring smile.",
    ],
    audio: "Audio: warm quiet gym ambience, soft acoustic guitar, no dialogue, no shouting.",
    captionJa: "一歩ずつ、一緒にできるようになろう。",
  },
  {
    key: "tsumu_first_step",
    jp: "ツムのはじめの一歩（EP1「はじめてのキックボクシング」用）",
    source: "bible",
    world: WORLD_TSUMU,
    timeline: [
      "[0s-2s] The little girl stands at the edge of the green mat, holding her own hands, looking shy and unsure.",
      "[2s-4s] She takes a breath, bows politely toward the mat, and steps onto it with one careful foot.",
      "[4s-6s] She looks up, and a small proud smile spreads across her face as she raises both fists lightly.",
    ],
    audio: "Audio: one soft footstep on the mat, quiet gym room tone, gentle warm piano rising at the end. No voice.",
    captionJa: "こわいのに、来られた。それだけで大きな一歩。",
  },
];

/** キーまたは日本語名から場面を引く */
export function resolveScene(query: string): Scene | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return (
    SCENES.find(s => s.key.toLowerCase() === q) ??
    SCENES.find(s => s.jp.toLowerCase().includes(q))
  );
}

/**
 * 完成プロンプトを組み立てる。
 * 秒数は Timeline の見出しにだけ使う（実際の尺はバックエンド側の設定で決まる）。
 */
export function buildScenePrompt(scene: Scene, seconds = 6): string {
  return [
    scene.world,
    "",
    `Timeline (${seconds} seconds total):`,
    ...scene.timeline,
    "",
    scene.audio,
    "",
    RULES,
  ].join("\n");
}
