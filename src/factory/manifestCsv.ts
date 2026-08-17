/**
 * manifest.csv の読み書き（Excel / Googleスプレッドシートで開ける形）。
 *
 * 1本 = 1行。人が memo と judge 欄に手で書き込む前提なので、
 * 読み込み側は「人が編集したあと」でも壊れないようにしてある。
 */

export interface ManifestRow {
  /** 001, 002, … */
  id: string;
  scene: string;
  /** 使った基準画像（ファイル名 or なし） */
  image: string;
  /** 使ったプロンプトのファイル名 */
  prompt: string;
  model: string;
  seed: string;
  /** ok / failed */
  status: string;
  /** 保存先（成功時） */
  file: string;
  /** A / B / C を人が書く欄 */
  judge: string;
  /** 気づきを人が書く欄 */
  memo: string;
}

export const MANIFEST_COLUMNS: Array<keyof ManifestRow> = [
  "id",
  "scene",
  "image",
  "prompt",
  "model",
  "seed",
  "status",
  "file",
  "judge",
  "memo",
];

function escapeCell(v: string): string {
  const s = v ?? "";
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: ManifestRow[]): string {
  const head = MANIFEST_COLUMNS.join(",");
  const body = rows.map(r => MANIFEST_COLUMNS.map(c => escapeCell(r[c] ?? "")).join(","));
  return [head, ...body].join("\n") + "\n";
}

/** 引用符つきCSVを読む（人が memo に , や改行を書いても壊れない） */
export function parseCsv(text: string): ManifestRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += c;
      }
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") {
      cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  if (rows.length === 0) return [];

  const head = rows[0].map(h => h.trim());
  return rows
    .slice(1)
    .filter(r => r.some(c => c.trim() !== ""))
    .map(r => {
      const obj = {} as ManifestRow;
      for (const col of MANIFEST_COLUMNS) {
        const idx = head.indexOf(col);
        obj[col] = idx >= 0 ? (r[idx] ?? "") : "";
      }
      return obj;
    });
}
