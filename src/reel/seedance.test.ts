/**
 * Seedance クライアントのプロバイダ切替・キー検査の回帰テスト(ネットワークなし)。
 *
 * 実行: `npm run test:reel` に含まれる
 */

import assert from "node:assert/strict";
import {
  seedanceProvider,
  seedanceEndpoint,
  requiredKeyName,
  hasApiKey,
  assertValidApiKey,
  arkCommandText,
  buildFalPayload,
} from "./seedance.js";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
  } catch (err) {
    fail++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`✗ ${name}\n   ${msg}`);
  }
}

/** env を一時的に差し替えてテストする */
function withEnv(env: Record<string, string | undefined>, fn: () => void): void {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

const CLEAN = {
  SEEDANCE_PROVIDER: undefined,
  SEEDANCE_ENDPOINT: undefined,
  SEEDANCE_ARK_MODEL: undefined,
  FAL_VIDEO_MODEL: undefined,
  FAL_KEY: undefined,
  ARK_API_KEY: undefined,
};

test("既定プロバイダは fal", () => {
  withEnv(CLEAN, () => {
    assert.equal(seedanceProvider(), "fal");
    assert.equal(requiredKeyName(), "FAL_KEY");
    assert.equal(seedanceEndpoint(), "bytedance/seedance-2.0/fast/text-to-video");
  });
});

test("SEEDANCE_PROVIDER=byteplus で公式に切り替わる", () => {
  withEnv({ ...CLEAN, SEEDANCE_PROVIDER: "byteplus" }, () => {
    assert.equal(seedanceProvider(), "byteplus");
    assert.equal(requiredKeyName(), "ARK_API_KEY");
    assert.equal(seedanceEndpoint(), "dreamina-seedance-2-0-fast-260128");
  });
});

test("SEEDANCE_PROVIDER=ark も byteplus 扱い", () => {
  withEnv({ ...CLEAN, SEEDANCE_PROVIDER: "ark" }, () => {
    assert.equal(seedanceProvider(), "byteplus");
  });
});

test("モデル/エンドポイントは env で上書きできる", () => {
  withEnv({ ...CLEAN, SEEDANCE_ENDPOINT: "bytedance/seedance-2.0/text-to-video" }, () => {
    assert.equal(seedanceEndpoint(), "bytedance/seedance-2.0/text-to-video");
  });
  withEnv({ ...CLEAN, SEEDANCE_PROVIDER: "byteplus", SEEDANCE_ARK_MODEL: "dreamina-seedance-2-0-260128" }, () => {
    assert.equal(seedanceEndpoint(), "dreamina-seedance-2-0-260128");
  });
});

test("hasApiKey はプロバイダに対応するキーだけを見る", () => {
  withEnv({ ...CLEAN, FAL_KEY: "abc123" }, () => {
    assert.equal(hasApiKey(), true);
  });
  withEnv({ ...CLEAN, SEEDANCE_PROVIDER: "byteplus", FAL_KEY: "abc123" }, () => {
    assert.equal(hasApiKey(), false, "byteplus では FAL_KEY を無視する");
  });
  withEnv({ ...CLEAN, SEEDANCE_PROVIDER: "byteplus", ARK_API_KEY: "abc123" }, () => {
    assert.equal(hasApiKey(), true);
  });
});

test("全角キーは両プロバイダで実行前に弾かれる", () => {
  withEnv({ ...CLEAN, FAL_KEY: "ここにキーを貼る" }, () => {
    assert.throws(() => assertValidApiKey(), /FAL_KEY に日本語などの全角文字/);
  });
  withEnv({ ...CLEAN, SEEDANCE_PROVIDER: "byteplus", ARK_API_KEY: "ここにキーを貼る" }, () => {
    assert.throws(() => assertValidApiKey(), /ARK_API_KEY に日本語などの全角文字/);
  });
});

test("未設定キーはキー名入りのエラーになる", () => {
  withEnv(CLEAN, () => {
    assert.throws(() => assertValidApiKey(), /FAL_KEY が未設定/);
  });
  withEnv({ ...CLEAN, SEEDANCE_PROVIDER: "byteplus" }, () => {
    assert.throws(() => assertValidApiKey(), /ARK_API_KEY が未設定/);
  });
});

test("正しい形のキーは通る", () => {
  withEnv({ ...CLEAN, FAL_KEY: "1a2b3c4d-5678-90ab-cdef:secret123" }, () => {
    assert.doesNotThrow(() => assertValidApiKey());
  });
});

test("arkCommandText がテキストコマンドを付ける", () => {
  const text = arkCommandText("A photorealistic cat boxing.", {
    aspectRatio: "9:16",
    resolution: "720p",
    duration: "6",
  });
  assert.equal(text, "A photorealistic cat boxing. --ratio 9:16 --resolution 720p --duration 6");
});

test("arkCommandText は seed 指定も付けられる", () => {
  const text = arkCommandText("prompt", { aspectRatio: "9:16", resolution: "720p", duration: "6", seed: 42 });
  assert.ok(text.endsWith("--seed 42"));
});

test("FAL_VIDEO_MODEL が SEEDANCE_ENDPOINT より優先される", () => {
  withEnv(
    {
      ...CLEAN,
      FAL_VIDEO_MODEL: "fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video",
      SEEDANCE_ENDPOINT: "bytedance/seedance-2.0/text-to-video",
    },
    () => {
      assert.equal(seedanceEndpoint(), "fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video");
    }
  );
});

const OPTS = { aspectRatio: "9:16", resolution: "720p", duration: "6" };

test("Hailuo 系ペイロードは prompt/duration/prompt_optimizer/image_url のみ", () => {
  const body = buildFalPayload(
    "fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video",
    "punch",
    { ...OPTS, seed: 1, imageUrl: "data:image/png;base64,AAAA" }
  );
  assert.deepEqual(Object.keys(body).sort(), ["duration", "image_url", "prompt", "prompt_optimizer"]);
  assert.equal(body.prompt_optimizer, true);
  assert.equal(body.image_url, "data:image/png;base64,AAAA");
  assert.equal(body.duration, "6");
});

test("Seedance 系ペイロードは aspect_ratio/resolution を含む", () => {
  const body = buildFalPayload("bytedance/seedance-2.0/fast/text-to-video", "punch", { ...OPTS, seed: 7 });
  assert.equal(body.aspect_ratio, "9:16");
  assert.equal(body.resolution, "720p");
  assert.equal(body.seed, 7);
  assert.ok(!("image_url" in body), "imageUrl 未指定なら image_url を送らない");
});

test("Seedance 系でも imageUrl 指定で image_url が付く(I2V)", () => {
  const body = buildFalPayload("bytedance/seedance-2.0/fast/image-to-video", "punch", {
    ...OPTS,
    imageUrl: "https://example.com/cat.png",
  });
  assert.equal(body.image_url, "https://example.com/cat.png");
});

if (fail === 0) {
  console.log(`✓ all seedance client tests passed (${pass} cases)`);
  process.exit(0);
} else {
  console.error(`✗ ${fail} of ${pass + fail} cases failed:\n`);
  failures.forEach(f => console.error(f + "\n"));
  process.exit(1);
}
