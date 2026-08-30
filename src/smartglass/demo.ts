/**
 * 実機なしで、はじめから終わりまでを目で見るためのデモ。
 *
 *   npm run glasses
 *   npm run glasses -- --flaky     # 途中で切れる状況を作る
 *   npm run glasses -- --json      # 一覧が manifest.json 形式のメガネ
 *
 * ここに出る文言は、そのまま画面に出るものと同じ（i18n.ts 由来）。
 */

import { SmartGlassApp } from "./app.js";
import { MockAiProvider } from "./mock/ai.js";
import { createMockPlatform, type MockOptions } from "./mock/platform.js";
import { T, friendlySize } from "./i18n.js";
import type { HomeView } from "./app.js";

function line(): void {
  console.log("─".repeat(56));
}

function showHome(view: HomeView): void {
  line();
  console.log(`【ホーム】 ${view.statusText}  (${view.statusTone})`);
  if (view.batteryText) console.log(`  ${view.batteryText}`);
  if (view.batteryWarning) console.log(`  ⚠ ${view.batteryWarning}`);
  console.log(
    `  ［ ${view.primaryAction.label} ］  高さ${view.primaryAction.heightDp}dp / 文字${view.fontSizes.button}pt` +
      (view.primaryAction.enabled ? "" : "（いまは押せません）"),
  );
  if (view.progress && view.progress.total > 0) {
    const bar = "█".repeat(Math.round(view.progress.ratio * 20)).padEnd(20, "░");
    console.log(`  ${bar} ${Math.round(view.progress.ratio * 100)}%  ${view.progress.message}`);
  }
  if (view.recent.length > 0) {
    console.log("  最近の写真:");
    for (const item of view.recent) {
      console.log(`    ・${item.fileName}  ${friendlySize(item.sizeBytes)}  (${item.kind})`);
    }
  }
  if (view.pendingCount > 0) console.log(`  あとで取り込む: ${view.pendingCount}件`);
  if (view.error) {
    console.log(`  ✖ ${view.error.what}`);
    console.log(`    → ${view.error.next}`);
    if (view.error.action) console.log(`    ［ ${view.error.action} ］`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options: MockOptions = {
    ...(args.includes("--flaky") ? { failDownloadsUntilAttempt: 1 } : {}),
    ...(args.includes("--json") ? { manifestStyle: "json" as const } : {}),
    ...(args.includes("--empty") ? { batteryPercent: 12 } : {}),
  };

  const platform = createMockPlatform(options);
  const app = new SmartGlassApp(platform, { localAi: new MockAiProvider("local") });
  await app.start();
  // デモでは手順を見せたいので、自動取り込みは切っておく。
  await app.settings.update({ autoTransfer: false });

  console.log(`\n${T.app.name} — デモ（実機なし）\n`);
  showHome(app.home());

  console.log(`\n▶ ［${T.connection.connect}］を押しました`);
  await app.connect();
  showHome(app.home());

  console.log(`\n▶ ［${T.transfer.start}］を押しました`);
  const result = await app.importMedia();
  showHome(app.home());
  console.log(`\n  取り込み: ${result.added}件 / 取り込めず: ${result.failed}件`);

  if (result.failed > 0) {
    console.log(`\n▶ ［${T.transfer.retryFailed}］を押しました`);
    await app.retryFailed();
    showHome(app.home());
  }

  line();
  console.log("【写真】");
  for (const section of app.gallery.sections(platform.now())) {
    console.log(`  ▼ ${section.title}`);
    for (const item of section.items) {
      console.log(`    ・${item.fileName}  ${friendlySize(item.sizeBytes)}`);
    }
  }

  line();
  console.log("【AI・翻訳】");
  const reply = await app.assistant.ask(T.ai.shortcutWhatIsThis);
  console.log(`  Q: ${T.ai.shortcutWhatIsThis}`);
  console.log(`  A: ${reply.text}  （${reply.source === "local" ? T.ai.localOnly : T.ai.cloudNotice}）`);
  const entry = await app.translator.translateText("初心者でも大丈夫ですか？", "ja", "en");
  console.log(`  翻訳: ${entry.sourceText} → ${entry.translatedText}`);

  line();
  console.log("【文字の大きさ】");
  for (const scale of ["small", "medium", "large", "xlarge"] as const) {
    await app.settings.setFontScale(scale);
    const view = app.home();
    console.log(
      `  ${scale.padEnd(7)} 本文${view.fontSizes.body}pt / ボタン${view.fontSizes.button}pt / 主役ボタン${view.primaryAction.heightDp}dp`,
    );
  }
  line();
  console.log("");
}

void main();
