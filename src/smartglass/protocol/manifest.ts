/**
 * グラスが出すファイル一覧の読み取り。
 *
 * 2つの流儀が実際に存在するので、両方読めるようにする。
 *  A) CyanBridge / Android: GET http://<ip>/files/media.config
 *     → 1行1ファイルのテキスト（区切りは , か空白）
 *  B) ebowwa SDK / iOS:     GET http://<ip>/manifest.json
 *     → {"files":[{"name":..., "size":..., "time":...}]}
 *
 * どちらで来ても MediaItem[] に揃える。
 */

import type { MediaItem, MediaKind } from "../types.js";

/** 一覧の取得先。上から順に試す。 */
export const MANIFEST_PATHS = ["/files/media.config", "/manifest.json"] as const;

/** ファイルの取得先を作る。 */
export function mediaFileUrl(baseUrl: string, fileName: string): string {
  return `${baseUrl.replace(/\/$/, "")}/files/${encodeURIComponent(fileName)}`;
}

const PHOTO_EXT = ["jpg", "jpeg", "png", "heic", "heif", "webp"];
const VIDEO_EXT = ["mp4", "mov", "m4v", "avi"];
const AUDIO_EXT = ["opus", "wav", "mp3", "m4a", "aac", "amr"];

/** 拡張子から種類を決める。分からないものは写真あつかいにしない（捨てる）。 */
export function kindFromFileName(fileName: string): MediaKind | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (PHOTO_EXT.includes(ext)) return "photo";
  if (VIDEO_EXT.includes(ext)) return "video";
  if (AUDIO_EXT.includes(ext)) return "audio";
  return null;
}

/** 同じ写真を二度取り込まないための ID。 */
export function mediaId(fileName: string, sizeBytes: number): string {
  return `${fileName}:${sizeBytes}`;
}

/**
 * ファイル名から撮影時刻を読む。
 * 例: IMG_20260825_101500.jpg / VID20260825101500.mp4 / 20260825_101500.jpg
 * 読めないときは null（呼び出し側が取り込み時刻で埋める）。
 */
export function takenAtFromFileName(fileName: string): number | null {
  const m = fileName.match(/(20\d{2})(\d{2})(\d{2})[_-]?(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

/** 一覧のテキスト（A/B どちらでも）を MediaItem[] にする。 */
export function parseManifest(body: string, now: number = Date.now()): MediaItem[] {
  const trimmed = body.trim();
  if (!trimmed) return [];
  const rows = trimmed.startsWith("{") || trimmed.startsWith("[")
    ? parseJsonManifest(trimmed)
    : parseConfigManifest(trimmed);

  const seen = new Set<string>();
  const items: MediaItem[] = [];
  for (const row of rows) {
    const kind = kindFromFileName(row.fileName);
    if (!kind) continue;
    const id = mediaId(row.fileName, row.sizeBytes);
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({
      id,
      fileName: row.fileName,
      kind,
      sizeBytes: row.sizeBytes,
      takenAt: row.takenAt ?? takenAtFromFileName(row.fileName) ?? now,
      ...(row.durationSec !== undefined ? { durationSec: row.durationSec } : {}),
    });
  }
  // 新しいものが上。
  items.sort((a, b) => b.takenAt - a.takenAt);
  return items;
}

interface RawRow {
  fileName: string;
  sizeBytes: number;
  takenAt?: number;
  durationSec?: number;
}

function parseConfigManifest(body: string): RawRow[] {
  const rows: RawRow[] = [];
  for (const line of body.split(/\r?\n/)) {
    const text = line.trim();
    if (!text || text.startsWith("#") || text.startsWith(";")) continue;
    const parts = text.split(/[,\t]|\s{1,}/).filter((p) => p.length > 0);
    const fileName = parts[0];
    if (!fileName) continue;
    rows.push({ fileName, sizeBytes: toInt(parts[1]) });
  }
  return rows;
}

function parseJsonManifest(body: string): RawRow[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return [];
  }
  const list = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.files)
      ? parsed.files
      : [];
  const rows: RawRow[] = [];
  for (const entry of list) {
    if (typeof entry === "string") {
      rows.push({ fileName: entry, sizeBytes: 0 });
      continue;
    }
    if (!isRecord(entry)) continue;
    const fileName = pickString(entry, ["name", "fileName", "file", "path"]);
    if (!fileName) continue;
    const row: RawRow = {
      fileName: fileName.split("/").pop() ?? fileName,
      sizeBytes: toInt(pickAny(entry, ["size", "sizeBytes", "length"])),
    };
    const time = pickAny(entry, ["time", "takenAt", "date", "mtime", "timestamp"]);
    const takenAt = toEpochMs(time);
    if (takenAt !== null) row.takenAt = takenAt;
    const duration = toInt(pickAny(entry, ["duration", "durationSec"]));
    if (duration > 0) row.durationSec = duration;
    rows.push(row);
  }
  return rows;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  const value = pickAny(obj, keys);
  return typeof value === "string" && value.length > 0 ? value : null;
}

function pickAny(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function toInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** 秒・ミリ秒・ISO文字列のどれで来ても epoch ミリ秒にする。 */
function toEpochMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    // 10桁までは秒とみなす。
    return value < 1e11 ? Math.floor(value * 1000) : Math.floor(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num < 1e11 ? num * 1000 : num;
  }
  return null;
}
