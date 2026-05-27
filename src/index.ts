import { runRoute, listRoutes, routes } from "./ai/router.js";
import { saveLog } from "./utils/saveLog.js";
import {
  sanitizePii,
  maskPiiForLog,
  summarizeHits,
  type MaskStyle,
} from "./utils/sanitizePii.js";

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h" || args[0] === "--list") {
  console.log(`FLATUP AI OS — AIKA 下書きエンジン

Usage:
  npm run dev -- <route> "<入力>"

Routes:
${listRoutes()}

例:
  npm run dev -- line_reply "${routes.line_reply.example}"
  npm run dev -- sns_post   "${routes.sns_post.example}"
  npm run dev -- risk_check "${routes.risk_check.example}"

ヒント:
  - .env.example をコピーして .env を作り、OPENROUTER_API_KEY を入れてください。
  - API キーがない状態でも、生成されるプロンプトの dry-run プレビューが表示されます。
  - 出力は logs/ 配下に保存される際、本番 LINE Bot と同じく PII が部分マスクされます。`);
  process.exit(args.length === 0 ? 1 : 0);
}

const [routeName, ...inputParts] = args;
const rawInput = inputParts.join(" ").trim();

if (!rawInput) {
  console.error(`入力が空です。例: npm run dev -- ${routeName} "..."`);
  process.exit(1);
}

// --- 動作モード判定(本番 line_webhook.py に揃える) ---
//
// 既定:
//   - AI 投入前のサニタイズ: OFF(本番と同じ。AIKA が元の文脈で判断できるように)
//   - ログ保存時のサニタイズ: ON / partial スタイル(本番 mask_pii と同じ部分マスク)
//
// 環境変数:
//   - AIKA_SANITIZE_PII=false ... 全体オフ(デバッグ用)
//   - AIKA_SANITIZE_BEFORE_AI=true ... AI 投入前もマスク(より安全寄り)
//   - AIKA_PII_STYLE=redact ... ログマスクを [phone] / [email] 形式に
//   - AIKA_SANITIZE_NAMES=true ... 氏名+敬称もマスク(opt-in、誤検知あり)
const sanitizeEnabled = process.env.AIKA_SANITIZE_PII !== "false";
const sanitizeBeforeAi = process.env.AIKA_SANITIZE_BEFORE_AI === "true";
const sanitizeNames = process.env.AIKA_SANITIZE_NAMES === "true";
const logStyle: MaskStyle = process.env.AIKA_PII_STYLE === "redact" ? "redact" : "partial";

// --- AI 投入前のサニタイズ(opt-in) ---
const inputForAi = sanitizeEnabled && sanitizeBeforeAi
  ? sanitizePii(rawInput, { nameHonorific: sanitizeNames, style: "redact" })
  : { text: rawInput, hits: [] };

if (inputForAi.hits.length > 0) {
  console.error(`[pii] 入力から ${inputForAi.hits.length} 個マスク (${summarizeHits(inputForAi.hits)})`);
}

try {
  const result = await runRoute(routeName, inputForAi.text);

  // 標準出力にはそのまま返す(オーナーが画面で見るため)。
  // 個人情報をマスクして見えなくしすぎるとレビューしづらいので。
  console.log(result);

  if (process.env.AIKA_LOG_OUTPUT !== "false") {
    // --- ログ保存前: partial スタイルで部分マスク(本番互換) ---
    const inputForLog = sanitizeEnabled
      ? maskPiiForLog(rawInput, { nameHonorific: sanitizeNames }).text
      : rawInput;
    const outputForLog = sanitizeEnabled
      ? sanitizePii(result, { nameHonorific: sanitizeNames, style: logStyle }).text
      : result;

    const path = await saveLog(routeName, inputForLog, outputForLog);
    console.error(`\n[saved] ${path}`);
  }
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\n[error] ${msg}`);
  process.exit(1);
}
