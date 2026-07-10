import { buildAikaSystem } from "./prompts.js";
import { setCurrentRoute } from "../utils/context.js";
import { lineReply } from "../modules/line_reply.js";
import { snsPost } from "../modules/sns_post.js";
import { followup } from "../modules/followup.js";
import { reviewRequest } from "../modules/review_request.js";
import { dailyManager } from "../modules/daily_manager.js";
import { riskCheck } from "../modules/risk_check.js";
import { trainingManual } from "../modules/training_manual.js";
import { videoScript } from "../modules/video_script.js";
import { differentiation } from "../modules/differentiation.js";
import { uizin } from "../modules/uizin.js";
import { animalReel } from "../modules/animal_reel.js";
import { canonContext, receptionReplyAsync } from "../safety/receptionist.js";
import type { SystemBlocks } from "./client.js";

export type RouteName =
  | "line_reply"
  | "sns_post"
  | "followup"
  | "review_request"
  | "daily_manager"
  | "risk_check"
  | "training_manual"
  | "video_script"
  | "differentiation"
  | "uizin"
  | "animal_reel";

interface Route {
  description: string;
  example: string;
  handler: typeof lineReply;
}

const CUSTOMER_FACING_ROUTES = new Set<RouteName>([
  "line_reply",
  "followup",
  "review_request",
  "daily_manager",
]);

function withCanonContext(system: SystemBlocks): SystemBlocks {
  return [
    {
      type: "text",
      text: canonContext(),
    },
    ...system,
  ];
}

export const routes: Record<RouteName, Route> = {
  line_reply: {
    description: "LINE / DM 返信の下書き(押し売りしない短文)",
    example: "明日18時に体験したいです。初心者でも大丈夫ですか？",
    handler: lineReply,
  },
  sns_post: {
    description: "Instagram 投稿セット(本文・短文・ストーリー・リール台本・ハッシュタグ・LINE 配信文)",
    example: "初心者歓迎の体験紹介投稿",
    handler: snsPost,
  },
  followup: {
    description: "体験者・見込み客への追客文(入会を急かさない)",
    example: "先週体験した30代女性、まだ返信なし",
    handler: followup,
  },
  review_request: {
    description: "Google 口コミ依頼文(30秒で書ける印象に)",
    example: "入会2ヶ月の30代男性。ミット打ちで自信がついた様子",
    handler: reviewRequest,
  },
  daily_manager: {
    description: "今日の優先タスクとリスク提案(オーナー向け朝会用)",
    example: "今日18:00から体験3名、夕方にSNS投稿予定、月末請求準備中",
    handler: dailyManager,
  },
  risk_check: {
    description: "事案のリスク判定 + すぐやる対応 + 文章下書き",
    example: "男性会員から女性会員への私的な声かけが多いと相談あり",
    handler: riskCheck,
  },
  training_manual: {
    description: "スタッフ指導マニュアル(目的・標準手順・声かけ例・NG例)",
    example: "ミットの持ち方",
    handler: trainingManual,
  },
  video_script: {
    description: "動画マニュアル台本(ナレーション・テロップ・撮影シーン・SNS切り抜き案)",
    example: "体験トレーニング編",
    handler: videoScript,
  },
  differentiation: {
    description: "差別化原稿(HP/LP 用・他ジムを悪く言わない)",
    example: "ガチスパー強制なし",
    handler: differentiation,
  },
  uizin: {
    description: "初心者向けのやさしい案内文(格闘技が怖い人の不安をほどく)",
    example: "格闘技未経験のお母さん向けのKidsクラス紹介",
    handler: uizin,
  },
  animal_reel: {
    description: "動物×格闘技のAI動画リール素材(Sora/Veo用英語プロンプト・IGキャプション・ハッシュタグ)",
    example: "猫×ボクシング",
    handler: animalReel,
  },
};

export async function runRoute(routeName: string, input: string): Promise<string> {
  const route = routes[routeName as RouteName];
  if (!route) {
    throw new Error(`Unknown route: ${routeName}\n利用可能: ${Object.keys(routes).join(", ")}`);
  }

  setCurrentRoute(routeName);
  try {
    const system = withCanonContext(await buildAikaSystem(`${routeName} — ${route.description}`));
    if (CUSTOMER_FACING_ROUTES.has(routeName as RouteName) && process.env.OPENROUTER_API_KEY) {
      const out = await receptionReplyAsync(input, () => route.handler(system, input));
      return out.reply;
    }
    return await route.handler(system, input);
  } finally {
    setCurrentRoute(undefined);
  }
}

export function listRoutes(): string {
  const max = Math.max(...Object.keys(routes).map(k => k.length));
  return Object.entries(routes)
    .map(([name, r]) => `  ${name.padEnd(max)}  ${r.description}`)
    .join("\n");
}
