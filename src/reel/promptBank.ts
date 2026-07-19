/**
 * 動物×格闘技リールのプロンプト銀行(静的・AI呼び出しなし)。
 *
 * シリーズ名(にゃん術 等)または「動物×競技」の入力から、
 * Seedance/Veo/Kling にそのまま渡せる英語プロンプトを機械生成する。
 * バリエーションは「技シーケンス × 舞台」のローテーションで作る。
 */

export interface ReelSeries {
  /** シリーズ名(ダジャレ) */
  name: string;
  /** 組み合わせ(例: 猫×ブラジリアン柔術) */
  combo: string;
  /** 入力マッチ用の別名(動物名・競技名など) */
  aliases: string[];
  /** 英語の主役描写 */
  subject: string;
  /** 英語の技シーケンス(1本につき1個使う) */
  sequences: string[];
  /**
   * image-to-video 用の完結プロンプト(任意)。設定すると I2V モードではこちらを
   * そのまま使う。被写体・背景は起点画像が決めるので、動き中心・崩れ防止を厚く書く。
   */
  i2vSequences?: string[];
  /** 英語の舞台(ローテーション) */
  settings: string[];
  /** IGキャプションの型(#話数 を置換) */
  captions: string[];
  /** シリーズ固有ハッシュタグ(共通タグに追加) */
  tags: string[];
}

/** 全シリーズ共通の締め(縦型・固定カメラ・6秒・人間なし) */
const COMMON_SUFFIX =
  "Fixed camera at eye level, vertical 9:16 format, natural lighting, " +
  "realistic fur and physics, believable weight and balance, no humans visible, 6 seconds.";

/** 共通ハッシュタグ(コピペ用ベース) */
export const COMMON_HASHTAGS =
  "#funnyanimals #aivideo #reels #viral #cute #fyp #martialarts #格闘技";

export const SERIES: ReelSeries[] = [
  {
    name: "にゃん術",
    combo: "猫×ブラジリアン柔術",
    aliases: ["猫×柔術", "柔術", "bjj", "jiujitsu"],
    subject: "gray tabby cat wearing a tiny white jiu-jitsu gi with a white belt",
    sequences: [
      "doing solo Brazilian jiu-jitsu drills: quick precise hip escape shrimping movements across the mat",
      "performing a slow careful forward roll breakfall, then kneeling in seiza and giving a small polite bow",
      "playfully practicing guard position with a soft plush grappling dummy, hugging it and rolling sideways",
      "doing technical stand-up drills, rising from the mat with one paw raised in a guard",
    ],
    settings: [
      "a traditional Japanese dojo with green tatami mats and wooden walls",
      "a bright Japanese living room with tatami mats laid on the floor",
    ],
    captions: ["にゃん術 第{n}話 🥋 Oss!", "Cat jiu-jitsu training day {n} 🥋"],
    tags: ["#cat #bjj #jiujitsu #catsofinstagram #猫"],
  },
  {
    name: "キックドクシング",
    combo: "柴犬×キックボクシング",
    aliases: ["犬×キックボクシング", "キックボクシング", "柴犬", "kickboxing"],
    subject: "Shiba Inu standing upright on its hind legs in a kickboxing stance",
    sequences: [
      "throwing a left jab, a right cross, then a sharp low kick, tail wagging with focus",
      "throwing a determined teep front kick at a heavy punching bag, the bag swaying slightly",
      "attempting a high kick, wobbling comically and almost falling, then recovering with a proud confident expression",
      "doing fast pad-work style combinations in the air: jab, cross, hook, low kick",
    ],
    settings: [
      "a bright Japanese living room with a sofa in the background",
      "a clean kickboxing gym with a ring in the background",
    ],
    captions: ["キックドクシング 第{n}戦 🥊", "Low kick training day {n} 🐕🥊"],
    tags: ["#dog #shibainu #kickboxing #dogsofinstagram #犬"],
  },
  {
    name: "ニャンフー",
    combo: "猫×カンフー",
    aliases: ["カンフー", "kungfu", "白猫"],
    subject: "white cat standing upright with impossibly graceful poise",
    sequences: [
      "holding a crane kung fu stance on one leg, then flowing through slow graceful forms",
      "performing a rapid sequence of kung fu palm strikes, finishing in a perfectly still horse stance",
    ],
    settings: [
      "a misty bamboo grove courtyard with a stone floor at dawn",
      "a Chinese-style courtyard with red lanterns and stone lions",
    ],
    captions: ["ニャンフー 巻ノ{n} 🐾", "Kung fu cat, chapter {n} 🐾"],
    tags: ["#cat #kungfu #catsofinstagram #猫"],
  },
  {
    name: "犬道",
    combo: "ゴールデンレトリバー×剣道",
    aliases: ["犬×剣道", "剣道", "kendo", "レトリバー"],
    subject: "golden retriever standing upright in a kendo stance holding a bamboo shinai with both front paws",
    sequences: [
      "performing three focused overhead practice swings, then holding perfect stillness in zanshin",
      "doing quick suriashi sliding footwork forward and back, shinai held steady",
    ],
    settings: [
      "a traditional Japanese kendo dojo with a polished wooden floor",
    ],
    captions: ["犬道(けんどう) 其の{n} 🎋", "The way of the dog, part {n} 🎋"],
    tags: ["#dog #kendo #goldenretriever #犬"],
  },
  {
    name: "ハムスリング",
    combo: "ハムスター×レスリング",
    aliases: ["ハムスター", "レスリング", "wrestling"],
    subject: "golden hamster in a low wrestling stance",
    sequences: [
      "doing rapid tiny footwork drills, then a lightning-fast takedown practice motion onto a soft mini mat",
      "doing sprint intervals on a hamster wheel as footwork training, then striking a wrestling pose",
    ],
    settings: [
      "a desk setup that looks like a tiny wrestling gym, macro close-up",
    ],
    captions: ["ハムスリング 第{n}番勝負 🐹", "Hamster wrestling camp, day {n} 🐹"],
    tags: ["#hamster #wrestling #ハムスター"],
  },
  {
    name: "ムエコギ",
    combo: "コーギー×ムエタイ",
    aliases: ["コーギー", "ムエタイ", "muaythai"],
    subject: "Corgi wearing a small muay thai mongkol headband, standing on its short hind legs",
    sequences: [
      "performing a slow ceremonial wai kru dance, then one enthusiastic knee strike",
      "throwing short teep kicks with its stubby legs at a heavy bag, the bag barely moving",
    ],
    settings: [
      "a muay thai gym with a ring and hanging heavy bags, warm lighting",
    ],
    captions: ["ムエコギ 第{n}ラウンド 🇹🇭", "Muay thai corgi, round {n} 🇹🇭"],
    tags: ["#corgi #muaythai #dogsofinstagram #犬"],
  },
  {
    name: "にゃんMA",
    combo: "黒猫×総合格闘技",
    aliases: ["mma", "総合格闘技", "総合", "黒猫"],
    subject: "black cat standing upright, cool and expressionless",
    sequences: [
      "shadowboxing MMA style: two crisp punches, then a quick sprawl to the mat and back up",
      "practicing level changes and takedown entries, smooth and silent",
    ],
    settings: [
      "in front of an octagon cage fence with dramatic gym lighting",
    ],
    captions: ["にゃんMA 第{n}試合 🐈‍⬛", "MMA cat, fight week {n} 🐈‍⬛"],
    tags: ["#cat #mma #blackcat #猫"],
  },
  {
    name: "カピバラ道",
    combo: "カピバラ×不動の構え",
    aliases: ["カピバラ", "capybara"],
    subject: "capybara sitting completely still in a fighting stance pose, absolutely motionless",
    sequences: [
      "not moving a single muscle, gentle steam rising around it, a yuzu citrus balanced on its head",
      "slowly blinking once, otherwise perfectly motionless in its stance",
    ],
    settings: [
      "a steaming outdoor hot spring in soft winter light",
    ],
    captions: ["カピバラ道 第{n}段 ♨️", "The immovable capybara, level {n} ♨️"],
    tags: ["#capybara #カピバラ"],
  },
  {
    name: "ラビットワーク",
    combo: "うさぎ×フットワーク",
    aliases: ["うさぎ", "rabbit", "フットワーク"],
    subject: "lop-eared rabbit standing upright",
    sequences: [
      "doing impossibly fast boxing footwork, bouncing side to side with blinding speed but never throwing a single punch",
      "skipping an imaginary jump rope with perfect rhythm, ears bouncing",
    ],
    settings: [
      "a boxing gym with a ring in the background",
    ],
    captions: ["ラビットワーク 第{n}歩 🐰", "Footwork only, day {n} 🐰"],
    tags: ["#rabbit #boxing #footwork #うさぎ"],
  },
  {
    name: "パンダ拳",
    combo: "パンダ×空手の型",
    aliases: ["パンダ", "panda", "空手", "karate"],
    subject: "giant panda standing upright, huge and deliberate",
    sequences: [
      "performing an extremely slow karate kata with one heavy punch forward",
      "attempting to chop a stack of tiles, failing, and slowly sitting down defeated",
    ],
    settings: [
      "a karate dojo with white walls and wooden floor, natural light",
    ],
    captions: ["パンダ拳 型{n} 🐼", "Panda karate, kata {n} 🐼"],
    tags: ["#panda #karate #パンダ"],
  },
  {
    name: "ニャクシング",
    combo: "キジトラ猫×ボクシング",
    aliases: ["猫×ボクシング", "ボクシング", "boxing", "キジトラ"],
    subject: "gray tabby cat standing upright on its hind legs in a boxing stance",
    sequences: [
      "throwing a quick left jab, another jab, then a right hook, keeping its guard up between punches",
      "doing boxing head movement, slipping left and right, then throwing a fast one-two combination",
      "shadowboxing with quick jabs and ending with a slow-motion victory pose, arms raised",
    ],
    settings: [
      "a bright Japanese apartment living room with a cat tower in the background",
      "a clean modern boxing gym with a small hanging punching bag",
    ],
    captions: ["ニャクシング 第{n}R 🥊", "Jab! Jab! Hook! Round {n} 🥊"],
    tags: ["#cat #boxing #catsofinstagram #猫"],
  },
  {
    name: "ワンドクシング",
    combo: "大型犬×ボクシング",
    aliases: ["ワンドク", "大型犬", "グレートピレニーズ", "great pyrenees", "dog boxing"],
    subject: "large fluffy white Great Pyrenees dog standing upright on its hind legs in a boxing stance",
    sequences: [
      "throwing quick sharp paw jabs at a small focus mitt, returning to guard between each",
      "throwing a crisp one-two at a small focus mitt: a left paw jab then a right paw straight, back to guard",
      "throwing a hind-leg kick at a hanging heavy bag, the bag swinging naturally from the impact",
      "holding a calm boxing guard, bobbing and weaving with small head and shoulder movements",
    ],
    // image-to-video 専用(起点画像が犬と背景を決めるので、動き中心・崩れ防止を厚く)
    i2vSequences: [
      "A photorealistic large white fluffy dog training in a bright FLATUP GYM, throwing sharp, snappy, quick jabs with its front paw at a focus mitt, returning to guard between each jab. The focus mitt stays small and at a natural arm's-length distance, never covering the camera. Completely natural fluid motion, realistic weight shift and shoulder movement, believable timing, consistent face and fur, stable anatomy, no extra limbs, no morphing. Punching bags in the background, soft natural window light, cinema camera, shallow depth of field. Fixed camera at eye level, 6 seconds. Hyper-realistic, live-action, not cartoon.",
      "A photorealistic large white fluffy dog in a bright FLATUP GYM, throwing a crisp one-two at a small focus mitt: a quick left paw jab followed by a sharp right paw straight, then back to guard. The mitt stays small and at arm's-length, never covering the camera. Completely natural fluid motion, realistic weight transfer and balance, believable timing, consistent face and fur, stable anatomy, no extra limbs, no morphing. Punching bags in the background, soft natural light, cinema camera, shallow depth of field. Fixed camera at eye level, 6 seconds. Hyper-realistic, live-action, not cartoon.",
      "A photorealistic large white fluffy dog in a bright FLATUP GYM, kicking a hanging heavy punching bag with its hind leg, the bag swinging naturally from the impact, then resetting its stance. Completely natural fluid motion, realistic weight transfer and balance, believable physics on the swinging bag, natural muscle and fur movement, consistent face and fur, stable anatomy, no extra limbs, no morphing. Soft natural light, cinema camera, shallow depth of field. Fixed camera at eye level, 6 seconds. Hyper-realistic, live-action, not cartoon.",
      "A photorealistic large white fluffy dog standing in a bright FLATUP GYM, holding a calm boxing guard, bobbing and weaving with small subtle head and shoulder movements, staying alert and focused. Completely natural fluid motion, realistic subtle weight shifts, consistent face and fur, stable anatomy, no extra limbs, no morphing. Punching bags in the background, soft natural window light, cinema camera, shallow depth of field. Fixed camera at eye level, 6 seconds. Hyper-realistic, live-action, not cartoon.",
      "A photorealistic large white fluffy dog in a bright FLATUP GYM, doing light quick boxing footwork, bouncing and shifting weight side to side on its paws, staying loose and rhythmic. Completely natural fluid motion, realistic balance and momentum, consistent face and fur, stable anatomy, no extra limbs, no morphing. Punching bags in the background, soft natural light, cinema camera, shallow depth of field. Fixed camera at eye level, 6 seconds. Hyper-realistic, live-action, not cartoon.",
    ],
    settings: [
      "a bright FLATUP GYM with hanging punching bags and large windows",
      "a clean bright boxing gym with heavy bags in the background",
    ],
    captions: ["ワンドクシング 第{n}R 🥊🐕", "White dog boxing, round {n} 🥊🐕"],
    tags: ["#dog #boxing #greatpyrenees #dogsofinstagram #犬"],
  },
];

/** 入力(シリーズ名・別名・組み合わせ)からシリーズを解決する */
export function resolveSeries(input: string): ReelSeries | undefined {
  const q = input.trim().toLowerCase();
  if (!q) return undefined;
  return SERIES.find(
    s =>
      s.name.toLowerCase() === q ||
      q.includes(s.name.toLowerCase()) ||
      s.combo.toLowerCase() === q ||
      s.aliases.some(a => q === a.toLowerCase() || q.includes(a.toLowerCase()))
  );
}

/**
 * i 本目のプロンプトを組み立てる(技×舞台のローテーション)。
 * image-to-video モードで i2vSequences があれば、そちらを完結プロンプトとして使う
 * (被写体・背景は起点画像が決めるため、動き中心の文面をそのまま返す)。
 */
export function buildPrompt(series: ReelSeries, i: number, opts: { i2v?: boolean } = {}): string {
  if (opts.i2v && series.i2vSequences && series.i2vSequences.length > 0) {
    return series.i2vSequences[i % series.i2vSequences.length];
  }
  const seq = series.sequences[i % series.sequences.length];
  const setting = series.settings[Math.floor(i / series.sequences.length) % series.settings.length];
  return `A photorealistic ${series.subject}, ${seq}, in ${setting}. ${COMMON_SUFFIX}`;
}

/** i 本目のキャプション(話数入り) */
export function buildCaption(series: ReelSeries, i: number): string {
  const cap = series.captions[i % series.captions.length];
  return cap.replace("{n}", String(i + 1));
}

/** シリーズのハッシュタグ1行 */
export function buildHashtags(series: ReelSeries): string {
  return `${series.tags.join(" ")} ${COMMON_HASHTAGS}`;
}
