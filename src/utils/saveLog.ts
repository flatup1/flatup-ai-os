import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const logMap: Record<string, string> = {
  line_reply: "replies",
  followup: "replies",
  review_request: "replies",
  uizin: "replies",
  sns_post: "sns",
  daily_manager: "daily",
  risk_check: "risks",
  training_manual: "manuals",
  differentiation: "manuals",
  video_script: "videos",
};

function slug(input: string, max = 40): string {
  return input
    .trim()
    .replace(/[\s　\r\n]+/g, "-")
    .replace(/[\\/:*?"<>|]/g, "")
    .slice(0, max);
}

/**
 * 出力を logs/<分類>/<timestamp>__<route>__<input先頭>.md に保存し、相対パスを返す。
 */
export async function saveLog(routeName: string, input: string, content: string): Promise<string> {
  const dirName = logMap[routeName] || "daily";
  const root = fileURLToPath(new URL("../../logs/", import.meta.url));
  const dir = join(root, dirName);
  await mkdir(dir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${timestamp}__${routeName}__${slug(input)}.md`;
  const fullPath = join(dir, filename);

  const body = `---
route: ${routeName}
timestamp: ${new Date().toISOString()}
input: ${input.replace(/\n/g, " ")}
---

${content}
`;

  await writeFile(fullPath, body, "utf8");
  return `logs/${dirName}/${filename}`;
}
