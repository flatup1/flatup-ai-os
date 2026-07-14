/**
 * Seedance クライアントのプロバイダ切替・キー検査の回帰テスト(ネットワークなし)。
 *
 * 実行: `npm run test:reel` に含まれる
 */

import assert from "node:assert/strict";
import {
  seedanceProvider,
  seedanceEndpoint,
  videoModel,
  isImageToVideo,
  falPromptOptimizer,
  imageMimeType,
  requiredKeyName,
  hasApiKey,
  assertValidApiKey,
  arkCommandText,
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
  FAL_PROMPT_OPTIMIZER: undefined,
  FAL_KEY: undefined,
  ARK_API_KEY: undefined,
};

const HAILUO = "fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video";

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

test("FAL_VIDEO_MODEL は fal モデルを上書きする(SEEDANCE_ENDPOINT より優先)", () => {
  withEnv({ ...CLEAN, FAL_VIDEO_MODEL: HAILUO }, () => {
    assert.equal(videoModel(), HAILUO);
    assert.equal(seedanceEndpoint(), HAILUO, "seedanceEndpoint は videoModel の別名");
  });
  withEnv({ ...CLEAN, FAL_VIDEO_MODEL: HAILUO, SEEDANCE_ENDPOINT: "bytedance/seedance-2.0/text-to-video" }, () => {
    assert.equal(videoModel(), HAILUO, "FAL_VIDEO_MODEL が SEEDANCE_ENDPOINT に勝つ");
  });
});

test("FAL_VIDEO_MODEL は byteplus では無視される(ark モデルを使う)", () => {
  withEnv({ ...CLEAN, SEEDANCE_PROVIDER: "byteplus", FAL_VIDEO_MODEL: HAILUO }, () => {
    assert.equal(videoModel(), "dreamina-seedance-2-0-fast-260128");
    assert.equal(isImageToVideo(), false, "byteplus は image-to-video 扱いにしない");
  });
});

test("isImageToVideo はモデルパスで判定する", () => {
  withEnv(CLEAN, () => {
    assert.equal(isImageToVideo(), false, "既定の text-to-video は false");
  });
  withEnv({ ...CLEAN, FAL_VIDEO_MODEL: HAILUO }, () => {
    assert.equal(isImageToVideo(), true, "image-to-video モデルは true");
  });
  withEnv({ ...CLEAN, FAL_VIDEO_MODEL: "bytedance/seedance-2.0/fast/text-to-video" }, () => {
    assert.equal(isImageToVideo(), false, "text-to-video は false");
  });
});

test("falPromptOptimizer は既定 ON、明示的な false で OFF", () => {
  withEnv(CLEAN, () => assert.equal(falPromptOptimizer(), true));
  withEnv({ ...CLEAN, FAL_PROMPT_OPTIMIZER: "false" }, () => assert.equal(falPromptOptimizer(), false));
  withEnv({ ...CLEAN, FAL_PROMPT_OPTIMIZER: "0" }, () => assert.equal(falPromptOptimizer(), false));
  withEnv({ ...CLEAN, FAL_PROMPT_OPTIMIZER: "true" }, () => assert.equal(falPromptOptimizer(), true));
});

test("imageMimeType は拡張子から MIME を返し、未対応は弾く", () => {
  assert.equal(imageMimeType("cat.png"), "image/png");
  assert.equal(imageMimeType("BASE_001.JPG"), "image/jpeg");
  assert.equal(imageMimeType("a.jpeg"), "image/jpeg");
  assert.equal(imageMimeType("b.webp"), "image/webp");
  assert.throws(() => imageMimeType("clip.gif"), /対応していない画像形式/);
  assert.throws(() => imageMimeType("noext"), /対応していない画像形式/);
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

if (fail === 0) {
  console.log(`✓ all seedance client tests passed (${pass} cases)`);
  process.exit(0);
} else {
  console.error(`✗ ${fail} of ${pass + fail} cases failed:\n`);
  failures.forEach(f => console.error(f + "\n"));
  process.exit(1);
}
