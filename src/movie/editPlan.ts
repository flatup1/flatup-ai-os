/**
 * 「閉館後のFLATUP」第0話の編集設計（タイムライン）。
 * 正本: docs/emotional_movie_ep0.md の「完成台本（改訂版・35秒）」
 * 人間向けの読み物: docs/emotional_movie_ep0_edit.md
 *
 * ここが決めるのは「どの素材を・何秒目に・どう動かして・どの字幕と一緒に置くか」。
 * 素材そのもの（プロンプト）は promptBank.ts が持つ。役割を分けてある。
 *
 * 秒数はすべて「開始秒」と「長さ」で持つ。終了秒は計算する（ズレの原因を作らない）。
 */

import { findShot } from "./promptBank.js";

/** 静止画に付けるカメラワーク（動画カットには付けない） */
export type Move =
  | "still"        // 完全静止。間を作りたいときだけ
  | "push-in"      // ゆっくり寄る
  | "pull-out"     // ゆっくり引く
  | "pan-left"
  | "pan-right"
  | "tilt-down"
  | "light-shift"; // 光だけがゆっくり変わる

export interface Clip {
  /** promptBank のショットID（C1 / V2 など）。CTAカードなど素材が無いものは null */
  shot: string | null;
  /** タイムライン上の開始秒 */
  at: number;
  /** 長さ（秒） */
  dur: number;
  /** 静止画のときのカメラワーク。動画カット(V*)は素材側に動きがあるので "still" 扱い */
  move: Move;
  /** 編集意図。CapCut で迷ったときはここを読む */
  note: string;
}

export interface Subtitle {
  at: number;
  dur: number;
  /** 画面に出す文字そのもの（改行は \n）*/
  text: string;
  /** 誰のセリフか。ナレーション的な字幕は null */
  speaker: "グローブ" | "ミット" | "タイマー" | null;
  /**
   * subtitle = 流れる字幕。読み速度の上限を守らせる。
   * card     = ロゴやCTAのように「置いておく」情報。視線で拾うので読み速度の対象外。
   *            代わりに、目に入るだけの最低表示時間を要求する。
   * 省略時は subtitle。
   */
  kind?: "subtitle" | "card";
}

export interface SoundCue {
  at: number;
  kind: "SE" | "BGM";
  /** 何を鳴らすか */
  what: string;
}

export interface EditPlan {
  id: string;
  title: string;
  /** 尺（秒）。clips の合計と一致しなければテストが落ちる */
  totalSec: number;
  clips: Clip[];
  subtitles: Subtitle[];
  sound: SoundCue[];
}

// ---------------------------------------------------------------------------
// 本編（オーガニック版・35秒）
// ---------------------------------------------------------------------------
// シーンの区切り秒は正本どおり:
//   S1 0-3 / S2 3-7 / S3 7-13 / S4 13-17 / S5 17-26 / S6 26-31 / S7 31-35
// その中の割り振りがこの設計の仕事。
export const PLAN_35: EditPlan = {
  id: "ep0-35s",
  title: "第0話「今日のチャンピオン」オーガニック版 35秒",
  totalSec: 35,
  clips: [
    // --- Scene 1: 目覚め（0-3） 動画カット。冒頭3秒で掴む ---
    { shot: "V1", at: 0, dur: 3, move: "still",
      note: "生成4秒のうち頭3秒を使う。タイマーの電子音でグローブが目を開ける瞬間を0.8秒目に置く" },

    // --- Scene 2: 夜のジム（3-7） 世界を見せる ---
    { shot: "C2", at: 3, dur: 4, move: "push-in",
      note: "全景からゆっくり寄る。3体が小さく見えている状態から、存在に気づかせる" },

    // --- Scene 3: 秘密の会議（7-13） いちばん尺に余裕がある。困ったらここから借りる ---
    { shot: "C3", at: 7, dur: 6, move: "push-in",
      note: "円になった3体へゆっくり寄る。木琴のBGMが入る唯一の軽い場面" },

    // --- Scene 4: 候補・ミスリード（13-17） ---
    { shot: "C4", at: 13, dur: 4, move: "still",
      note: "力強いパンチ。ここは意図的に「正解っぽく」見せる。17秒でスパッと切る" },

    // --- Scene 5: 小さな勇気（17-26） 感情の核。6カット ---
    { shot: "C5a", at: 17, dur: 1.2, move: "still",
      note: "母の後ろに隠れる。短く置くだけでいい。説明しすぎない" },
    { shot: "C5b", at: 18.2, dur: 1.4, move: "push-in",
      note: "先生がしゃがんで目線を合わせる。ここで一度、空気がやわらかくなる" },
    { shot: "V2", at: 19.6, dur: 2.6, move: "still",
      note: "★最重要カット。手が離れる。生成4秒から、離れる瞬間の前後2.6秒を切り出す。" +
            "顔も全身も入れない。ここだけBGMを薄くしてSEも消し、間で見せる" },
    { shot: "V3", at: 22.2, dur: 1.6, move: "still",
      note: "一歩前へ。子どもの目線の高さのまま。生成4秒から歩き出しの1.6秒" },
    { shot: "C5e", at: 23.8, dur: 1.2, move: "push-in",
      note: "はじめてのミット。打つ音は軽く。強さを演出しない" },
    { shot: "C5f", at: 25, dur: 1, move: "still",
      note: "母の表情。1秒だけ。長く見せると狙いが透ける。涙は絶対に描かない" },

    // --- Scene 6: 本当のチャンピオン（26-31） ---
    { shot: "C6", at: 26, dur: 5, move: "push-in",
      note: "夜へ戻る。タイマーの表示に1つだけ光が灯る瞬間を28.5秒あたりに置く" },

    // --- Scene 7: 朝（31-35） 動画カット＋ロゴ ---
    { shot: "V4", at: 31, dur: 4, move: "still",
      note: "朝日が差し込む。生成5秒から頭4秒。33.5秒からロゴをフェードイン（素材の上に重ねる）" },
  ],

  // 字幕はカット割りとは独立したトラック。カットをまたいで良い。
  // 読み速度の上限は 7文字/秒（EDIT_RULES.maxCps）。これを超えると読めない。
  subtitles: [
    { at: 0.4, dur: 2.8, text: "閉館後のジムで、\n毎晩ひらかれる——", speaker: null },
    { at: 3.4, dur: 1.8, text: "秘密の会議。", speaker: null },
    { at: 5.4, dur: 2.2, text: "子どもたちが帰ったあと——", speaker: null },
    { at: 7.8, dur: 1.6, text: "みんな、起きて。", speaker: "グローブ" },
    { at: 9.6, dur: 3.4, text: "今夜の議題。\n「今日いちばん強くなった子」は？", speaker: "タイマー" },
    { at: 13.4, dur: 2.6, text: "あの、パンチが\n一番強かった子？", speaker: "グローブ" },
    { at: 16.2, dur: 1.4, text: "ううん。", speaker: "ミット" },
    // 17.6-19.4 は無字幕。C5a/C5b を絵だけで見せる（説明しない）
    { at: 19.6, dur: 3.2, text: "今日、はじめて\n「ひとりで前に出た」子。", speaker: "ミット" },
    // 22.8-25.9 は無字幕。一歩前へ〜母の表情は絵と音だけで運ぶ
    // ↓ Scene6 の2本は、当初 26.2/2.2 + 28.6/2.4 で置いていたが
    //   「ほんの少し。でも、〜」が 8.3字/秒になり読めなかった（テストが検出）。
    //   カット頭の 26.0 から始めて、後半へ尺を寄せて解決している。
    { at: 26, dur: 2.1, text: "本日のチャンピオン、決定。", speaker: "タイマー" },
    { at: 28.3, dur: 3, text: "ほんの少し。でも、\nちゃんと、強くなった。", speaker: "グローブ" },
    { at: 31.6, dur: 2.4, text: "強さは、勝つことだけじゃない。", speaker: null },
    // 34.0以降のロゴ＋サブコピーは字幕トラックに置かない。
    // 文字ではなく画面デザイン（素材に重ねるロゴ）なので、V4 のカット注記が正本。
  ],

  sound: [
    { at: 0, kind: "SE", what: "タイマーの電子音（小さく1回）" },
    { at: 0.8, kind: "SE", what: "革がわずかにきしむ音" },
    { at: 3, kind: "SE", what: "遠くでドアが閉まる音／秒針" },
    { at: 7, kind: "BGM", what: "木琴＋ピアノ。控えめで少しユーモラス。ここから入る" },
    { at: 13, kind: "BGM", what: "音数を減らす（ミスリードのため、あえて明るくしない）" },
    { at: 16.2, kind: "BGM", what: "★「ううん。」の直後、1拍だけほぼ無音に落とす（物語の転回点）" },
    { at: 17, kind: "BGM", what: "ピアノ中心。弦を薄く重ねる" },
    { at: 19.6, kind: "BGM", what: "★さらに薄く。手が離れるカットはSEも入れず、間で見せる" },
    { at: 23.8, kind: "SE", what: "ミットを打つ軽い音（絶対に強くしない）" },
    { at: 26, kind: "BGM", what: "静かな希望のコードへ。ここから終わりに向けて開く" },
    { at: 31, kind: "SE", what: "朝の鳥の声／扉が開く音" },
  ],
};

// ---------------------------------------------------------------------------
// 15秒版（広告用）
// ---------------------------------------------------------------------------
// 正本の指示どおり「35秒版の切り出しではなく再設計」。
// 残すのは、無音で見ても成立する4カットだけ。
export const PLAN_15: EditPlan = {
  id: "ep0-15s",
  title: "第0話 広告版 15秒（再設計・切り出しではない）",
  totalSec: 15,
  clips: [
    { shot: "V1", at: 0, dur: 3, move: "still",
      note: "掴みは35秒版と同じ。ここは変えない（3秒視聴維持率を落とさないため）" },
    { shot: "V2", at: 3, dur: 3.5, move: "still",
      note: "★手が離れる。15秒版はここが主役。35秒版より0.9秒長く見せる" },
    { shot: "V3", at: 6.5, dur: 2.5, move: "still",
      note: "一歩前へ。ここまでで「小さな勇気の物語」が無音でも成立する" },
    { shot: "V4", at: 9, dur: 3, move: "still",
      note: "朝＋ロゴ。11秒からロゴをフェードイン" },
    { shot: null, at: 12, dur: 3, move: "still",
      note: "CTAカード（静止画を生成せず、CapCutの図形＋文字で作る）" },
  ],
  subtitles: [
    { at: 0.4, dur: 2.6, text: "閉館後のジムで、\n毎晩ひらかれる会議。", speaker: null },
    { at: 3.4, dur: 2.8, text: "今日、はじめて\n「ひとりで前に出た」子。", speaker: "ミット" },
    { at: 6.8, dur: 2, text: "本日のチャンピオン。", speaker: "タイマー" },
    { at: 9.4, dur: 2.4, text: "強さは、勝つことだけじゃない。", speaker: null },
    { at: 12.2, dur: 2.8, text: "キッズ体験 500円\n火・木 18:00〜／土 13:00〜",
      speaker: null, kind: "card" },
  ],
  sound: [
    { at: 0, kind: "SE", what: "タイマーの電子音" },
    { at: 0.5, kind: "BGM", what: "ピアノ中心。35秒版より最初から静かに入る" },
    { at: 3, kind: "BGM", what: "★薄く落とす。手が離れるカットは間で見せる" },
    { at: 9, kind: "BGM", what: "静かな希望のコードへ" },
    { at: 12, kind: "BGM", what: "CTAまで余韻を引っぱる（切らない）" },
  ],
};

export const PLANS: EditPlan[] = [PLAN_35, PLAN_15];

// ---------------------------------------------------------------------------
// 編集ルール（テストが機械的に検査する数値）
// ---------------------------------------------------------------------------
export const EDIT_RULES = {
  /** 字幕の読み速度の上限（文字/秒）。超えると読み切れない */
  maxCps: 7,
  /**
   * カード（CTAなど）の読み速度の上限。
   * カードは行が組まれていて視線で拾えるので、流れる字幕より速く読める。
   */
  maxCardCps: 12,
  /** 字幕の最短表示時間（秒）。短すぎると読む前に消える */
  minSubtitleSec: 1.2,
  /** カードの最短表示時間（秒）。情報量が多いので字幕より長く置く */
  minCardSec: 2.5,
  /** 字幕どうしの最短の間隔（秒）。0だと入れ替わりが認識できない */
  minSubtitleGapSec: 0.2,
  /** 1カットの最短の長さ（秒）。これ未満はチラつく */
  minClipSec: 1,
  /** 字幕の最大行数 */
  maxSubtitleLines: 2,
  /** 1行あたりの最大文字数（縦型9:16で読める上限） */
  maxCharsPerLine: 20,
  /**
   * セーフゾーン（1080x1920 基準）。
   * Reels/Shorts は下部にUIが重なるので、字幕はここより上に置く。
   */
  safeZone: { top: 120, bottom: 420, side: 60 },
} as const;

/** 表示文字数（改行は数えない） */
export function charCount(text: string): number {
  return text.replace(/\n/g, "").length;
}

/** 読み速度（文字/秒） */
export function cps(sub: Subtitle): number {
  return charCount(sub.text) / sub.dur;
}

/** その字幕に適用される読み速度・最短表示時間の上限/下限 */
export function limitsFor(sub: Subtitle): { maxCps: number; minSec: number } {
  return sub.kind === "card"
    ? { maxCps: EDIT_RULES.maxCardCps, minSec: EDIT_RULES.minCardSec }
    : { maxCps: EDIT_RULES.maxCps, minSec: EDIT_RULES.minSubtitleSec };
}

export function endOf(x: { at: number; dur: number }): number {
  return x.at + x.dur;
}

export function findPlan(id: string): EditPlan | undefined {
  return PLANS.find(p => p.id.toLowerCase() === id.toLowerCase());
}

/** そのプランが必要とする素材ID（生成すべきショット）。CTAカードなどの null は除く */
export function requiredShots(plan: EditPlan): string[] {
  return [...new Set(plan.clips.map(c => c.shot).filter((s): s is string => s !== null))];
}

/** 素材IDが promptBank に実在するか */
export function shotExists(id: string): boolean {
  return findShot(id) !== undefined;
}

// ---------------------------------------------------------------------------
// 構図の要件（編集設計から導く）
// ---------------------------------------------------------------------------
// 「何秒映るか」「字幕が乗るか」「カメラが動くか」で、必要な絵は変わる。
// それは編集の都合なので promptBank(何が写っているか)ではなく、こちら側で持つ。

/** この静止画を使うクリップ（動画カットの起点になっている場合も拾う） */
function clipsUsing(shotId: string): Clip[] {
  const used: Clip[] = [];
  for (const plan of PLANS) {
    for (const c of plan.clips) {
      if (!c.shot) continue;
      if (c.shot === shotId) used.push(c);
      // V2 の構図要件は、その起点である C5c に効かせる必要がある
      else if (findShot(c.shot)?.sourceStill === shotId) used.push(c);
    }
  }
  return used;
}

/** そのクリップに字幕が重なっている秒数 */
function subtitleCoverSec(clip: Clip, plan: EditPlan): number {
  return plan.subtitles
    .filter(s => s.at < endOf(clip) - 1e-9 && endOf(s) > clip.at + 1e-9)
    .reduce((acc, s) => acc + (Math.min(endOf(s), endOf(clip)) - Math.max(s.at, clip.at)), 0);
}

export const COMPOSE_RULES = {
  /** 字幕がこの割合以上重なるカットは、下1/3を空ける */
  subtitleCoverRatio: 0.6,
  /** これ以下の秒数しか映らないカットは、一目で読める構図にする */
  readFastSec: 1.5,
} as const;

export const COMPOSE_CLAUSES = {
  safeLower:
    "Place the subject and its key action in the upper two thirds of the vertical frame, " +
    "and keep the lower third simple and uncluttered — subtitles are placed there.",
  headroom:
    "Compose with a little extra space around the subject so the shot can be slowly " +
    "pushed in during editing without cropping anything important.",
  readFast:
    "This shot is on screen for only about a second: keep the composition simple and " +
    "the subject large and centered so the emotion reads instantly.",
} as const;

/**
 * その静止画に足すべき構図の指示。
 * 使われていない静止画（タイムラインに出てこないもの）には何も足さない。
 */
export function composeClauses(shotId: string): string[] {
  const clauses: string[] = [];
  const used = clipsUsing(shotId);
  if (used.length === 0) return clauses;

  const needsSafeLower = PLANS.some(plan =>
    plan.clips.some(c => {
      if (!used.includes(c)) return false;
      return subtitleCoverSec(c, plan) / c.dur >= COMPOSE_RULES.subtitleCoverRatio;
    })
  );
  if (needsSafeLower) clauses.push(COMPOSE_CLAUSES.safeLower);

  if (used.some(c => c.move !== "still")) clauses.push(COMPOSE_CLAUSES.headroom);
  if (used.some(c => c.dur <= COMPOSE_RULES.readFastSec)) clauses.push(COMPOSE_CLAUSES.readFast);

  return clauses;
}

// ---------------------------------------------------------------------------
// 書き出し
// ---------------------------------------------------------------------------

function srtTime(sec: number): string {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const rest = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(rest, 3)}`;
}

/** CapCut / Premiere にそのまま読ませる SRT */
export function toSrt(plan: EditPlan): string {
  return plan.subtitles
    .map((sub, i) =>
      `${i + 1}\n${srtTime(sub.at)} --> ${srtTime(endOf(sub))}\n${sub.text}\n`
    )
    .join("\n");
}

/** 編集台本（人がCapCutを触りながら読む形） */
export function toEditSheet(plan: EditPlan): string {
  const lines: string[] = [];
  lines.push(`# ${plan.title}`);
  lines.push("");
  lines.push(`尺: ${plan.totalSec}秒 / カット${plan.clips.length}本 / 字幕${plan.subtitles.length}本`);
  lines.push("");
  lines.push("## タイムライン");
  lines.push("");
  lines.push("| 開始 | 終了 | 素材 | 動き | 意図 |");
  lines.push("|---|---|---|---|---|");
  for (const c of plan.clips) {
    const shot = c.shot ?? "（CapCutで作成）";
    const title = c.shot ? findShot(c.shot)?.title ?? "" : "CTAカード";
    lines.push(
      `| ${c.at.toFixed(1)}s | ${endOf(c).toFixed(1)}s | \`${shot}\` ${title} | ${c.move} | ${c.note} |`
    );
  }
  lines.push("");
  lines.push("## 字幕");
  lines.push("");
  lines.push("| 開始 | 終了 | 話者 | 文字数 | 速度 | 内容 |");
  lines.push("|---|---|---|---|---|---|");
  for (const s of plan.subtitles) {
    lines.push(
      `| ${s.at.toFixed(1)}s | ${endOf(s).toFixed(1)}s | ${s.speaker ?? "—"} | ` +
      `${charCount(s.text)} | ${cps(s).toFixed(1)}字/秒 | ${s.text.replace(/\n/g, " ／ ")} |`
    );
  }
  lines.push("");
  lines.push("## 音");
  lines.push("");
  lines.push("| 秒 | 種別 | 内容 |");
  lines.push("|---|---|---|");
  for (const q of plan.sound) {
    lines.push(`| ${q.at.toFixed(1)}s | ${q.kind} | ${q.what} |`);
  }
  lines.push("");
  lines.push("## 必要な素材");
  lines.push("");
  lines.push(requiredShots(plan).map(s => `\`${s}\``).join(" / "));
  return lines.join("\n");
}
