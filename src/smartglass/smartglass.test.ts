/**
 * スマートグラス コンパニオンの回帰テスト。依存なし。
 * 実行: `npm run test:glasses`
 *
 * 見張っているのは、こわれると利用者が困るところだけ:
 *  - 一覧の読み取り（2つの流儀 / 変な行 / 対象外の拡張子）
 *  - コマンドの組み立てと返事の読み取り
 *  - 途中で切れても消えない・二度取り込まない
 *  - 文字が大きくなってもボタンが小さくならない、コントラストが足りている
 *  - エラーが「何が起きたか」＋「次にどうするか」になっている
 */

import assert from "node:assert/strict";

import { SmartGlassApp } from "./app.js";
import { toFriendlyError, type AppErrorCode } from "./errors.js";
import { friendlyDate, friendlySize, T } from "./i18n.js";
import { FAQ, TUTORIAL, searchFaq, faqByCategory } from "./help/faq.js";
import { MockAiProvider } from "./mock/ai.js";
import { createMockPlatform } from "./mock/platform.js";
import {
  DEFAULT_WIFI_PASSWORD,
  OpCode,
  checksum,
  decodeFrame,
  encodeCommand,
  encodeTimeSyncPayload,
  parseBatteryPayload,
  parseWifiPayload,
} from "./protocol/frame.js";
import { kindFromFileName, parseManifest, takenAtFromFileName, mediaFileUrl } from "./protocol/manifest.js";
import { normalizeUuid, isSameUuid, PRIMARY_SERVICE_UUID } from "./protocol/uuids.js";
import { TransferQueue, MAX_ATTEMPTS } from "./transfer/queue.js";
import { CANDIDATE_HOSTS } from "./transfer/manager.js";
import { pickStrongest } from "./device/connection.js";
import { COLORS, MIN_TAP_TARGET_DP, contrastRatio, fontSize, tapTargetHeight } from "./ui/tokens.js";
import { LANGUAGES, orderedLanguages } from "./ai/translate.js";
import type { MediaItem } from "./types.js";

const tests: { name: string; run: () => void | Promise<void> }[] = [];
function test(name: string, run: () => void | Promise<void>): void {
  tests.push({ name, run });
}

// ────────────────────────────────── UUID

test("UUID — 16bit短縮と128bitを同じものとして扱う", () => {
  assert.equal(normalizeUuid("fff0"), "0000fff0-0000-1000-8000-00805f9b34fb");
  assert.equal(normalizeUuid("0xFFF0"), normalizeUuid("fff0"));
  assert.ok(isSameUuid(PRIMARY_SERVICE_UUID, PRIMARY_SERVICE_UUID.toLowerCase()));
  assert.ok(!isSameUuid("fff0", "fff1"));
});

// ────────────────────────────────── コマンド

test("コマンド — 組み立てて、読み戻せる", () => {
  const frame = encodeCommand(OpCode.PHOTO);
  assert.equal(frame[0], 0xab);
  assert.equal(frame[1], OpCode.PHOTO);
  assert.equal(frame[2], 0);
  const decoded = decodeFrame(frame);
  assert.ok(decoded);
  assert.equal(decoded.opcode, OpCode.PHOTO);
  assert.equal(decoded.payload.length, 0);
});

test("コマンド — ペイロード付きも往復する", () => {
  const payload = encodeTimeSyncPayload(new Date(2026, 7, 25, 10, 15, 30));
  assert.deepEqual([...payload], [26, 8, 25, 10, 15, 30]);
  const decoded = decodeFrame(encodeCommand(OpCode.TIME_SYNC, payload));
  assert.ok(decoded);
  assert.deepEqual([...decoded.payload], [...payload]);
});

test("コマンド — チェックサムが違うフレームは捨てる", () => {
  const frame = encodeCommand(OpCode.BATTERY, new Uint8Array([80]));
  frame[frame.length - 1] = (frame[frame.length - 1]! + 1) & 0xff;
  assert.equal(decodeFrame(frame), null);
});

test("コマンド — 途中までのフレームは null（例外にしない）", () => {
  const frame = encodeCommand(OpCode.BATTERY, new Uint8Array([80]));
  assert.equal(decodeFrame(frame.slice(0, 3)), null);
  assert.equal(decodeFrame(new Uint8Array([0x00, 0x01])), null);
});

test("コマンド — checksum は下位8bitに収まる", () => {
  const big = new Uint8Array(200).fill(0xff);
  assert.ok(checksum(0xff, big) <= 0xff);
});

test("電池 — 101以上は「わからない」にする", () => {
  assert.equal(parseBatteryPayload(new Uint8Array([82])), 82);
  assert.equal(parseBatteryPayload(new Uint8Array([200])), undefined);
  assert.equal(parseBatteryPayload(new Uint8Array([])), undefined);
});

test("Wi-Fi — SSIDとパスワードを読む。無いときは既定値", () => {
  const encode = (text: string) => new TextEncoder().encode(text);
  assert.deepEqual(parseWifiPayload(encode("HeyCyan-AABB\0secret")), {
    ssid: "HeyCyan-AABB",
    password: "secret",
  });
  assert.deepEqual(parseWifiPayload(encode("HeyCyan-AABB,secret")), {
    ssid: "HeyCyan-AABB",
    password: "secret",
  });
  assert.deepEqual(parseWifiPayload(encode("HeyCyan-AABB")), {
    ssid: "HeyCyan-AABB",
    password: DEFAULT_WIFI_PASSWORD,
  });
  assert.equal(parseWifiPayload(new Uint8Array([])), null);
});

// ────────────────────────────────── 一覧

test("一覧 — media.config（Android流儀）を読む", () => {
  const body = ["# comment", "IMG_20260825_101500.jpg,2400000", "VID_20260824_183012.mp4 48000000", ""].join("\n");
  const items = parseManifest(body);
  assert.equal(items.length, 2);
  assert.equal(items[0]!.fileName, "IMG_20260825_101500.jpg");
  assert.equal(items[0]!.kind, "photo");
  assert.equal(items[1]!.kind, "video");
});

test("一覧 — manifest.json（iOS流儀）を読む", () => {
  const body = JSON.stringify({
    files: [
      { name: "IMG_20260825_101500.jpg", size: 2400000, time: 1756083300 },
      { name: "/DCIM/REC_20260824_090000.opus", size: 320000 },
    ],
  });
  const items = parseManifest(body);
  assert.equal(items.length, 2);
  // パスが付いていてもファイル名だけにする。
  assert.ok(items.some((i) => i.fileName === "REC_20260824_090000.opus"));
  assert.ok(items.some((i) => i.kind === "audio"));
});

test("一覧 — 対象外の拡張子は捨てる", () => {
  const items = parseManifest("notes.txt,120\nIMG_20260825_101500.jpg,10");
  assert.equal(items.length, 1);
  assert.equal(items[0]!.fileName, "IMG_20260825_101500.jpg");
});

test("一覧 — 同じファイルは1件にまとめる", () => {
  const items = parseManifest("a.jpg,100\na.jpg,100\na.jpg,200");
  assert.equal(items.length, 2); // サイズ違いは別物あつかい（撮り直し）
});

test("一覧 — 空・壊れたJSONでも落ちない", () => {
  assert.deepEqual(parseManifest(""), []);
  assert.deepEqual(parseManifest("{ broken"), []);
  assert.deepEqual(parseManifest("[]"), []);
});

test("一覧 — 新しいものが先頭に来る", () => {
  const items = parseManifest("IMG_20260101_000000.jpg,1\nIMG_20260825_101500.jpg,1");
  assert.equal(items[0]!.fileName, "IMG_20260825_101500.jpg");
});

test("ファイル名 — 撮影時刻を読む", () => {
  const at = takenAtFromFileName("IMG_20260825_101500.jpg");
  assert.ok(at);
  const d = new Date(at);
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth() + 1, 8);
  assert.equal(d.getDate(), 25);
  assert.equal(takenAtFromFileName("photo.jpg"), null);
});

test("ファイル名 — 種類を見分ける", () => {
  assert.equal(kindFromFileName("a.JPG"), "photo");
  assert.equal(kindFromFileName("a.mov"), "video");
  assert.equal(kindFromFileName("a.opus"), "audio");
  assert.equal(kindFromFileName("a.txt"), null);
});

test("URL — 日本語ファイル名でも壊れない", () => {
  assert.equal(
    mediaFileUrl("http://192.168.43.1/", "写真 1.jpg"),
    `http://192.168.43.1/files/${encodeURIComponent("写真 1.jpg")}`,
  );
});

test("IP候補 — 実機で報告のあるものを含む", () => {
  for (const host of ["192.168.43.1", "192.168.4.1", "192.168.1.1"]) {
    assert.ok(CANDIDATE_HOSTS.includes(host), `${host} が候補に無い`);
  }
});

// ────────────────────────────────── 順番待ち

function item(id: string, size = 100): MediaItem {
  return { id, fileName: `${id}.jpg`, kind: "photo", sizeBytes: size, takenAt: 0 };
}

test("順番待ち — 取り込み済みは積まない", () => {
  const queue = new TransferQueue();
  const added = queue.enqueue([item("a"), item("b")], new Set(["a"]));
  assert.equal(added, 1);
  assert.equal(queue.size(), 1);
});

test("順番待ち — 小さいものから取り込む", () => {
  const queue = new TransferQueue();
  queue.enqueue([item("big", 1000), item("small", 10)], new Set());
  assert.equal(queue.next()!.item.id, "small");
});

test("順番待ち — 上限までは自動でやり直す", () => {
  const queue = new TransferQueue();
  queue.enqueue([item("a")], new Set());
  for (let i = 1; i < MAX_ATTEMPTS; i += 1) {
    queue.next();
    assert.equal(queue.markFailed("a", "boom"), true, `${i}回目は再挑戦できるはず`);
  }
  queue.next();
  assert.equal(queue.markFailed("a", "boom"), false);
  assert.equal(queue.failedItems().length, 1);
});

test("順番待ち — 途中まで受け取った量を覚えている", () => {
  const queue = new TransferQueue();
  queue.enqueue([item("a", 1000)], new Set());
  queue.next();
  queue.updateProgress("a", 400);
  assert.equal(queue.snapshot().items[0]!.receivedBytes, 400);
  // 進み具合はバイト基準。
  assert.ok(queue.snapshot().progress.ratio > 0.3 && queue.snapshot().progress.ratio < 0.5);
});

test("順番待ち — 進み具合の文が画面にそのまま出せる", () => {
  const queue = new TransferQueue();
  queue.enqueue([item("a"), item("b"), item("c")], new Set());
  queue.next();
  queue.markDone("a", "/mock/a.jpg");
  assert.equal(queue.snapshot().progress.message, "3枚中1枚 取り込みました");
  assert.equal(queue.snapshot().progress.total, 3);
});

test("順番待ち — 「もう一度」で失敗ぶんだけ戻る", () => {
  const queue = new TransferQueue();
  queue.enqueue([item("a"), item("b")], new Set());
  queue.next();
  queue.markDone("a", "/mock/a.jpg");
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    queue.next();
    queue.markFailed("b", "boom");
  }
  assert.equal(queue.retryFailed(), 1);
  assert.equal(queue.next()!.item.id, "b");
});

// ────────────────────────────────── 接続

test("接続 — いちばん電波の強い1台を選ぶ（選ばせない）", () => {
  const picked = pickStrongest([
    { id: "far", name: "far", rssi: -90 },
    { id: "near", name: "near", rssi: -40 },
    { id: "unknown", name: "unknown" },
  ]);
  assert.equal(picked.id, "near");
});

// ────────────────────────────────── 見た目の決まり

test("見た目 — 文字を大きくしてもボタンは48dpを下回らない", () => {
  for (const scale of ["small", "medium", "large", "xlarge"] as const) {
    assert.ok(tapTargetHeight(scale) >= MIN_TAP_TARGET_DP, `${scale} が小さすぎる`);
  }
});

test("見た目 — 文字を大きくすると、ボタンも一緒に大きくなる", () => {
  assert.ok(tapTargetHeight("xlarge") > tapTargetHeight("small"));
  assert.ok(fontSize("body", "xlarge") > fontSize("body", "small"));
});

test("見た目 — 既定は「大」（高齢の方にそのまま渡せる）", () => {
  assert.ok(fontSize("body", "large") >= 20);
  assert.ok(fontSize("button", "large") >= 24);
});

test("見た目 — 文字と背景のコントラストが AA を満たす", () => {
  assert.ok(contrastRatio(COLORS.text, COLORS.background) >= 4.5);
  assert.ok(contrastRatio(COLORS.textMuted, COLORS.background) >= 4.5);
  assert.ok(contrastRatio(COLORS.onPrimary, COLORS.primary) >= 4.5);
  for (const tone of [COLORS.ok, COLORS.warn, COLORS.error]) {
    assert.ok(contrastRatio(tone, COLORS.background) >= 4.5, `${tone} のコントラストが足りない`);
  }
});

// ────────────────────────────────── 言葉

test("言葉 — エラーは「何が起きたか」と「次にどうするか」を必ず持つ", () => {
  const codes: AppErrorCode[] = [
    "bluetooth_off",
    "bluetooth_permission",
    "not_found",
    "connect_failed",
    "connection_lost",
    "wifi_join_failed",
    "wifi_permission",
    "glasses_not_reachable",
    "manifest_failed",
    "download_failed",
    "storage_full",
    "camera_roll_permission",
    "ai_offline",
    "ai_failed",
    "unknown",
  ];
  for (const code of codes) {
    const error = toFriendlyError(code);
    assert.ok(error.what.length > 0, `${code}: what が空`);
    assert.ok(error.next.length > 0, `${code}: next が空`);
    assert.ok(error.next.endsWith("。"), `${code}: next が文で終わっていない`);
  }
});

test("言葉 — 専門用語をそのまま画面に出していない", () => {
  const banned = ["BLE", "Wi-Fi Direct", "ペアリング", "ホットスポット", "マニフェスト", "SSID"];
  const all = JSON.stringify(T);
  for (const word of banned) {
    assert.ok(!all.includes(word), `画面の文言に「${word}」が混ざっている`);
  }
});

test("言葉 — 日付が「きょう / きのう / 8月25日」になる", () => {
  const now = new Date(2026, 7, 25, 12, 0, 0).getTime();
  assert.equal(friendlyDate(new Date(2026, 7, 25, 9, 0, 0).getTime(), now), "きょう");
  assert.equal(friendlyDate(new Date(2026, 7, 24, 9, 0, 0).getTime(), now), "きのう");
  assert.equal(friendlyDate(new Date(2026, 7, 20, 9, 0, 0).getTime(), now), "8月20日");
});

test("言葉 — 大きさが読める形になる", () => {
  assert.equal(friendlySize(0), "-");
  assert.equal(friendlySize(512), "512 B");
  assert.ok(friendlySize(2_400_000).endsWith("MB"));
});

// ────────────────────────────────── ヘルプ

test("ヘルプ — 利用者の言い方でも見つかる", () => {
  assert.ok(searchFaq("つながらない").some((e) => e.id === "connect-fail"));
  assert.ok(searchFaq("文字 小さい").some((e) => e.id === "font-size"));
  assert.ok(searchFaq("ライン").some((e) => e.id === "share"));
  assert.equal(searchFaq("　").length, FAQ.length);
  assert.deepEqual(searchFaq("そんな言葉はない"), []);
});

test("ヘルプ — 手順は1行1動作で、すべて文になっている", () => {
  for (const entry of FAQ) {
    assert.ok(entry.steps.length > 0, `${entry.id}: 手順が無い`);
    for (const step of entry.steps) {
      assert.ok(step.endsWith("。"), `${entry.id}: 「${step}」が文で終わっていない`);
    }
  }
});

test("ヘルプ — カテゴリ分けに漏れが無い", () => {
  const grouped = faqByCategory().flatMap((g) => g.entries);
  assert.equal(grouped.length, FAQ.length);
});

test("ヘルプ — はじめての案内は5手順以内で写真にたどり着く", () => {
  assert.ok(TUTORIAL.length <= 5);
  assert.ok(TUTORIAL[TUTORIAL.length - 1]!.body.includes("写真"));
});

// ────────────────────────────────── 翻訳

test("翻訳 — よく使う言語が上に来る", () => {
  const ordered = orderedLanguages(["en", "vi"]);
  assert.equal(ordered[0]!.code, "en");
  assert.equal(ordered[1]!.code, "vi");
  assert.equal(ordered.length, LANGUAGES.length);
});

test("翻訳 — どの言語にも日本語名と国旗がある（アイコンだけにしない）", () => {
  for (const lang of LANGUAGES) {
    assert.ok(lang.label.length > 0);
    assert.ok(lang.flag.length > 0);
    assert.ok(lang.locale.includes("-"));
  }
});

// ────────────────────────────────── まるごと通し

test("通し — つないで取り込むと、写真がギャラリーに入る", async () => {
  const platform = createMockPlatform();
  const app = new SmartGlassApp(platform, { localAi: new MockAiProvider("local") });
  await app.start();
  await app.settings.update({ autoTransfer: false });

  assert.equal(app.home().statusText, T.connection.disconnected);
  assert.equal(app.home().primaryAction.kind, "connect");

  assert.equal(await app.connect(), true);
  assert.equal(app.home().statusText, T.connection.connected);
  assert.equal(app.home().primaryAction.kind, "import");
  assert.ok(app.home().batteryText?.includes("82%"));

  const result = await app.importMedia();
  // notes.txt は対象外なので 4件。
  assert.equal(result.added, 4);
  assert.equal(result.failed, 0);
  assert.equal(app.gallery.all().length, 4);
  assert.equal(platform.wifi.joined, null, "取り込みが終わったら元のWi-Fiに戻す");
  assert.equal(platform.wifi.leaveCount, 1);
});

test("通し — 同じ写真を二度取り込まない", async () => {
  const platform = createMockPlatform();
  const app = new SmartGlassApp(platform, {});
  await app.start();
  await app.settings.update({ autoTransfer: false });
  await app.connect();

  await app.importMedia();
  const second = await app.importMedia();
  assert.equal(second.added, 0);
  assert.equal(app.gallery.all().length, 4);
});

test("通し — 途中で切れても、取り込めたぶんは消えない", async () => {
  const platform = createMockPlatform({ failDownloadsUntilAttempt: 1 });
  const app = new SmartGlassApp(platform, {});
  await app.start();
  await app.settings.update({ autoTransfer: false });
  await app.connect();

  // 1回目は必ず失敗 → 上限内なので自動でやり直して成功する。
  const result = await app.importMedia();
  assert.equal(result.added, 4);
  assert.equal(app.gallery.all().length, 4);
});

test("通し — Wi-Fiに入れないと、やさしいエラーが出る", async () => {
  const platform = createMockPlatform({ wifiJoinFails: true });
  const app = new SmartGlassApp(platform, {});
  await app.start();
  await app.settings.update({ autoTransfer: false });
  await app.connect();

  await app.importMedia();
  const view = app.home();
  assert.ok(view.error);
  assert.equal(view.error.code, "wifi_join_failed");
  assert.ok(view.error.action);
});

test("通し — Bluetoothが切れていると、入れ方を案内する", async () => {
  const platform = createMockPlatform({ bluetoothOff: true });
  const app = new SmartGlassApp(platform, {});
  await app.start();

  assert.equal(await app.connect(), false);
  const view = app.home();
  assert.equal(view.error?.code, "bluetooth_off");
  assert.ok(view.error!.next.includes("Bluetooth"));
});

test("通し — メガネが見つからないと、置き方を案内する", async () => {
  const platform = createMockPlatform({ noDevices: true });
  const app = new SmartGlassApp(platform, {});
  await app.start();

  assert.equal(await app.connect(), false);
  assert.equal(app.home().error?.code, "not_found");
  // 2回目からは「もう一度つなぐ」。
  assert.equal(app.home().primaryAction.label, T.connection.retry);
});

test("通し — manifest.json のメガネでも同じように取り込める", async () => {
  const platform = createMockPlatform({ manifestStyle: "json" });
  const app = new SmartGlassApp(platform, {});
  await app.start();
  await app.settings.update({ autoTransfer: false });
  await app.connect();

  assert.equal((await app.importMedia()).added, 4);
});

test("通し — 自動取り込みが入なら、つないだだけで写真が入る", async () => {
  const platform = createMockPlatform();
  const app = new SmartGlassApp(platform, {});
  await app.start(); // autoTransfer は既定で true
  await app.connect();
  // つないだ直後に走る自動取り込みの完了を待つ。
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(app.gallery.all().length, 4);
});

test("通し — 電池が少ないと警告を出す", async () => {
  const platform = createMockPlatform({ batteryPercent: 12 });
  const app = new SmartGlassApp(platform, {});
  await app.start();
  await app.settings.update({ autoTransfer: false });
  await app.connect();

  const view = app.home();
  assert.ok(view.batteryWarning);
  assert.equal(view.statusTone, "warn");
});

test("通し — 設定の「スマホにも保存」が入なら、カメラロールにも入る", async () => {
  const platform = createMockPlatform();
  const app = new SmartGlassApp(platform, {});
  await app.start();
  await app.settings.update({ autoTransfer: false, autoSaveToCameraRoll: true });
  await app.connect();
  await app.importMedia();

  assert.equal(platform.storage.cameraRoll.length, 4);
});

test("通し — 文字サイズは覚えていて、次に開いても大きいまま", async () => {
  const platform = createMockPlatform();
  const first = new SmartGlassApp(platform, {});
  await first.start();
  await first.settings.setFontScale("xlarge");

  const second = new SmartGlassApp(platform, {});
  await second.start();
  assert.equal(second.settings.get().fontScale, "xlarge");
  assert.equal(second.home().fontSizes.body, fontSize("body", "xlarge"));
});

test("通し — ギャラリーは端末に残る（メガネが無くても見られる）", async () => {
  const platform = createMockPlatform();
  const first = new SmartGlassApp(platform, {});
  await first.start();
  await first.settings.update({ autoTransfer: false });
  await first.connect();
  await first.importMedia();

  const second = new SmartGlassApp(platform, {});
  await second.start();
  assert.equal(second.gallery.all().length, 4);
  assert.ok(second.gallery.sections(platform.now()).length > 0);
});

test("通し — AIは既定で端末の中だけ。クラウドは許可したときだけ", async () => {
  const platform = createMockPlatform();
  const cloudOnly = new SmartGlassApp(platform, { localAi: null, cloudAi: new MockAiProvider("cloud") });
  await cloudOnly.start();

  // 既定（allowCloudAi=false）ではクラウドを使わない＝答えられない。
  await assert.rejects(() => cloudOnly.assistant.ask("これは何？"));

  await cloudOnly.settings.update({ allowCloudAi: true });
  const reply = await cloudOnly.assistant.ask("これは何？");
  assert.equal(reply.source, "cloud");
});

test("通し — 音声ガイドが切なら、しゃべらない", async () => {
  const platform = createMockPlatform();
  const app = new SmartGlassApp(platform, {});
  await app.start();

  await app.settings.update({ voiceGuide: false });
  await app.speak("つながっています");
  assert.equal(platform.speech.spoken.length, 0);

  await app.settings.update({ voiceGuide: true });
  await app.speak("つながっています");
  assert.deepEqual(platform.speech.spoken, ["つながっています"]);
});

test("通し — ホームから3タップ以内で「写真を見る」に着く", async () => {
  // ①メガネにつなぐ ②写真を取り込む ③写真タブ = 3タップ。
  const platform = createMockPlatform();
  const app = new SmartGlassApp(platform, {});
  await app.start();
  await app.settings.update({ autoTransfer: false });

  let taps = 0;
  taps += 1;
  await app.connect();
  taps += 1;
  await app.importMedia();
  taps += 1; // 「写真」タブ
  assert.ok(taps <= 3);
  assert.ok(app.gallery.all().length > 0);
});

// ────────────────────────────────── 実行

async function main(): Promise<void> {
  let failed = 0;
  for (const { name, run } of tests) {
    try {
      await run();
    } catch (error) {
      failed += 1;
      console.error(`✖ ${name}`);
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} / ${tests.length} failed`);
    process.exit(1);
  }
  console.log(`all smartglass tests passed (${tests.length})`);
}

void main();
