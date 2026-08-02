/**
 * 生成した画像から「採用する1枚」を選んで、正しい場所・正しい名前で保存する。
 *
 *   npm run movie:adopt -- refs     採用した設定画 → assets/movie/ep0/refs/
 *   npm run movie:adopt -- scenes   採用したシーン画 → assets/movie/ep0/stills/<C-id>.png
 *
 * ここを手作業でやると、名前の付け間違いで
 *  - scenes で正本が添付されない（キャラが崩れる）
 *  - cuts の起点画像が見つからない
 * という事故が起きる。1タップで済むようにしてある。
 *
 * macOS ではプレビューで画像を開いてから聞く。
 */

import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { spawn } from "node:child_process";
import { shotsByPhase, type Phase } from "./promptBank.js";

/**
 * 1行ずつ受け取る小さな入力係。
 * readline/promises の question() は、パイプで流し込むと
 * stdin が閉じた時点で以降の呼び出しが落ちる。
 * 届いた行をキューに溜めておき、閉じたら null を返す形にしてある
 * （対話でもパイプでも同じように動く）。
 */
function makeAsker() {
  const rl = createInterface({ input: stdin, output: stdout });
  const buffered: string[] = [];
  const waiting: Array<(line: string | null) => void> = [];
  let closed = false;

  rl.on("line", line => {
    const next = waiting.shift();
    if (next) next(line);
    else buffered.push(line);
  });
  rl.on("close", () => {
    closed = true;
    while (waiting.length) waiting.shift()!(null);
  });

  return {
    ask(prompt: string): Promise<string | null> {
      stdout.write(prompt);
      const line = buffered.shift();
      if (line !== undefined) {
        stdout.write(line + "\n"); // パイプ時も何を選んだか記録に残す
        return Promise.resolve(line);
      }
      if (closed) return Promise.resolve(null);
      return new Promise(resolve => waiting.push(resolve));
    },
    close(): void { rl.close(); },
  };
}

const ASSET_DIR = join(process.cwd(), "assets", "movie", "ep0");
const OUT_ROOT = join(process.cwd(), "output", "movie", "ep0");
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

const phase = (process.argv[2] ?? "").toLowerCase() as Phase;
if (phase !== "refs" && phase !== "scenes") {
  console.error(`使い方: npm run movie:adopt -- <refs|scenes>`);
  process.exit(1);
}

/** 生成物のフォルダ（YYYY-MM-DD）のうち、いちばん新しいもの */
async function latestOutputDir(): Promise<string | undefined> {
  let names: string[];
  try {
    names = await readdir(OUT_ROOT);
  } catch {
    return undefined;
  }
  const dated = names.filter(n => /^\d{4}-\d{2}-\d{2}$/.test(n)).sort();
  return dated.length ? join(OUT_ROOT, dated[dated.length - 1]) : undefined;
}

function isImage(name: string): boolean {
  return IMAGE_EXTS.includes(name.slice(name.lastIndexOf(".")).toLowerCase());
}

/** "C5c-t2.png" → "C5c" / "M1.png" → "M1" */
function baseId(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/-t\d+$/, "");
}

/** macOS ならプレビューで開く（他OSでは何もしない） */
function preview(paths: string[]): void {
  if (process.platform !== "darwin" || paths.length === 0) return;
  spawn("open", ["-a", "Preview", ...paths], { stdio: "ignore", detached: true }).unref();
}

const srcDir = await latestOutputDir();
if (!srcDir) {
  console.error(
    `生成物が見つかりません（${OUT_ROOT}）。\n` +
    `先に npm run movie -- ${phase} を実行してください。`
  );
  process.exit(1);
}

const destDir = phase === "refs" ? join(ASSET_DIR, "refs") : join(ASSET_DIR, "stills");
const wanted = new Set(shotsByPhase(phase).map(s => s.id));

const files = (await readdir(srcDir)).filter(isImage).sort();
const groups = new Map<string, string[]>();
for (const f of files) {
  const id = baseId(f);
  if (!wanted.has(id)) continue;
  const list = groups.get(id) ?? [];
  list.push(f);
  groups.set(id, list);
}

if (groups.size === 0) {
  console.error(
    `${srcDir} に ${phase} の画像がありません。\n` +
    `期待するファイル名: ${[...wanted].slice(0, 3).join(", ")} ...（-t1/-t2 付きも可）`
  );
  process.exit(1);
}

console.log(`\n採用する画像を選びます（${phase}）`);
console.log(`  元: ${srcDir}`);
console.log(`  先: ${destDir}\n`);

await mkdir(destDir, { recursive: true });
const rl = makeAsker();
let adopted = 0;
let skipped = 0;

try {
  for (const shot of shotsByPhase(phase)) {
    const takes = groups.get(shot.id);
    if (!takes || takes.length === 0) {
      console.log(`  ${shot.id.padEnd(5)} — 画像なし。とばします`);
      skipped++;
      continue;
    }

    let chosen: string;
    if (takes.length === 1) {
      chosen = takes[0];
      console.log(`  ${shot.id.padEnd(5)} ${shot.title} → ${chosen}（1枚しかないので自動採用）`);
    } else {
      preview(takes.map(t => join(srcDir, t)));
      console.log(`\n  ${shot.id} ${shot.title}`);
      takes.forEach((t, i) => console.log(`    ${i + 1}) ${t}`));
      const raw = await rl.ask(`  どれを採用しますか？ [1-${takes.length} / s=とばす] `);
      if (raw === null) {
        console.log("\n    → 入力が終わったので、残りはとばします");
        skipped += shotsByPhase(phase).length - adopted - skipped;
        break;
      }
      const ans = raw.trim();
      if (ans.toLowerCase() === "s") {
        console.log("    → とばしました");
        skipped++;
        continue;
      }
      const idx = Number(ans);
      if (!Number.isInteger(idx) || idx < 1 || idx > takes.length) {
        console.log(`    → "${ans}" は選べません。とばしました`);
        skipped++;
        continue;
      }
      chosen = takes[idx - 1];
    }

    // scenes は cuts の起点として名前で引かれるので、必ず <C-id>.png にそろえる。
    // refs はフォルダごと添付されるだけなので、元の名前のままで良い。
    const ext = chosen.slice(chosen.lastIndexOf("."));
    const destName = phase === "scenes" ? `${shot.id}${ext}` : chosen;
    await copyFile(join(srcDir, chosen), join(destDir, destName));
    console.log(`    ✓ ${destName}`);
    adopted++;
  }
} finally {
  rl.close();
}

console.log(`\n採用 ${adopted}件 / とばした ${skipped}件`);
if (phase === "refs" && adopted > 0) {
  console.log("次: npm run movie -- scenes（この正本が毎回添付されます）");
}
if (phase === "scenes" && adopted > 0) {
  const need = ["C1", "C5c", "C5d", "C7"];
  const missing: string[] = [];
  for (const id of need) {
    const hit = await Promise.all(
      IMAGE_EXTS.map(e => stat(join(destDir, `${id}${e}`)).then(() => true).catch(() => false))
    );
    if (!hit.some(Boolean)) missing.push(id);
  }
  if (missing.length) {
    console.log(`\n[warn] 動画カットの起点が未採用: ${missing.join(", ")}`);
    console.log("       この4枚が無いと npm run movie -- cuts が動きません。");
  } else {
    console.log("次: npm run movie -- cuts（起点4枚そろっています）");
  }
}
