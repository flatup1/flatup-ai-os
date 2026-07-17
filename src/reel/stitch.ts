/**
 * 生成した複数クリップを1本のリール動画に自動連結する。
 *
 * 依存追加なし: システムの ffmpeg CLI を子プロセスで呼ぶ(concat demuxer)。
 * 同じモデル・同じ起点画像から生成したクリップは解像度もコーデックも揃うため、
 * 再エンコードなし(-c copy)で無劣化・一瞬で連結できる。
 *
 * ffmpeg が無い環境では hasFfmpeg() が false を返すので、呼び側で導入案内を出す。
 */

import { execFile } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * concat demuxer 用リストファイルの本文を作る。
 * パスは単一引用符で囲み、内部の ' は '\'' でエスケープする(ffmpeg の仕様)。
 */
export function buildConcatList(files: string[]): string {
  return files.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join("\n") + "\n";
}

/** ffmpeg concat の引数を組み立てる(同一コーデック前提でストリームコピー) */
export function stitchArgs(listPath: string, outPath: string): string[] {
  return ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", "-movflags", "+faststart", outPath];
}

/** ffmpeg が使えるか(未導入なら連結をスキップして案内するため) */
export async function hasFfmpeg(): Promise<boolean> {
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * クリップ群を1本に連結して outPath に書き出す。
 * listPath は一時ファイル(連結後に削除)。ffmpeg のエラーはそのまま throw する。
 */
export async function stitchClips(files: string[], outPath: string, listPath: string): Promise<void> {
  if (files.length < 2) {
    throw new Error("連結には2本以上のクリップが必要です");
  }
  await writeFile(listPath, buildConcatList(files));
  try {
    await execFileAsync("ffmpeg", stitchArgs(listPath, outPath), { maxBuffer: 32 * 1024 * 1024 });
  } finally {
    await unlink(listPath).catch(() => {});
  }
}
