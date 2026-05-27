import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = fileURLToPath(new URL("../data/", import.meta.url));

/**
 * data/*.md を結合して 1 つのキャッシュ可能な知識ブロックを作る。
 * ファイル名がソート済みの場合のみキャッシュは安定するため、呼び出し側で順序を固定すること。
 */
export async function loadKnowledge(files: string[]): Promise<string> {
  const chunks = await Promise.all(
    files.map(async (file) => {
      try {
        const content = await readFile(join(dataDir, file), "utf8");
        return `--- ${file} ---\n${content.trim()}`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return `--- ${file} ---\n(load error: ${msg})`;
      }
    })
  );
  return chunks.join("\n\n");
}
