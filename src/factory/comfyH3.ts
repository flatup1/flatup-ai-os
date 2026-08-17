/**
 * MiniMax H3 バックエンド（ColabなどのComfyUIに投げる）。
 *
 * notebooks/colab_minimax_h3_i2v.ipynb の⑨セルと**同じ配線**を TypeScript 側からも
 * 使えるようにしたもの。ノートは1本ずつ手で回す用、こちらは量産用。
 * 配線の出典は ComfyUI公式テンプレート video_minimax_h3_i2v.json。
 *
 * 使い方:
 *   npm run factory -- --backend h3 --comfy-url https://xxxx.trycloudflare.com
 *
 * 注意: H3は音声も同時に作るため audio VAE が必須。ノート⑤で4ファイルを置いてあること。
 */

import { writeFile } from "node:fs/promises";

/** H3のキャンバス規則（ComfyUI本体 nodes_minimax_h3.py と同じ計算） */
export function adaptCanvas(ratioW: number, ratioH: number): { width: number; height: number } {
  const BASE = 768;
  const MAX_PIXELS = 768 * 1344;
  const MUL = 32;
  const r = ratioW / ratioH;
  let w = r >= 1 ? BASE * r : BASE;
  let h = r >= 1 ? BASE : BASE / r;
  if (w * h > MAX_PIXELS) {
    const s = Math.sqrt(MAX_PIXELS / (w * h));
    w *= s;
    h *= s;
  }
  return {
    width: Math.max(MUL, Math.round(w / MUL) * MUL),
    height: Math.max(MUL, Math.round(h / MUL) * MUL),
  };
}

/** 24fps・17k+5 のフレーム格子に丸める（6秒 → 158フレーム = 6.58秒） */
export function framesForSeconds(seconds: number): number {
  let n = Math.max(5, Math.round(seconds * 24));
  while (n % 17 !== 5) n++;
  return n;
}

export interface H3Options {
  comfyUrl: string;
  prompt: string;
  seed: number;
  seconds?: number;
  /** ComfyUI の input フォルダに置いた画像ファイル名。省略すると T2V */
  imageName?: string;
  aspect?: "9:16" | "16:9" | "1:1";
  steps?: number;
  unetName?: string;
  clipName?: string;
  vaeVideoName?: string;
  vaeAudioName?: string;
  filenamePrefix?: string;
}

type NodeInput = Record<string, unknown>;

/** 公式テンプレと同じノード構成を組み立てる（API形式） */
export function buildH3Workflow(o: H3Options): Record<string, { class_type: string; inputs: NodeInput }> {
  const ratio = { "9:16": [9, 16], "16:9": [16, 9], "1:1": [1, 1] }[o.aspect ?? "9:16"];
  const { width, height } = adaptCanvas(ratio[0], ratio[1]);
  const length = framesForSeconds(o.seconds ?? 6);
  const steps = o.steps ?? 20;

  const i2v: NodeInput = {
    clip: ["13", 0],
    vae: ["11", 0],
    prompt: o.prompt,
    width,
    height,
    length,
  };
  if (o.imageName) i2v.first_frame = ["114", 0];

  const wf: Record<string, { class_type: string; inputs: NodeInput }> = {
    "6": {
      class_type: "UNETLoader",
      inputs: {
        unet_name: o.unetName ?? "minimax_h3_fl2va_pruned_int8_convrot.safetensors",
        weight_dtype: "default",
      },
    },
    "13": {
      class_type: "CLIPLoader",
      inputs: {
        clip_name: o.clipName ?? "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
        type: "minimax",
        device: "default",
      },
    },
    "11": {
      class_type: "VAELoader",
      inputs: { vae_name: o.vaeVideoName ?? "minimax_h3_video_vae_fp16.safetensors" },
    },
    "24": {
      class_type: "VAELoader",
      inputs: { vae_name: o.vaeAudioName ?? "minimax_h3_audio_vae_fp32.safetensors" },
    },
    "104": { class_type: "MiniMaxH3ImageToVideo", inputs: i2v },
    "15": { class_type: "RandomNoise", inputs: { noise_seed: o.seed } },
    "17": { class_type: "KSamplerSelect", inputs: { sampler_name: "res_multistep" } },
    "9": {
      class_type: "BasicScheduler",
      inputs: { model: ["6", 0], scheduler: "simple", steps, denoise: 1.0 },
    },
    "16": { class_type: "BasicGuider", inputs: { model: ["6", 0], conditioning: ["104", 0] } },
    "14": {
      class_type: "SamplerCustomAdvanced",
      inputs: {
        noise: ["15", 0],
        guider: ["16", 0],
        sampler: ["17", 0],
        sigmas: ["9", 0],
        latent_image: ["104", 1],
      },
    },
    "10": { class_type: "VAEDecode", inputs: { samples: ["14", 0], vae: ["11", 0] } },
    "23": { class_type: "VAEDecodeAudio", inputs: { samples: ["14", 0], vae: ["24", 0] } },
    "91": {
      class_type: "CreateVideo",
      inputs: { images: ["10", 0], audio: ["23", 0], fps: 24, bit_depth: 8 },
    },
    "92": {
      class_type: "SaveVideo",
      inputs: {
        video: ["91", 0],
        filename_prefix: o.filenamePrefix ?? "video/FLATUP",
        format: "auto",
        codec: "auto",
      },
    },
  };
  if (o.imageName) {
    wf["114"] = { class_type: "LoadImage", inputs: { image: o.imageName } };
  }
  return wf;
}

const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = Number(process.env.H3_POLL_TIMEOUT_MIN || 30) * 60_000;

interface HistoryOutputFile {
  filename: string;
  subfolder?: string;
  type?: string;
}

/** history の outputs から mp4 系のファイルを拾う（SaveVideo の返し方に依存しない） */
export function findVideoOutputs(history: unknown): HistoryOutputFile[] {
  const found: HistoryOutputFile[] = [];
  const outputs = (history as { outputs?: Record<string, Record<string, unknown>> })?.outputs;
  if (!outputs) return found;
  for (const node of Object.values(outputs)) {
    for (const items of Object.values(node)) {
      if (!Array.isArray(items)) continue;
      for (const it of items) {
        const f = it as HistoryOutputFile;
        if (f && typeof f.filename === "string" && /\.(mp4|webm|mkv)$/i.test(f.filename)) {
          found.push(f);
        }
      }
    }
  }
  return found;
}

/** ComfyUI に投げて、完成した動画をファイルに保存する */
export async function generateViaH3(o: H3Options, destFile: string): Promise<void> {
  const base = o.comfyUrl.replace(/\/+$/, "");
  const workflow = buildH3Workflow(o);

  const res = await fetch(`${base}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ComfyUIに拒否されました (${res.status}): ${body.slice(0, 800)}`);
  }
  const { prompt_id: promptId } = (await res.json()) as { prompt_id?: string };
  if (!promptId) throw new Error("prompt_id が返りませんでした");

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  for (;;) {
    if (Date.now() > deadline) {
      throw new Error(`${POLL_TIMEOUT_MS / 60_000}分待っても終わりませんでした (${promptId})`);
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    const hres = await fetch(`${base}/history/${promptId}`);
    if (!hres.ok) continue;
    const hist = (await hres.json()) as Record<string, unknown>;
    const entry = hist[promptId];
    if (!entry) continue;

    const status = (entry as { status?: { status_str?: string; messages?: unknown[] } }).status;
    if (status?.status_str === "error") {
      throw new Error(`生成に失敗: ${JSON.stringify(status.messages ?? []).slice(0, 800)}`);
    }
    const files = findVideoOutputs(entry);
    if (files.length === 0) continue;

    const f = files[0];
    const url =
      `${base}/view?filename=${encodeURIComponent(f.filename)}` +
      `&subfolder=${encodeURIComponent(f.subfolder ?? "")}` +
      `&type=${encodeURIComponent(f.type ?? "output")}`;
    const vres = await fetch(url);
    if (!vres.ok) throw new Error(`動画の取得に失敗 (${vres.status})`);
    await writeFile(destFile, Buffer.from(await vres.arrayBuffer()));
    return;
  }
}
