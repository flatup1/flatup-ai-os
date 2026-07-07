/**
 * customers モジュールの軽量アサーション。依存なし。
 * 実行: `npm run test:customers`
 *
 * テンプレCSV(data/customers.template.csv)もパースできることを併せて確認する。
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  parseCustomersCsv,
  deriveLineTag,
  findRetagNeeded,
  daysSince,
  type Customer,
} from "./customers.js";

const TODAY = "2026-07-07";

function customer(overrides: Partial<Customer>): Customer {
  return {
    id: "x",
    nickname: "n",
    member_type: "",
    funnel_stage: "新規",
    last_visit: "",
    owner_review: false,
    review_candidate: false,
    line_tag: "",
    sub_tags: [],
    notes: "",
    ...overrides,
  };
}

let pass = 0;
let fail = 0;
const failures: string[] = [];

function check(name: string, fn: () => void) {
  try {
    fn();
    pass++;
  } catch (err) {
    fail++;
    failures.push(`✗ ${name}\n   ${err instanceof Error ? err.message : String(err)}`);
  }
}

// --- daysSince ---
check("daysSince — 17日前", () => {
  assert.equal(daysSince("2026-06-20", TODAY), 17);
});
check("daysSince — 空なら null", () => {
  assert.equal(daysSince("", TODAY), null);
});

// --- deriveLineTag 優先順位 ---
check("要オーナー確認が最優先", () => {
  const c = customer({ owner_review: true, funnel_stage: "体験予約済み", review_candidate: true });
  assert.equal(deriveLineTag(c, TODAY), "要オーナー確認");
});
check("体験予約済み", () => {
  assert.equal(deriveLineTag(customer({ funnel_stage: "体験予約済み" }), TODAY), "体験予約済み");
});
check("体験済み未入会", () => {
  assert.equal(deriveLineTag(customer({ funnel_stage: "体験済み未入会" }), TODAY), "体験済み未入会");
});
check("会員かつ14日以上未来館 → 2週間来ていない", () => {
  const c = customer({ funnel_stage: "会員", last_visit: "2026-06-20" });
  assert.equal(deriveLineTag(c, TODAY), "2週間来ていない");
});
check("会員だが最近来ている → タグなし", () => {
  const c = customer({ funnel_stage: "会員", last_visit: "2026-07-06" });
  assert.equal(deriveLineTag(c, TODAY), "");
});
check("会員×未来館より口コミ候補は下位（会員で13日なら口コミ候補）", () => {
  const c = customer({ funnel_stage: "会員", last_visit: "2026-06-25", review_candidate: true });
  // 06-25→07-07 = 12日 <14 なので「2週間来ていない」にはならず、口コミ候補
  assert.equal(deriveLineTag(c, TODAY), "口コミ候補");
});
check("退会者はタグなし", () => {
  assert.equal(deriveLineTag(customer({ funnel_stage: "退会", last_visit: "2026-01-01" }), TODAY), "");
});

// --- findRetagNeeded ---
check("正しいタグが付いていれば付け替え不要", () => {
  const c = customer({ funnel_stage: "体験予約済み", line_tag: "体験予約済み" });
  assert.deepEqual(findRetagNeeded([c], TODAY), []);
});
check("食い違いは付け替え対象", () => {
  const c = customer({ id: "a", funnel_stage: "会員", last_visit: "2026-06-20", line_tag: "口コミ候補" });
  const got = findRetagNeeded([c], TODAY);
  assert.equal(got.length, 1);
  assert.equal(got[0].correct, "2週間来ていない");
  assert.equal(got[0].current, "口コミ候補");
});

// --- CSV パース ---
check("CSVパース — sub_tags は ; 区切り", () => {
  const csv =
    "id,nickname,member_type,funnel_stage,last_visit,owner_review,review_candidate,line_tag,sub_tags,notes\n" +
    "a,ニック,kids,体験済み未入会,2026-07-01,yes,no,体験済み未入会,キッズ;紹介候補,メモ";
  const [c] = parseCustomersCsv(csv);
  assert.equal(c.owner_review, true);
  assert.deepEqual(c.sub_tags, ["キッズ", "紹介候補"]);
});
check("CSVパース — 必須列不足はエラー", () => {
  assert.throws(() => parseCustomersCsv("id,nickname\n1,x"), /必須列が不足/);
});

async function main() {
  // template.csv の実ファイル検証（同期 check とは別に await）
  try {
    const path = fileURLToPath(new URL("../../data/customers.template.csv", import.meta.url));
    const csv = await readFile(path, "utf8");
    const rows = parseCustomersCsv(csv);
    assert.equal(rows.length, 5, `template.csv は5行のはずが ${rows.length} 行`);
    const retag = findRetagNeeded(rows, TODAY);
    assert.equal(retag.length, 3, `付け替え対象は3件のはずが ${retag.length} 件`);
    pass++;
  } catch (err) {
    fail++;
    failures.push(`✗ template.csv 検証\n   ${err instanceof Error ? err.message : String(err)}`);
  }

  if (fail === 0) {
    console.log(`✓ all customers tests passed (${pass} cases)`);
    process.exit(0);
  } else {
    console.error(`✗ ${fail} of ${pass + fail} cases failed:\n`);
    failures.forEach((f) => console.error(f + "\n"));
    process.exit(1);
  }
}

void main();
