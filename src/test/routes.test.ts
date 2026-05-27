/**
 * ルート一覧の回帰テスト。
 *
 * - 全 10 ルートを dry-run (OPENROUTER_API_KEY なし) で 1 回ずつ叩く
 * - 戻り値が dry-run プレビュー shape を満たすこと
 * - 未知ルート名は throw すること
 *
 * 実行: `npm run test:routes`
 * 環境: `OPENROUTER_API_KEY=` を空にして実 API 呼び出しを止める。
 */

import assert from "node:assert/strict";
import { runRoute, routes } from "../ai/router.js";

// 安全装置: テスト中に実 API を叩かない
if (process.env.OPENROUTER_API_KEY) {
  console.error(
    "⚠️  OPENROUTER_API_KEY が設定されています。テストはコスト発生を避けるため空にして実行してください。"
  );
  console.error("   例: OPENROUTER_API_KEY= npm run test:routes");
  process.exit(2);
}

let pass = 0;
let fail = 0;
const failures: string[] = [];

function record(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      pass++;
    })
    .catch((err: unknown) => {
      fail++;
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`✗ ${name}\n   ${msg}`);
    });
}

// 1) 既知ルート全部が dry-run で落ちずに走る + 構造アサーション
for (const route of Object.keys(routes) as Array<keyof typeof routes>) {
  await record(`route:${route} returns dry-run preview`, async () => {
    const testInput = `テスト入力 ${route}`;
    const out = await runRoute(route, testInput);

    assert.ok(out.startsWith("[DRY-RUN]"), `should start with [DRY-RUN], got: ${out.slice(0, 40)}`);
    assert.ok(out.includes("Model: "), "should include `Model:` line");
    assert.ok(out.includes("Endpoint: "), "should include `Endpoint:` line");
    assert.ok(out.includes("max_tokens:"), "should include `max_tokens:` info");
    assert.ok(out.includes("=== System (preview) ==="), "should include `=== System (preview) ===` header");
    assert.ok(out.includes("=== User ==="), "should include `=== User ===` header");
    assert.ok(out.includes("AIKA"), "persona ヘッダ `AIKA` が含まれていない");
    assert.ok(out.includes(testInput), `user input \"${testInput}\" がエコーされていない`);
  });
}

// 2) モデルは本番と同じ Haiku 4.5 で起動している
await record("default model is OpenRouter Haiku 4.5", async () => {
  const out = await runRoute("line_reply", "テスト");
  assert.ok(
    out.includes("anthropic/claude-haiku-4-5"),
    `expected anthropic/claude-haiku-4-5 in output, got: ${out.match(/Model: \S+/)?.[0]}`
  );
});

// 3) エンドポイントは OpenRouter
await record("endpoint points to OpenRouter", async () => {
  const out = await runRoute("line_reply", "テスト");
  assert.ok(
    out.includes("openrouter.ai/api/v1/chat/completions"),
    `expected OpenRouter endpoint, got: ${out.match(/Endpoint: \S+/)?.[0]}`
  );
});

// 4) 未知ルート名は throw
await record("unknown route throws", async () => {
  await assert.rejects(
    () => runRoute("nonexistent_route", "test"),
    /Unknown route/,
    "未知ルートは `Unknown route` で reject されるべき"
  );
});

// 5) System プレビューに固定知識 (data/*.md の見出し例) が混ざっている
await record("system preview includes data knowledge", async () => {
  const out = await runRoute("line_reply", "テスト");
  assert.ok(
    out.includes("世界一やさしい格闘技ジム") || out.includes("FLATUP GYM"),
    "固定知識(brand line) が System プレビューに反映されていない"
  );
});

// --- 集計 ---
if (fail === 0) {
  console.log(`✓ all route tests passed (${pass} cases)`);
  process.exit(0);
} else {
  console.error(`✗ ${fail} of ${pass + fail} cases failed:\n`);
  failures.forEach(f => console.error(f + "\n"));
  process.exit(1);
}
