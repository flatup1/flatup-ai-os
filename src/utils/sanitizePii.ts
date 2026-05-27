/**
 * PII(個人情報)サニタイザ。
 *
 * 設計方針:
 * - 「誤検知が高くつくところ」だけを高精度パターンでマスクする(email/電話/クレカ/マイナンバー)。
 * - 日本人氏名は誤検知が多い(「今日さん」「明日くん」等)ため既定 OFF、opt-in。
 * - 2 つのマスクスタイル:
 *     - "partial" (本番 line_webhook.py に合わせる既定): 一部を残して人間に判別可能にする
 *         例: 090-1234-5678 → 090-****-5678 / tanaka@example.com → t****@example.com
 *     - "redact" (より安全寄り): 種別だけ残して全消去
 *         例: 090-1234-5678 → [phone] / tanaka@example.com → [email]
 * - 元の文字列も `hits` で返すので、デバッグ時にどこが引っかかったかを追える。
 *
 * 想定運用 (index.ts):
 * - ログ保存前: "partial" でマスク(本番互換、人間がレビューできる)
 * - AI 投入前: 既定オフ(本番に揃える)、`AIKA_SANITIZE_BEFORE_AI=true` で "redact" を強制
 */

export type PiiKind =
  | "email"
  | "credit_card"
  | "my_number"
  | "phone"
  | "postal_code"
  | "name_honorific";

export type MaskStyle = "partial" | "redact";

export interface SanitizeOptions {
  email?: boolean;
  creditCard?: boolean;
  myNumber?: boolean;
  phone?: boolean;
  postalCode?: boolean;
  nameHonorific?: boolean;
  /** 既定 "redact"。"partial" で本番 mask_pii 互換の部分マスク */
  style?: MaskStyle;
}

export interface PiiHit {
  kind: PiiKind;
  original: string;
  masked: string;
}

export interface SanitizeResult {
  text: string;
  hits: PiiHit[];
}

// --- マスク関数 ---

function maskEmail(match: string, style: MaskStyle): string {
  if (style === "redact") return "[email]";
  const at = match.indexOf("@");
  if (at < 1) return "[email]";
  return `${match[0]}****${match.slice(at)}`;
}

function maskPhone(match: string, style: MaskStyle): string {
  if (style === "redact") return "[phone]";
  const digits = match.replace(/\D/g, "");
  if (digits.length < 7) return "[phone]";
  // 先頭 3 桁 + ****-+ 末尾 4 桁。+81 prefix は捨てる(国内表記に正規化)
  // 例: 090-1234-5678 → 090-****-5678
  // 例: +81-90-1234-5678 → +81-****-5678 のようには戻さず、digits ベースで 819 + 5678 になるとミスリーディング
  //     → 国際形式は redact 寄りに倒す
  if (match.startsWith("+")) {
    return "[phone-intl]";
  }
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

function maskCreditCard(match: string, style: MaskStyle): string {
  if (style === "redact") return "[credit_card]";
  const digits = match.replace(/\D/g, "");
  if (digits.length < 8) return "[credit_card]";
  return `****-****-****-${digits.slice(-4)}`;
}

function maskMyNumber(match: string, style: MaskStyle): string {
  if (style === "redact") return "[my_number]";
  const digits = match.replace(/\D/g, "");
  if (digits.length < 8) return "[my_number]";
  return `****-****-${digits.slice(-4)}`;
}

function maskPostalCode(_match: string, style: MaskStyle): string {
  return style === "redact" ? "[postal_code]" : "〒***-****";
}

function maskName(_match: string, style: MaskStyle, groups: string[]): string {
  // 敬称は残す。例: 「田中さん」→「[氏名]さん」
  const honorific = groups[1] ?? "";
  return style === "redact" ? `[氏名]${honorific}` : `**${honorific}`;
}

// --- パターン定義 ---
//
// 桁数の多いものから順に適用する(短いパターンが長い数字列を先食いするのを防ぐ)。
// 例: 16桁のクレカが先に消えないと、phone パターンが頭から食ってしまう。
interface Pattern {
  kind: PiiKind;
  regex: RegExp;
  mask: (match: string, style: MaskStyle, groups: string[]) => string;
  enabledByDefault: boolean;
}

const PATTERNS: Pattern[] = [
  {
    kind: "email",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    mask: maskEmail,
    enabledByDefault: true,
  },
  {
    kind: "credit_card",
    regex: /\b(?:\d[ -]?){12,18}\d\b/g,
    mask: maskCreditCard,
    enabledByDefault: true,
  },
  {
    kind: "my_number",
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    mask: maskMyNumber,
    enabledByDefault: true,
  },
  {
    // 日本の電話番号(末尾 4 桁固定 + 前後 lookaround で日付誤検知を防止)
    kind: "phone",
    regex: /(?<!\d)(?:\+81[-\s]?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4}|0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4})(?!\d)/g,
    mask: maskPhone,
    enabledByDefault: true,
  },
  {
    kind: "postal_code",
    regex: /〒?\s?\d{3}-\d{4}\b/g,
    mask: maskPostalCode,
    enabledByDefault: false,
  },
  {
    // 氏名+敬称 (opt-in)
    kind: "name_honorific",
    regex: /([\p{Script=Han}\p{Script=Katakana}\p{Script=Hiragana}]{1,5})(さん|様|氏|くん|君|ちゃん)/gu,
    mask: maskName,
    enabledByDefault: false,
  },
];

function isEnabled(kind: PiiKind, opts: SanitizeOptions, defaultEnabled: boolean): boolean {
  // SanitizeOptions に non-boolean な style フィールドが入ったため、
  // keyof 経由ではなく明示的に boolean だけを引くマップを作る。
  const flagMap: Record<PiiKind, boolean | undefined> = {
    email: opts.email,
    credit_card: opts.creditCard,
    my_number: opts.myNumber,
    phone: opts.phone,
    postal_code: opts.postalCode,
    name_honorific: opts.nameHonorific,
  };
  const flag = flagMap[kind];
  return flag === undefined ? defaultEnabled : flag;
}

/**
 * 文字列の PII をマスクする。
 * 既定スタイルは "redact"(全マスク)。ログ保存用には "partial" を指定する。
 */
export function sanitizePii(text: string, options: SanitizeOptions = {}): SanitizeResult {
  const style: MaskStyle = options.style ?? "redact";
  const hits: PiiHit[] = [];
  let result = text;

  for (const pat of PATTERNS) {
    if (!isEnabled(pat.kind, options, pat.enabledByDefault)) continue;

    result = result.replace(pat.regex, (...args: unknown[]) => {
      const match = args[0] as string;
      const groups = args.slice(1, -2) as string[];
      const masked = pat.mask(match, style, groups);
      hits.push({ kind: pat.kind, original: match, masked });
      return masked;
    });
  }

  return { text: result, hits };
}

/**
 * 本番 line_webhook.py の mask_pii() 互換ショートカット。
 * ログ保存前の用途。部分マスクで人間がレビューしやすい形にする。
 */
export function maskPiiForLog(text: string, options: Omit<SanitizeOptions, "style"> = {}): SanitizeResult {
  return sanitizePii(text, { ...options, style: "partial" });
}

/**
 * hits を 1 行サマリにする(ログ用)。
 * 例: "phone:1, email:2"
 */
export function summarizeHits(hits: PiiHit[]): string {
  const counts: Record<string, number> = {};
  for (const h of hits) {
    counts[h.kind] = (counts[h.kind] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");
}
