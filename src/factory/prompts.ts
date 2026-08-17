/**
 * プロンプト置き場（prompts/reels/*.md）の読み書き。
 *
 * 場面バンク（src/factory/scenes.ts）は「型」の正本、
 * prompts/reels/*.md は「現場で手直しできる実体」。
 *
 * 読み込みの優先順位:
 *   1. prompts/reels/<場面>.md がある → その中身を使う（JINが直せる）
 *   2. 無ければ場面バンクから組み立てる（初期状態）
 *
 * md は ```prompt フェンスの中だけを読む。見出しやコメントは自由に書いてよい。
 */

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import type { Scene } from "./scenes.js";
import { buildScenePrompt } from "./scenes.js";

export function promptsDir(cwd = process.cwd()): string {
  return join(cwd, "prompts", "reels");
}

export function promptPath(sceneKey: string, cwd = process.cwd()): string {
  return join(promptsDir(cwd), `${sceneKey}.md`);
}

/** md の本文を作る（人が読める見出し＋機械が読むフェンス） */
export function renderPromptMd(scene: Scene, seconds = 6): string {
  return [
    `# ${scene.key} — ${scene.jp}`,
    ``,
    `- キャラの出典: ${scene.source === "bible" ? "ANIMATION BIBLE v3.0（本編正本）" : "flatup_anime_studio.md（SNSリール用）"}`,
    `- キャプション下書き: ${scene.captionJa}`,
    ``,
    `> このファイルが**生成に使われる実体**です。下のフェンスの中だけが読まれます。`,
    `> 型（世界観 → Timeline → Audio → 禁止事項）の順番は変えないでください。`,
    `> 消したいときはファイルごと消せば、場面バンクの内容に戻ります。`,
    ``,
    "```prompt",
    buildScenePrompt(scene, seconds),
    "```",
    ``,
  ].join("\n");
}

/** フェンスの中身を取り出す */
export function extractPrompt(md: string): string | undefined {
  const m = md.match(/```prompt\r?\n([\s\S]*?)```/);
  return m ? m[1].trim() : undefined;
}

/** 場面バンクから md を書き出す（既存は上書きしない。--force のときだけ上書き） */
export async function exportPrompts(
  scenes: Scene[],
  opts: { seconds?: number; force?: boolean; cwd?: string } = {}
): Promise<{ written: string[]; skipped: string[] }> {
  const cwd = opts.cwd ?? process.cwd();
  await mkdir(promptsDir(cwd), { recursive: true });
  const written: string[] = [];
  const skipped: string[] = [];
  for (const scene of scenes) {
    const path = promptPath(scene.key, cwd);
    const exists = await access(path).then(() => true, () => false);
    if (exists && !opts.force) {
      skipped.push(path);
      continue;
    }
    await writeFile(path, renderPromptMd(scene, opts.seconds ?? 6), "utf8");
    written.push(path);
  }
  return { written, skipped };
}

export interface LoadedPrompt {
  prompt: string;
  /** どこから読んだか（manifestに残す） */
  sourceFile: string;
}

/** 実際に使うプロンプトを決める（md優先、無ければ場面バンク） */
export async function loadScenePrompt(
  scene: Scene,
  seconds = 6,
  cwd = process.cwd()
): Promise<LoadedPrompt> {
  const path = promptPath(scene.key, cwd);
  const md = await readFile(path, "utf8").catch(() => undefined);
  if (md === undefined) {
    return { prompt: buildScenePrompt(scene, seconds), sourceFile: "(場面バンク)" };
  }
  const body = extractPrompt(md);
  if (!body) {
    throw new Error(
      `${path} に \`\`\`prompt フェンスがありません。` +
        `消してから npm run reel:batch -- --export-prompts でひな形を作り直してください`
    );
  }
  return { prompt: body, sourceFile: `${scene.key}.md` };
}
