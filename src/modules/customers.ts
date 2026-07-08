/**
 * customers.csv の読み取りと「LINE優先タグ」判定。
 *
 * 背景（引き継ぎ正本 §7）:
 * - LINE公式アカウント（無料プラン）では 1人につきタグは優先1個だけ。
 * - customers.csv 側は複数分類を持てる（line_tag=優先1個 + sub_tags=補助分類）。
 * - 毎朝レポートに「タグ付け替えが必要な人」を出す。実際の付け替えは人間がスマホで行う。
 *
 * このモジュールは判定ロジックだけ。LINEへの送信・タグ操作は一切しない（AI安全ルール）。
 * 実データ data/customers.csv は PII のため .gitignore 済み。列定義は customers.template.csv 参照。
 */

/** LINE公式に付ける優先タグ。上から優先度が高い。空文字＝タグなし。 */
export const LINE_TAG_PRIORITY = [
  "要オーナー確認",
  "体験予約済み",
  "体験済み未入会",
  "2週間来ていない",
  "口コミ候補",
] as const;

export type LineTag = (typeof LINE_TAG_PRIORITY)[number] | "";

/** ファネル段階。line_tag はここから機械的に導出できる（要オーナー確認・口コミ候補は明示フラグ）。 */
export type FunnelStage =
  | "新規"
  | "体験予約済み"
  | "体験済み未入会"
  | "会員"
  | "休眠"
  | "退会";

export interface Customer {
  id: string;
  nickname: string;
  member_type: string; // kids / ladies / men / ""(見込み)
  funnel_stage: FunnelStage;
  last_visit: string; // YYYY-MM-DD or ""
  owner_review: boolean; // 要オーナー確認フラグ（退会・違約金・クレーム・持病など）
  review_candidate: boolean; // 口コミ候補フラグ
  line_tag: LineTag; // 今LINE公式に付いているタグ（人間が最後に付けた値）
  sub_tags: string[]; // 補助分類（キッズ / レディース / 紹介候補 など）
  notes: string;
}

const DORMANT_DAYS = 14; // 「2週間来ていない」の閾値

/** last_visit から today までの経過日数。片方でも不正なら null。 */
export function daysSince(lastVisit: string, today: string): number | null {
  if (!lastVisit) return null;
  const a = Date.parse(`${lastVisit}T00:00:00Z`);
  const b = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.floor((b - a) / 86_400_000);
}

/**
 * その人に「本来付くべき」優先タグを1個だけ返す。引き継ぎ正本 §7 の優先順位に従う。
 * 要オーナー確認 → 体験予約済み → 体験済み未入会 → 2週間来ていない → 口コミ候補 → なし
 */
export function deriveLineTag(c: Customer, today: string): LineTag {
  if (c.owner_review) return "要オーナー確認";
  if (c.funnel_stage === "体験予約済み") return "体験予約済み";
  if (c.funnel_stage === "体験済み未入会") return "体験済み未入会";
  if (c.funnel_stage === "会員") {
    const d = daysSince(c.last_visit, today);
    if (d !== null && d >= DORMANT_DAYS) return "2週間来ていない";
  }
  if (c.review_candidate) return "口コミ候補";
  return "";
}

export interface RetagItem {
  id: string;
  nickname: string;
  current: LineTag;
  correct: LineTag;
}

/** 現在の line_tag と本来のタグが食い違う人（＝人間が付け替えるべき人）を抽出。 */
export function findRetagNeeded(customers: Customer[], today: string): RetagItem[] {
  const out: RetagItem[] = [];
  for (const c of customers) {
    const correct = deriveLineTag(c, today);
    if (c.line_tag !== correct) {
      out.push({ id: c.id, nickname: c.nickname, current: c.line_tag, correct });
    }
  }
  return out;
}

// --- CSV パース（依存なし。カンマ区切り、値内カンマは想定しない簡易版）---

const HEADERS = [
  "id",
  "nickname",
  "member_type",
  "funnel_stage",
  "last_visit",
  "owner_review",
  "review_candidate",
  "line_tag",
  "sub_tags",
  "notes",
] as const;

function parseBool(v: string): boolean {
  const t = v.trim().toLowerCase();
  return t === "yes" || t === "true" || t === "1";
}

/**
 * customers.csv 本文をパースする。1行目はヘッダ。
 * sub_tags は「;」区切り。空行は無視。未知の funnel_stage/line_tag はそのまま通す（呼び出し側で検証）。
 */
export function parseCustomersCsv(csv: string): Customer[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  const missing = HEADERS.filter((h) => !header.includes(h));
  if (missing.length > 0) {
    throw new Error(`customers.csv: 必須列が不足しています: ${missing.join(", ")}`);
  }
  const idx = (name: string) => header.indexOf(name);
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const get = (name: string) => (cells[idx(name)] ?? "").trim();
    return {
      id: get("id"),
      nickname: get("nickname"),
      member_type: get("member_type"),
      funnel_stage: get("funnel_stage") as FunnelStage,
      last_visit: get("last_visit"),
      owner_review: parseBool(get("owner_review")),
      review_candidate: parseBool(get("review_candidate")),
      line_tag: get("line_tag") as LineTag,
      sub_tags: get("sub_tags")
        ? get("sub_tags").split(";").map((s) => s.trim()).filter(Boolean)
        : [],
      notes: get("notes"),
    };
  });
}
