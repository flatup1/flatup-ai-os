/**
 * 量産バッチの計画づくり（純関数のみ。ネットワークもファイルI/Oも触らない）。
 *
 * 「何本つくるか」「いくらかかるか」「もう出来ているものはどれか」を
 * 実行前にすべて確定させる。事故（予算超過・二重生成）はここで止める。
 */

import { join } from "node:path";
import type { Scene } from "./scenes.js";
import { buildScenePrompt } from "./scenes.js";

export interface Job {
  /** ファイル名にも使う一意なラベル */
  label: string;
  sceneKey: string;
  sceneJp: string;
  /** 同じ場面の別テイクを区別する種。記録しておくと当たりを再現できる */
  seed: number;
  prompt: string;
  captionJa: string;
  /** 保存先の絶対パス */
  file: string;
}

export interface PlanOptions {
  scenes: Scene[];
  /** 1場面あたりのテイク数（seed違い） */
  takes: number;
  seconds: number;
  /** seed の起点。同じ値なら何度でも同じ組み合わせを再現できる */
  seedBase: number;
  outDir: string;
}

/** 1本あたりの想定コスト（USD）。fal の Hailuo 系 6秒がおよそ $0.28 */
export function costPerClipUsd(): number {
  const v = Number(process.env.FACTORY_COST_PER_CLIP_USD);
  return Number.isFinite(v) && v > 0 ? v : 0.28;
}

/** バッチ全体の想定コスト（USD） */
export function estimateCostUsd(clips: number, perClip = costPerClipUsd()): number {
  return Math.round(clips * perClip * 100) / 100;
}

/**
 * 場面 × テイク数 でジョブを並べる。
 * 場面ごとに連番ではなく seedBase からの通し番号にして、
 * 「どのseedで当たったか」を台帳から追えるようにする。
 */
export function planJobs(opts: PlanOptions): Job[] {
  const { scenes, takes, seconds, seedBase, outDir } = opts;
  if (takes < 1) throw new Error("takes は1以上にしてください");
  const jobs: Job[] = [];
  for (const scene of scenes) {
    for (let t = 0; t < takes; t++) {
      const seed = seedBase + t;
      const label = `${scene.key}_s${seed}`;
      jobs.push({
        label,
        sceneKey: scene.key,
        sceneJp: scene.jp,
        seed,
        prompt: buildScenePrompt(scene, seconds),
        captionJa: scene.captionJa,
        file: join(outDir, `${label}.mp4`),
      });
    }
  }
  return jobs;
}

/**
 * すでに出来ている本数を除いた「これから作るジョブ」を返す。
 * 途中でセッションが切れても、同じコマンドを打てば続きから再開できる。
 */
export function remainingJobs(jobs: Job[], existing: Set<string>, force = false): Job[] {
  if (force) return jobs;
  return jobs.filter(j => !existing.has(j.file));
}

export interface BudgetCheck {
  ok: boolean;
  clips: number;
  estimateUsd: number;
  budgetUsd?: number;
  message: string;
}

/** 予算ガード。上限を超えるなら実行前に止める（1本ずつ止めない＝途中で中途半端に課金しない） */
export function checkBudget(clips: number, budgetUsd?: number): BudgetCheck {
  const estimateUsd = estimateCostUsd(clips);
  const yen = Math.round(estimateUsd * 155);
  if (budgetUsd === undefined) {
    return {
      ok: true,
      clips,
      estimateUsd,
      message: `${clips}本 / 想定 $${estimateUsd.toFixed(2)}（約${yen}円）`,
    };
  }
  const ok = estimateUsd <= budgetUsd;
  return {
    ok,
    clips,
    estimateUsd,
    budgetUsd,
    message: ok
      ? `${clips}本 / 想定 $${estimateUsd.toFixed(2)}（約${yen}円） ≤ 上限 $${budgetUsd.toFixed(2)}`
      : `想定 $${estimateUsd.toFixed(2)}（約${yen}円）が上限 $${budgetUsd.toFixed(2)} を超えます。` +
        `--takes を減らすか --budget を上げてください`,
  };
}
