/**
 * Web版（Mac が橋渡し）の通しテスト。実機なしで、本物の HTTP で確かめる。
 * 実行: `npm run test:glasses:web`
 *
 * 偽のメガネ（HTTPサーバ）を立て、本物の fetch とファイル保存を通す。
 * ＝「取り込む → ブラウザで見える」が、机上ではなく実際に動くことを見張る。
 */

import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { Platform } from "../platform.js";
import { createSmartGlassServer, type SmartGlassServer } from "./server.js";
import { NodeHttpAdapter, NodeStorageAdapter } from "./nodePlatform.js";

const tests: { name: string; run: () => Promise<void> }[] = [];
function test(name: string, run: () => Promise<void>): void {
  tests.push({ name, run });
}

/** 偽のメガネ。実機と同じ形で一覧とファイルを返す（Range にも応じる）。 */
interface FakeGlasses {
  host: string;
  close: () => Promise<void>;
  /** 何回目のダウンロードから成功させるか（1 なら常に成功）。 */
  failUntilAttempt: number;
  attempts: Map<string, number>;
}

const FILES: Record<string, Buffer> = {
  "IMG_20260825_101500.jpg": Buffer.alloc(3000, 0x41),
  "IMG_20260825_101530.jpg": Buffer.alloc(2000, 0x42),
  "VID_20260824_183012.mp4": Buffer.alloc(9000, 0x43),
  "REC_20260824_090000.opus": Buffer.alloc(500, 0x44),
  "notes.txt": Buffer.from("ignore me"),
};

async function startFakeGlasses(): Promise<FakeGlasses> {
  const state: FakeGlasses = {
    host: "",
    close: async () => undefined,
    failUntilAttempt: 0,
    attempts: new Map(),
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");

    if (url.pathname === "/files/media.config") {
      const body = Object.entries(FILES)
        .map(([name, buffer]) => `${name},${buffer.length}`)
        .join("\n");
      res.writeHead(200, { "content-type": "text/plain" });
      res.end(body);
      return;
    }

    if (url.pathname.startsWith("/files/")) {
      const name = decodeURIComponent(url.pathname.slice("/files/".length));
      const buffer = FILES[name];
      if (!buffer) {
        res.writeHead(404);
        res.end();
        return;
      }

      const attempt = (state.attempts.get(name) ?? 0) + 1;
      state.attempts.set(name, attempt);
      if (attempt <= state.failUntilAttempt) {
        // 途中まで送って切る（実機でよくある切れ方）。
        res.writeHead(200, { "content-type": "application/octet-stream" });
        res.write(buffer.subarray(0, Math.floor(buffer.length / 2)));
        res.destroy();
        return;
      }

      const range = req.headers.range?.match(/bytes=(\d+)-/);
      if (range) {
        const from = Number(range[1]);
        const slice = buffer.subarray(from);
        res.writeHead(206, {
          "content-length": String(slice.length),
          "content-range": `bytes ${from}-${buffer.length - 1}/${buffer.length}`,
        });
        res.end(slice);
        return;
      }

      res.writeHead(200, { "content-length": String(buffer.length) });
      res.end(buffer);
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (typeof address === "string" || !address) throw new Error("no address");
  state.host = `127.0.0.1:${address.port}`;
  state.close = () => new Promise<void>((resolve) => server.close(() => resolve()));
  return state;
}

/** テスト用の入口。Wi-Fi の切り替えはせず、偽メガネのアドレスをそのまま教える。 */
function testPlatform(dataDir: string, glassesHost: string): Platform {
  return {
    os: "android",
    ble: {
      async isReady() { return false; },
      async scan() { return []; },
      async connect() { throw new Error("unused"); },
      async disconnect() {},
      isConnected() { return false; },
      async write() {},
      subscribe() { return () => undefined; },
      onDisconnected() { return () => undefined; },
    },
    wifi: {
      async join() { return true; },
      async leave() {},
      async candidateHosts() { return [glassesHost]; },
    },
    http: new NodeHttpAdapter(),
    storage: new NodeStorageAdapter(dataDir),
    speech: {
      async speak() {}, async stop() {}, async listen() { return ""; },
    },
    now: () => Date.now(),
  };
}

async function withServer(
  body: (app: SmartGlassServer, glasses: FakeGlasses, base: string) => Promise<void>,
  options: { failUntilAttempt?: number } = {},
): Promise<void> {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "glasses-"));
  const glasses = await startFakeGlasses();
  glasses.failUntilAttempt = options.failUntilAttempt ?? 0;

  const app = await createSmartGlassServer({
    glassesSsid: "HeyCyan-TEST",
    glassesPassword: "123456789",
    dataDir,
    port: 0,
    platform: testPlatform(dataDir, glasses.host),
  });
  await new Promise<void>((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const address = app.server.address();
  if (typeof address === "string" || !address) throw new Error("no address");
  const base = `http://127.0.0.1:${address.port}`;

  try {
    await body(app, glasses, base);
  } finally {
    await app.close();
    await glasses.close();
    await rm(dataDir, { recursive: true, force: true });
  }
}

// ────────────────────────────────── テスト

test("ページが返る（アプリの名前が出ている）", async () => {
  await withServer(async (_app, _glasses, base) => {
    const response = await fetch(`${base}/`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes("スマートグラス"));
    assert.ok(html.includes("写真を取り込む"));
    // 専門用語を画面に出さない、という決まりはWeb版でも守る。
    for (const word of ["BLE", "SSID", "ペアリング"]) {
      assert.ok(!html.includes(`>${word}<`), `画面に「${word}」が出ている`);
    }
  });
});

test("はじめは写真ゼロ。案内文が出る", async () => {
  await withServer(async (_app, _glasses, base) => {
    const state = await (await fetch(`${base}/api/state`)).json();
    assert.equal(state.mediaCount, 0);
    assert.equal(state.sections.length, 0);
    assert.ok(state.hint.length > 0);
    assert.ok(state.openHint.includes("http://localhost"));
  });
});

test("取り込むと、写真がブラウザから見える（本物のHTTPとファイル）", async () => {
  await withServer(async (app, _glasses, base) => {
    await app.importOnce();
    const state = await app.state();
    // notes.txt は対象外なので4件。
    assert.equal(state.mediaCount, 4);

    const item = state.sections.flatMap((s) => s.items).find((i) => i.fileName.endsWith(".jpg"));
    assert.ok(item);
    const media = await fetch(`${base}/media/${encodeURIComponent(item.id)}`);
    assert.equal(media.status, 200);
    assert.equal(media.headers.get("content-type"), "image/jpeg");
    const bytes = Buffer.from(await media.arrayBuffer());
    assert.deepEqual(bytes, FILES[item.fileName]);
  });
});

test("同じ写真を二度取り込まない", async () => {
  await withServer(async (app) => {
    await app.importOnce();
    await app.importOnce();
    assert.equal((await app.state()).mediaCount, 4);
  });
});

test("途中で切れても、続きから取り込んで最後まで届く", async () => {
  await withServer(
    async (app, _glasses, base) => {
      await app.importOnce();
      const state = await app.state();
      assert.equal(state.mediaCount, 4);

      // 半分で切られた後も、中身が壊れていないこと。
      for (const item of state.sections.flatMap((s) => s.items)) {
        const bytes = Buffer.from(await (await fetch(`${base}/media/${encodeURIComponent(item.id)}`)).arrayBuffer());
        assert.deepEqual(bytes, FILES[item.fileName], `${item.fileName} が壊れている`);
      }
    },
    { failUntilAttempt: 1 },
  );
});

test("ダウンロード指定だと、ファイル名つきで落ちてくる", async () => {
  await withServer(async (app, _glasses, base) => {
    await app.importOnce();
    const item = (await app.state()).sections.flatMap((s) => s.items)[0]!;
    const response = await fetch(`${base}/media/${encodeURIComponent(item.id)}?download=1`);
    assert.ok(response.headers.get("content-disposition")?.includes("attachment"));
  });
});

test("目録に無いものは返さない（外のファイルを読ませない）", async () => {
  await withServer(async (app, _glasses, base) => {
    await app.importOnce();
    for (const attack of ["../../etc/passwd", "/etc/passwd", "..%2F..%2Fetc%2Fpasswd"]) {
      const response = await fetch(`${base}/media/${encodeURIComponent(attack)}`);
      assert.equal(response.status, 404, `${attack} が通ってしまった`);
    }
  });
});

test("文字の大きさを変えると、覚えている", async () => {
  await withServer(async (app, _glasses, base) => {
    await fetch(`${base}/api/settings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fontScale: "xlarge" }),
    });
    assert.equal((await app.state()).fontScale, "xlarge");
  });
});

test("変化があると、開いているブラウザに押し届く（SSE）", async () => {
  await withServer(async (app, _glasses, base) => {
    const controller = new AbortController();
    const response = await fetch(`${base}/events`, { signal: controller.signal });
    const reader = response.body!.getReader();

    // 最初の1本は「いまの状態」。
    const first = JSON.parse(new TextDecoder().decode((await reader.read()).value!).replace(/^data: /, ""));
    assert.equal(first.mediaCount, 0);

    void app.importOnce();

    // 取り込み終了までに届く通知のどれかに、写真が入っていればよい。
    let sawMedia = false;
    for (let i = 0; i < 40 && !sawMedia; i += 1) {
      const chunk = await reader.read();
      if (chunk.done) break;
      for (const line of new TextDecoder().decode(chunk.value!).split("\n\n")) {
        const text = line.replace(/^data: /, "").trim();
        if (!text) continue;
        if (JSON.parse(text).mediaCount === 4) sawMedia = true;
      }
    }
    controller.abort();
    assert.ok(sawMedia, "写真が入ったことが、ブラウザに届いていない");
  });
});

test("知らない道は404（静かに返す）", async () => {
  await withServer(async (_app, _glasses, base) => {
    assert.equal((await fetch(`${base}/nope`)).status, 404);
  });
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
  console.log(`all smartglass web tests passed (${tests.length})`);
}

void main();
