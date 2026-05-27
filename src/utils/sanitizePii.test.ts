/**
 * sanitizePii の軽量アサーション。依存なし。
 * 実行: `npm run test:pii`
 *
 * AssertionError で落ちると tsx の exit code が非ゼロになる。
 * 緑のときだけ "all PII tests passed" を出す。
 */

import assert from "node:assert/strict";
import { sanitizePii } from "./sanitizePii.js";

interface Case {
  name: string;
  input: string;
  expectMasked: string[]; // text に含まれているはずのマスクトークン
  expectKept?: string[]; // text に残っているはずの非PII文字列
  options?: Parameters<typeof sanitizePii>[1];
  expectHits?: number;
}

const cases: Case[] = [
  // --- email ---
  {
    name: "email — シンプル",
    input: "返信先 john.doe+gym@example.co.jp までお願いします",
    expectMasked: ["[email]"],
    expectKept: ["返信先", "までお願いします"],
    expectHits: 1,
  },

  // --- 電話 ---
  {
    name: "電話 — 携帯ハイフン",
    input: "携帯 090-1234-5678 にご連絡ください",
    expectMasked: ["[phone]"],
    expectHits: 1,
  },
  {
    name: "電話 — 連結",
    input: "ジム代表 09012345678 まで",
    expectMasked: ["[phone]"],
    expectHits: 1,
  },
  {
    name: "電話 — 固定",
    input: "代表 03-1234-5678",
    expectMasked: ["[phone]"],
    expectHits: 1,
  },
  {
    name: "電話 — 国際",
    input: "海外から +81-90-1234-5678",
    expectMasked: ["[phone]"],
    expectHits: 1,
  },

  // --- クレカ ---
  {
    name: "credit_card — 16桁ハイフン",
    input: "番号は 4111-1111-1111-1111 です",
    expectMasked: ["[credit_card]"],
    expectHits: 1,
  },

  // --- マイナンバー ---
  {
    name: "my_number — 12桁ハイフン",
    input: "マイナンバー 1234-5678-9012 を控えました",
    expectMasked: ["[my_number]"],
    expectHits: 1,
  },

  // --- 複合 ---
  {
    name: "複合 — email と電話と通常文",
    input: "問い合わせ来ました。tanaka@example.com / 090-1111-2222 / 体験希望",
    expectMasked: ["[email]", "[phone]"],
    expectKept: ["問い合わせ来ました", "体験希望"],
    expectHits: 2,
  },

  // --- opt-in: 郵便番号 ---
  {
    name: "postal_code — 既定 OFF",
    input: "〒286-0011 千葉県成田市",
    expectMasked: [], // OFF なので残る
    expectKept: ["286-0011"],
    expectHits: 0,
  },
  {
    name: "postal_code — 明示 ON",
    input: "〒286-0011 千葉県成田市",
    options: { postalCode: true },
    expectMasked: ["[postal_code]"],
    expectHits: 1,
  },

  // --- opt-in: 氏名 ---
  {
    name: "name_honorific — 既定 OFF",
    input: "田中さんから問い合わせ",
    expectMasked: [],
    expectKept: ["田中さん"],
    expectHits: 0,
  },
  {
    name: "name_honorific — 明示 ON",
    input: "田中さんから連絡。鈴木様にも転送。",
    options: { nameHonorific: true },
    expectMasked: ["[氏名]さん", "[氏名]様"],
    expectHits: 2,
  },

  // --- false-positive 防止 ---
  {
    name: "通常の数字列(日付)はマスクしない",
    input: "2024年5月11日に体験しました",
    expectMasked: [],
    expectKept: ["2024年5月11日に体験しました"],
    expectHits: 0,
  },
  {
    name: "短い数字(価格)はマスクしない",
    input: "入会金10000円、レディース8800円",
    expectMasked: [],
    expectKept: ["10000円", "8800円"],
    expectHits: 0,
  },
  {
    name: "PII を含まない通常文",
    input: "明日18時に体験したいです。初心者でも大丈夫ですか?",
    expectMasked: [],
    expectKept: ["明日18時に体験したいです"],
    expectHits: 0,
  },

  // --- 回帰テスト ---
  {
    name: "回帰: モデル ID(日付サフィックス)は phone と誤検知しない",
    input: "Model: claude-opus-4-1-20250805 を使用中",
    expectMasked: [],
    expectKept: ["claude-opus-4-1-20250805"],
    expectHits: 0,
  },
  {
    name: "回帰: 日付 (20240511) は phone と誤検知しない",
    input: "20240511 に体験",
    expectMasked: [],
    expectKept: ["20240511 に体験"],
    expectHits: 0,
  },
  {
    name: "回帰: 価格表 (10000) は phone と誤検知しない",
    input: "入会金は 10000 円、月会費は 8800 円です",
    expectMasked: [],
    expectKept: ["10000 円", "8800 円"],
    expectHits: 0,
  },

  // --- partial スタイル (本番 mask_pii 互換) ---
  {
    name: "partial — 携帯電話は先頭3桁+末尾4桁を残す",
    input: "携帯 090-1234-5678 まで",
    options: { style: "partial" },
    expectMasked: ["090-****-5678"],
    expectKept: ["携帯", "まで"],
    expectHits: 1,
  },
  {
    name: "partial — 固定電話 03-1234-5678 も後ろ4桁残し",
    input: "代表 03-1234-5678 です",
    options: { style: "partial" },
    expectMasked: ["031-****-5678"], // 連結すると031-2345-5678 形に正規化される(digits ベース)
    expectHits: 1,
  },
  {
    name: "partial — email は1文字+ドメインを残す",
    input: "tanaka.foo+gym@example.co.jp までお願いします",
    options: { style: "partial" },
    expectMasked: ["t****@example.co.jp"],
    expectKept: ["までお願いします"],
    expectHits: 1,
  },
  {
    name: "partial — クレカは末尾4桁残し",
    input: "番号 4111-1111-1111-1234 で決済",
    options: { style: "partial" },
    expectMasked: ["****-****-****-1234"],
    expectHits: 1,
  },
  {
    name: "partial — マイナンバーは末尾4桁残し",
    input: "個人番号 1234-5678-9012 を控えました",
    options: { style: "partial" },
    expectMasked: ["****-****-9012"],
    expectHits: 1,
  },
  {
    name: "partial — 国際電話は redact 側に倒す",
    input: "海外 +81-90-1234-5678 から",
    options: { style: "partial" },
    expectMasked: ["[phone-intl]"],
    expectHits: 1,
  },
  {
    name: "partial — 複合(email + phone)",
    input: "問い合わせ tanaka@example.com / 090-1111-2222",
    options: { style: "partial" },
    expectMasked: ["t****@example.com", "090-****-2222"],
    expectHits: 2,
  },
];

let pass = 0;
let fail = 0;
const failures: string[] = [];

for (const c of cases) {
  try {
    const result = sanitizePii(c.input, c.options);

    for (const tok of c.expectMasked) {
      assert.ok(
        result.text.includes(tok),
        `expected masked token "${tok}" in output, got: ${result.text}`
      );
    }
    for (const kept of c.expectKept ?? []) {
      assert.ok(
        result.text.includes(kept),
        `expected kept text "${kept}" in output, got: ${result.text}`
      );
    }
    if (c.expectHits !== undefined) {
      assert.equal(
        result.hits.length,
        c.expectHits,
        `expected ${c.expectHits} hits, got ${result.hits.length}: ${JSON.stringify(result.hits)}`
      );
    }
    pass++;
  } catch (err) {
    fail++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`✗ ${c.name}\n   ${msg}`);
  }
}

if (fail === 0) {
  console.log(`✓ all PII tests passed (${pass} cases)`);
  process.exit(0);
} else {
  console.error(`✗ ${fail} of ${pass + fail} cases failed:\n`);
  failures.forEach(f => console.error(f + "\n"));
  process.exit(1);
}
