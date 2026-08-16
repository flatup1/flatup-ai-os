/**
 * FLATUP アニメ シリーズの話数レジストリ。
 *
 * 各話の8カット（画像プロンプト + 動画プロンプト）をここに集約する。
 * 画像生成・動画化・CIはすべてこの定義を参照するので、直すときはここだけ直す。
 *
 * キャラ・世界観の正本は docs/flatup_animation_bible.md（v3.0）。
 * 各話の絵コンテは docs/flatup_anime_episode<N>.md と1対1で対応する。
 */

import { EP1_CUT_DEFS, EP1_STYLE_SUFFIX, EP1_MOTION_SUFFIX, type Ep1Cut } from "./animeEp1Cuts.js";

export type EpisodeCut = Ep1Cut;

export interface Episode {
  n: number;
  /** 話タイトル（バイブルのシリーズ構成と一致させる） */
  title: string;
  /** 芯のメッセージ */
  message: string;
  cuts: EpisodeCut[];
  /** カット順の字幕（CapCutでそのまま使う） */
  subtitles: string[];
}

/**
 * EP2「ありがとうが言えるかな？」
 *
 * ツム(5)はまだ「ありがとう」が言えない。グローブを落として困っているところを
 * リク(7)が拾ってくれる。メルティが背中をそっと押し、最後にツムが自分の言葉で伝える。
 * バイブルの共通ルール（あいさつ・礼・笑顔・仲間を応援・ありがとう・自分で考える）を満たす。
 */
const EP2_CUTS: EpisodeCut[] = [
  {
    n: 1,
    title: "朝のジム・ツム登場",
    image:
      "A shy 5-year-old chibi girl with soft light-brown hair in a small high ponytail tied with a dark red hair tie, big brown eyes, wearing a plain white short-sleeve t-shirt and light blue FLAT UP GYM shorts, barefoot, standing alone near the entrance holding oversized boxing gloves, looking down a little nervously, morning light through the window",
    video:
      "The shy little girl hugs her gloves a bit tighter and glances up hesitantly, gentle breathing and blinking, tender quiet mood",
  },
  {
    n: 2,
    title: "グローブを落とす",
    image:
      "The same shy chibi girl (light-brown ponytail, white t-shirt, light blue shorts) fumbles and drops one oversized boxing glove on the white gym floor, a small surprised expression on her face, other chibi kids warming up in the soft background, bright clean gym",
    video:
      "One glove slips from her arms and lands softly on the floor, she freezes with a small surprised expression, gentle motion only",
  },
  {
    n: 3,
    title: "リクが拾ってくれる",
    image:
      "A cheerful 7-year-old chibi boy with messy dark hair in a FLAT UP GYM t-shirt kneeling down to pick up the dropped yellow-trimmed boxing glove, smiling warmly at the shy girl, bright clean gym floor, kind helpful atmosphere",
    video:
      "The cheerful boy picks up the glove and holds it out toward her with a big friendly smile, one gentle motion only",
  },
  {
    n: 4,
    title: "言えないツム",
    image:
      "Close view of the shy chibi girl (light-brown ponytail, white t-shirt, light blue shorts) receiving the glove with both hands, her mouth slightly open as if a word is stuck, cheeks faintly pink, eyes lowered, soft warm light, tender and a little bittersweet mood",
    video:
      "She takes the glove with both hands and her lips part as if trying to speak, then she looks down shyly, very gentle motion",
  },
  {
    n: 5,
    title: "メルティが寄り添う",
    image:
      "A kind female instructor in her late twenties with a warm smile, wearing a black FLAT UP GYM shirt, kneeling to eye level beside the shy chibi girl and speaking gently to her, bright clean gym, reassuring atmosphere",
    video:
      "The instructor kneels to eye level and speaks warmly with a soft encouraging gesture, the girl listens and slowly lifts her eyes",
  },
  {
    n: 6,
    title: "小さな勇気",
    image:
      "The shy chibi girl taking a small breath and lifting her face with quiet courage, hands gripping the glove, soft hopeful light streaming in from the window, the boy waiting nearby with a patient smile",
    video:
      "She takes one small breath and lifts her face with quiet determination, soft hopeful light glows, one gentle motion only",
  },
  {
    n: 7,
    title: "ありがとう",
    image:
      "The shy chibi girl finally smiling and bowing slightly toward the cheerful boy, both children smiling at each other, other kids and instructors watching warmly in the background, bright clean gym, joyful heartwarming moment",
    video:
      "She smiles and bows slightly toward the boy, he beams back happily, warm gentle motion, everyone's expression softens",
  },
  {
    n: 8,
    title: "みんなで練習・ロゴ",
    image:
      "A group of chibi kids and instructors standing together in a bright clean gym, everyone smiling, the shy girl now standing among them with her gloves on, warm afternoon light, space at center for a logo, cinematic",
    video:
      "Very slow pull-back from the smiling group, warm light glows steadily, calm happy ending, one gentle motion only",
  },
];

/**
 * EP3「新学期、勇気を出そう」（春・GW）
 * 新環境への不安から、勇気を出して一歩を踏み出す。桜咲く春のジムで、新しい友だちとの出会い。
 */
const EP3_CUTS: EpisodeCut[] = [
  {
    n: 1,
    title: "学校帰り・ジム前でドキドキ",
    image:
      "A nervous 6-year-old chibi girl (light-brown ponytail with dark red tie, white t-shirt, light blue shorts) standing outside the FLATUP GYM entrance, looking uncertain, cherry blossoms falling gently around her, springtime fresh greenery in the background, warm 3D animation movie style, Pixar and Illumination quality, soft spring golden-hour lighting, cinematic depth of field, white floor inside visible through the window, heartwarming, no scary faces, vertical 9:16",
    video:
      "She takes a small breath and clasps her hands nervously, glancing at the door with a mix of fear and curiosity, soft cherry blossom petals fall around her, gentle trembling motion, spring warmth in the air, one gentle motion only",
  },
  {
    n: 2,
    title: "先輩リクが手を出す",
    image:
      "A cheerful 8-year-old chibi boy (dark messy hair, yellow t-shirt, colorful spring-themed shorts) kneeling down to the nervous girl's eye level, smiling warmly and offering his hand, cherry blossoms and GW festival small flags decorating the gym entrance, bright clean spring day, warm 3D animation movie style, Pixar and Illumination quality, soft golden-hour lighting, cinematic depth of field, heartwarming, no scary faces, vertical 9:16",
    video:
      "The cheerful boy extends one hand confidently toward her, smiling encouragement, gentle beckoning motion with his other hand, spring breeze seems to blow, one gentle motion only",
  },
  {
    n: 3,
    title: "ツムが手を握る",
    image:
      "Close view of both children: the nervous girl (light-brown ponytail, white t-shirt) taking the boy's hand with both of hers, eyes brightening with hope, the boy smiling warmly, cherry blossom petals swirling around them, GW campaign flags visible in the gym behind them, warm 3D animation movie style, Pixar and Illumination quality, heartwarming, no scary faces, vertical 9:16",
    video:
      "She reaches out slowly and firmly grasps his hand, her eyes lifting with determination, a hint of a smile appears on her face, gentle hand-squeeze motion, warm spring lighting glows softly, one gentle motion only",
  },
  {
    n: 4,
    title: "メルティ先生が応援",
    image:
      "A kind female instructor (black FLATUP GYM shirt, warm smile) standing behind the two children, placing gentle hands on their shoulders, full of encouragement and pride, cherry blossoms visible through the gym windows, GW flags and spring decorations cheerfully arranged, warm spring indoor lighting, warm 3D animation movie style, Pixar and Illumination quality, cinematic depth of field, heartwarming, no scary faces, vertical 9:16",
    video:
      "Melty smiles brightly and pats both children's shoulders gently, nodding encouragement, her smile radiates warmth and pride, soft gentle encouraging motion, spring light glows warmly through the window, one gentle motion only",
  },
  {
    n: 5,
    title: "ジムの中へ一緒に",
    image:
      "Both children walking together into the bright clean FLATUP GYM interior, hand in hand, other kids waving from inside, white floor, green mats, yellow and neon pink punching bags, GW campaign small flags hanging from the ceiling, cherry blossom decorations, warm spring afternoon light streaming through windows, warm 3D animation movie style, Pixar and Illumination quality, heartwarming, everyone smiling, vertical 9:16",
    video:
      "The two children step inside together, their hands still connected, they look around with wonder at the colorful GW decorations and friendly faces, gentle walking motion, warm spring sunlight floods the gym, one gentle motion only",
  },
  {
    n: 6,
    title: "初めての練習・笑顔",
    image:
      "The nervous girl (now smiling) wearing oversized boxing gloves, standing beside the cheerful boy, both attempting a gentle punch under Masaki's guidance, other children cheering from the background, GW flags and spring decorations festive around the gym, white floor with spring light, warm 3D animation movie style, Pixar and Illumination quality, heartwarming, smiling faces everywhere, vertical 9:16",
    video:
      "The girl throws one gentle punch, laughing softly, the boy nods encouragement, everyone around them claps gently, warm spring sunlight illuminates the gym, celebrating moment, one gentle motion only",
  },
  {
    n: 7,
    title: "新しい友だち・輪が広がる",
    image:
      "A group of cheerful chibi kids (various sizes, colors, all with spring-themed outfits) standing together in a circle, the nervous girl now beaming and standing among them, everyone wearing FLATUP GYM gear, cherry blossoms and GW festival flags decorating the background, warm spring afternoon lighting, warm 3D animation movie style, Pixar and Illumination quality, heartwarming joyful moment, no scary faces, vertical 9:16",
    video:
      "All the children smile and give thumbs up or wave cheerfully to the camera, the girl in the center laughs happily, everyone's friendship and connection visible, warm spring light glows softly, celebrating new friendships, one gentle motion only",
  },
  {
    n: 8,
    title: "新学期、勇気を出した",
    image:
      "All children standing together in the bright FLATUP GYM, everyone smiling, the girl who was nervous now standing confidently, Masaki and Melty in the background also smiling proudly, cherry blossoms and GW campaign decorations creating festive spring atmosphere, space at center for a logo, cinematic, warm 3D animation movie style, Pixar and Illumination quality, heartwarming, vertical 9:16",
    video:
      "Very slow pull-back from the happy group of children, everyone smiling with confidence and joy, warm spring light glows steadily, celebrating courage and new beginnings, calm happy ending, one gentle motion only",
  },
];

/**
 * EP4「夏、強くなろう」（夏・夏休み）
 * 夏休みの楽しい時間の中で、友だちと一緒に力を合わせて練習する。祭りのような華やかな夏のジムで、元気いっぱい！
 */
const EP4_CUTS: EpisodeCut[] = [
  {
    n: 1,
    title: "夏のジム・祭りムード",
    image:
      "Bright cheerful FLATUP GYM interior on a hot summer day, colorful summer festival atmosphere with neon festival lanterns, wind chimes, and colorful decorations hanging from the ceiling, children in bright summer-colored FLATUP GYM t-shirts (yellows, water-blues, oranges, pinks), white gym floor gleaming in bright sunlight through the windows, white wall with GYM sign, warm 3D animation movie style, Pixar and Illumination quality, bright vibrant summer lighting, cheerful energetic mood, no scary faces, vertical 9:16",
    video:
      "Festival lanterns sway gently in the air conditioning breeze, wind chimes tinkle softly, bright summer sunlight streaming through windows creates dancing light patterns on the white floor, energetic but calm introduction, one gentle motion only",
  },
  {
    n: 2,
    title: "ツムと先輩リク・気合入る",
    image:
      "A smiling 6-year-old chibi girl (light-brown ponytail with dark red tie, bright yellow t-shirt, vibrant rainbow-striped shorts) standing beside an excited 8-year-old chibi boy (dark hair, water-blue tank, orange shorts), both with determined happy expressions, fist-bumping with energy, colorful summer festival decorations and lanterns around them, bright white gym floor, warm 3D animation movie style, Pixar and Illumination quality, bright cheerful summer lighting, energetic exciting mood, vertical 9:16",
    video:
      "Both children fist-bump with enthusiasm, their eyes shining with excitement and determination, big smiles on their faces, gentle upward-lifting fist-bump motion, bright colorful lanterns sway behind them, summer energy builds, one gentle motion only",
  },
  {
    n: 3,
    title: "チームで練習・力を合わせる",
    image:
      "Tsumu (yellow shirt, rainbow shorts) and Riku (blue tank, orange shorts) practicing together with padded mitts, Melty holding the mitts and encouraging them, other children in bright summer outfits watching and cheering, colorful festival lanterns and wind chimes festively arranged overhead, white gym floor bright and clean, warm 3D animation movie style, Pixar and Illumination quality, bright vibrant summer lighting, everyone engaged and happy, vertical 9:16",
    video:
      "Tsumu and Riku practice punches in unison, hitting the mitts together, Melty nods encouragement with a big smile, other children cheer softly, bright summer sunlight illuminates the gym festively, teamwork and bonding motion, one gentle motion only",
  },
  {
    n: 4,
    title: "メルティ先生・笑顔でサムズアップ",
    image:
      "Melty (black FLATUP GYM tank, pink shorts) in the center giving a big thumbs-up with a radiant smile, Tsumu and Riku on either side mirroring her thumbs-up with big grins, other kids visible in the background also giving thumbs-up, colorful summer festival decorations and lanterns creating celebratory atmosphere, bright white gym floor and cheerful bright summer lighting, warm 3D animation movie style, Pixar and Illumination quality, joyful celebrating mood, vertical 9:16",
    video:
      "Melty raises her thumbs-up high and shouts encouragement, Tsumu and Riku follow with their thumbs-up, all smiling brilliantly, gentle upward lifting thumbs-up motion, other children cheer, bright summer light floods the gym, celebrating success and teamwork, one gentle motion only",
  },
  {
    n: 5,
    title: "全員でお祭り気分・練習タイム",
    image:
      "All chibi children in bright summer outfits (yellows, blues, oranges, pinks, all in FLATUP GYM gear) practicing various moves together under Masaki's guidance, colorful festival lanterns swaying overhead, wind chimes tinkling, cheerful summer festival decorations everywhere, bright sunlit white gym floor, warm 3D animation movie style, Pixar and Illumination quality, bright vibrant summer lighting, fun energetic happy atmosphere, everyone smiling and engaged, vertical 9:16",
    video:
      "All children practice punches and kicks in a celebratory atmosphere, Masaki claps encouragement, colorful lanterns sway gently, wind chimes tinkle softly creating a festival soundscape, bright summer sunlight dances on the floor, energetic yet controlled practicing motion, one gentle motion only",
  },
  {
    n: 6,
    title: "元気いっぱい・ジャンプ",
    image:
      "Tsumu (yellow shirt, rainbow shorts) and Riku (blue tank, orange shorts) jumping high with joy and energy, arms raised, huge smiles on their faces, other kids also jumping in celebration, colorful lanterns and wind chimes creating festive summer backdrop, bright white gym floor, warm 3D animation movie style, Pixar and Illumination quality, bright cheerful summer lighting, pure joyful energy, no scary faces, vertical 9:16",
    video:
      "Both children jump high into the air with arms raised, laughing joyfully, other kids follow their lead jumping too, colorful lanterns sway with the energy, bright summer sunlight catches their movement, celebratory energetic jumping motion, one gentle motion only",
  },
  {
    n: 7,
    title: "友だち・絆が深まる",
    image:
      "All the chibi kids standing together arm-in-arm in a circle, everyone in bright summer-colored outfits, beaming with happiness and connection, colorful festival lanterns hanging overhead, wind chimes creating a gentle festive atmosphere, white gym floor bright with summer sunlight, Masaki and Melty also smiling proudly in the background, warm 3D animation movie style, Pixar and Illumination quality, bright vibrant summer lighting, heartwarming friendship, vertical 9:16",
    video:
      "All children stand together arm-in-arm in a circle, everyone smiling and looking at each other with genuine warmth and connection, gentle swaying arm-in-arm motion, colorful lanterns sway softly above them, bright summer light bathes the scene, celebrating deep friendship and bonding, one gentle motion only",
  },
  {
    n: 8,
    title: "夏、強くなった",
    image:
      "Wide shot of all children standing confidently in the bright FLATUP GYM, everyone wearing their summer gear, posing with confident happy expressions, colorful festival lanterns and wind chimes creating a celebratory festive summer atmosphere, white floor shining in bright sunlight, Masaki and Melty smiling proudly, space at center for a logo, cinematic, warm 3D animation movie style, Pixar and Illumination quality, bright vibrant summer lighting, triumphant joyful mood, vertical 9:16",
    video:
      "Very slow pull-back from the confident group of children, colorful lanterns sway gently, wind chimes tinkle softly, bright summer sunlight streams warmly through windows creating golden patterns, calm happy ending celebrating summer growth and strength, one gentle motion only",
  },
];

/**
 * EP5「秋、心を整える」（秋・新学期）
 * 秋の落ち着きの中で、集中力と落ち着きを学ぶ。紅葉と深い色合いの秋のジムで、心を整える大切さを知る。
 */
const EP5_CUTS: EpisodeCut[] = [
  {
    n: 1,
    title: "秋のジム・静かな時間",
    image:
      "Serene FLATUP GYM interior on an autumn afternoon, warm earthy autumn colors, deep burgundy and orange leaves visible through the windows, soft amber autumn sunlight streaming in creating warm shadows on white floor, children in deep autumn-colored outfits (dark browns, deep oranges, navy blues), quiet peaceful atmosphere, warm 3D animation movie style, Pixar and Illumination quality, soft warm autumn lighting, calm concentrated mood, no scary faces, vertical 9:16",
    video:
      "Autumn leaves gently sway outside the window, soft warm amber light moves slowly across the white gym floor, a sense of calm and stillness fills the space, peaceful contemplative beginning, one gentle motion only",
  },
  {
    n: 2,
    title: "深呼吸・心を落ち着ける",
    image:
      "A 6-year-old chibi girl (light-brown ponytail with dark red tie, deep brown t-shirt, navy blue shorts) sitting cross-legged on the white gym floor, eyes closed peacefully, hands folded in meditation pose, autumn leaves visible through window behind her casting warm shadows, warm 3D animation movie style, Pixar and Illumination quality, soft warm autumn lighting, serene peaceful mood, gentle cinematic depth of field, vertical 9:16",
    video:
      "She closes her eyes and takes one slow deep breath in, her shoulders relax downward, peaceful expression on her face, warm autumn light illuminates her gently, meditative calming motion, one gentle motion only",
  },
  {
    n: 3,
    title: "リク先輩・集中力を教える",
    image:
      "An 8-year-old chibi boy (dark hair, deep orange t-shirt, dark burgundy shorts) standing beside the girl, teaching her a slow deliberate punch stance, focused determined expression, both concentrating intently, autumn leaves creating warm patterns of shadow and light around them, white gym floor, warm 3D animation movie style, Pixar and Illumination quality, soft warm autumn lighting, concentrated calm mood, vertical 9:16",
    video:
      "The boy demonstrates one slow controlled punch, movements precise and deliberate, the girl watches intently and mirrors his stance, gentle slow-motion deliberate motion, warm autumn light highlights their focus, teaching and learning, one gentle motion only",
  },
  {
    n: 4,
    title: "メルティ先生・心を読む",
    image:
      "Melty (black FLATUP GYM tank, deep autumn-rust colored shorts) kneeling down to the girl's eye level, speaking softly with a knowing understanding smile, her hand gently placed on the girl's heart, autumn leaves creating warm golden light patterns around them, peaceful atmosphere, warm 3D animation movie style, Pixar and Illumination quality, soft warm autumn lighting, intimate understanding mood, vertical 9:16",
    video:
      "Melty speaks softly while placing her hand gently over the girl's heart, nodding with understanding and wisdom, the girl nods back peacefully, gentle intimate reassuring motion, warm autumn light creates golden patterns, emotional connection, one gentle motion only",
  },
  {
    n: 5,
    title: "一人で向き合う・瞑想的練習",
    image:
      "Tsumu (deep brown shirt, navy shorts) standing alone on the white gym floor in a focused stance, eyes concentrated, deep in practice, warm autumn light creating long shadows, autumn leaves visible through window, other children practicing quietly in background, peaceful focused atmosphere, warm 3D animation movie style, Pixar and Illumination quality, soft warm autumn lighting, meditative concentrated mood, vertical 9:16",
    video:
      "She practices one slow deliberate punch, movements controlled and focused, her mind fully present in the motion, warm autumn light illuminates her concentration, one slow disciplined motion, peaceful meditative atmosphere, one gentle motion only",
  },
  {
    n: 6,
    title: "マサキ先生・承認の笑顔",
    image:
      "Masaki (black FLATUP GYM tank, blue-and-flame shorts) watching Tsumu practice, a proud gentle smile on his face, nodding slightly in recognition of her focused effort, autumn leaves and warm golden light creating serene backdrop, white gym floor, warm 3D animation movie style, Pixar and Illumination quality, soft warm autumn lighting, proud paternal mood, vertical 9:16",
    video:
      "Masaki watches her practice and gives one small approving nod, his smile conveying deep pride and encouragement, gentle nod motion, warm autumn light bathes the scene in golden peace, recognition and support, one gentle motion only",
  },
  {
    n: 7,
    title: "全員・静かな調和",
    image:
      "All chibi children in deep autumn colors standing together in peaceful rows, practicing synchronized movements in perfect calm stillness, Masaki and Melty standing to the side observing with proud smiles, autumn leaves visible through windows creating warm golden light, white gym floor reflecting peaceful amber glow, warm 3D animation movie style, Pixar and Illumination quality, soft warm autumn lighting, harmonious serene mood, vertical 9:16",
    video:
      "All children move in perfect synchronized slow motion, like a meditation, every movement controlled and focused, warm autumn light moves slowly across the white floor, gentle swaying unified motion, perfect harmony and focus, one gentle motion only",
  },
  {
    n: 8,
    title: "秋、心を整えた",
    image:
      "Wide shot of all children standing peacefully in the serene FLATUP GYM, everyone looking calm and centered, deep autumn colors, warm golden autumn light creating gentle shadows, Masaki and Melty standing proudly, space at center for a logo, cinematic peaceful shot, warm 3D animation movie style, Pixar and Illumination quality, soft warm autumn lighting, serene satisfied mood, vertical 9:16",
    video:
      "Very slow pull-back from the peaceful group, warm autumn light slowly moves across the floor, leaves outside sway gently, calm peaceful atmosphere maintained, tranquil satisfied ending celebrating inner focus and peace, one gentle motion only",
  },
];

/**
 * EP6「冬、ありがとうをめぐる」（冬・クリスマス＋お正月）
 * 1年の振り返りと感謝。クリスマスとお正月の二つの大切な時間に、友だちや先生への「ありがとう」の気持ちを伝える。
 */
const EP6_CUTS: EpisodeCut[] = [
  {
    n: 1,
    title: "冬のジム・クリスマスムード",
    image:
      "Festive FLATUP GYM interior decorated for Christmas, warm white and golden Christmas lights, a decorated Christmas tree with ornaments visible inside the gym, red and white garland decorations, wreaths on the walls, children in festive winter outfits with Christmas touches, snow visible gently falling outside the windows, warm 3D animation movie style, Pixar and Illumination quality, warm golden-white Christmas lighting, festive joyful mood, no scary faces, vertical 9:16",
    video:
      "Christmas lights twinkle softly, a Christmas tree sparkles with gentle lights, wreath decorations sway slightly, soft snow falls outside the windows creating a serene festive backdrop, warm cozy Christmas beginning, one gentle motion only",
  },
  {
    n: 2,
    title: "ツムが思い出す・1年の冒険",
    image:
      "A 6-year-old chibi girl (light-brown ponytail with dark red tie, festive red t-shirt with white collar, gold-and-red shorts) sitting peacefully, eyes looking up thoughtfully, Christmas lights reflecting in her eyes, memory-like soft focus images of her growth journey this year floating around her, Christmas decorations and warm golden light creating nostalgic mood, warm 3D animation movie style, Pixar and Illumination quality, warm golden Christmas lighting, reflective nostalgic mood, vertical 9:16",
    video:
      "She closes her eyes and takes one peaceful breath, a gentle smile crosses her face as she remembers, soft Christmas lights twinkle around her creating a magical moment, nostalgic peaceful reflecting motion, one gentle motion only",
  },
  {
    n: 3,
    title: "リク・メルティ・マサキへの感謝",
    image:
      "Tsumu (red festive shirt, gold-and-red shorts) standing before three beloved mentors: Riku (wearing a Santa hat), Melty (with a festive red bow), and Masaki (in a dark hoodie with Christmas decorations), all smiling warmly toward her, Christmas lights and decorations creating a warm golden backdrop, white gym floor reflecting Christmas light, warm 3D animation movie style, Pixar and Illumination quality, warm golden Christmas lighting, heartwarming grateful mood, vertical 9:16",
    video:
      "Tsumu takes one small step forward toward them with gratitude in her eyes, Riku, Melty and Masaki all smile warmly and open their arms welcomingly, gentle approaching grateful motion, Christmas lights sparkle softly around them, celebration of mentorship, one gentle motion only",
  },
  {
    n: 4,
    title: "クリスマス・みんなでハグ",
    image:
      "Tsumu being gently hugged by Riku, Melty, and Masaki, all smiling warmly with love and pride, surrounded by soft Christmas lights and festive decorations, white gym floor, Christmas tree sparkling in the background, warm cozy Christmas family feeling, warm 3D animation movie style, Pixar and Illumination quality, warm golden Christmas lighting, loving intimate joyful mood, vertical 9:16",
    video:
      "All four embrace warmly, Tsumu closes her eyes peacefully in their warmth, everyone's expression radiating love and care, gentle swaying hugging motion, Christmas lights twinkle overhead creating magic, celebrating family love and gratitude, one gentle motion only",
  },
  {
    n: 5,
    title: "お正月・新年の決心",
    image:
      "The gym transformed for New Year celebration: traditional Japanese New Year decorations with shimenawa rope and pine branches, white gym floor with red and white New Year decorations, children in festive New Year outfits (reds and golds), standing together facing a new beginning, soft warm golden-white New Year light, warm 3D animation movie style, Pixar and Illumination quality, warm golden New Year lighting, hopeful new beginning mood, vertical 9:16",
    video:
      "New Year decorations shimmer softly, traditional decorations gently sway, soft light creates a fresh new beginning atmosphere, everyone stands ready to face the new year with hope and determination, gentle new-beginning stillness, one gentle motion only",
  },
  {
    n: 6,
    title: "全員で新年の誓い",
    image:
      "All chibi children (including Tsumu in a festive gold-and-red New Year outfit) standing together in front of the traditional New Year decorated gym, each with one fist raised in determined hopeful pose, everyone smiling with determination for the coming year, shimenawa and pine decorations, warm golden New Year light, warm 3D animation movie style, Pixar and Illumination quality, warm golden New Year lighting, determined hopeful mood, vertical 9:16",
    video:
      "All children raise their fists in unison with determined confident expressions, everyone's eyes shining with hope and goals for the new year, gentle synchronized raising fist motion, warm New Year light illuminates their determination, celebration of new year commitment, one gentle motion only",
  },
  {
    n: 7,
    title: "冬から春へ・繋がる心",
    image:
      "Tsumu (in gold-and-red New Year outfit) holding hands with Riku, standing with Melty and Masaki, all looking toward a window where soft winter light is beginning to warm with hints of early spring, symbolizing the continuation of their bond through seasons, white gym floor, warm golden transitional lighting, warm 3D animation movie style, Pixar and Illumination quality, warm golden New Year lighting, hopeful continuous connection mood, vertical 9:16",
    video:
      "The group stands together hand-in-hand, looking toward the window at the changing season, gentle warm light increases symbolizing spring's approach, everyone's hearts connected through seasons, gentle hand-holding bonding motion, light grows warmer suggesting spring's arrival, eternal connection, one gentle motion only",
  },
  {
    n: 8,
    title: "冬、ありがとうをめぐる",
    image:
      "Wide final shot of all children standing peacefully in the beautifully decorated gym combining Christmas and New Year elements, everyone radiating gratitude and hope, warm golden-white festive light, Masaki and Melty standing proudly among them, space at center for a logo, cinematic hopeful shot, warm 3D animation movie style, Pixar and Illumination quality, warm golden festive lighting, grateful hopeful satisfied mood, vertical 9:16",
    video:
      "Very slow pull-back from the grateful hopeful group, warm festive light bathes everyone in gratitude and hope, New Year and Christmas decorations frame the scene with golden warmth, calm peaceful beautiful ending celebrating gratitude, connection through seasons, and hope for the future, one gentle motion only",
  },
];

export const EPISODES: Episode[] = [
  {
    n: 1,
    title: "はじめてのキックボクシング",
    message: "最初の一歩を踏み出す",
    cuts: EP1_CUT_DEFS,
    subtitles: [
      "FLATUP GYM",
      "こんばんは！",
      "今日は「優しくなること」",
      "まっすぐ、いいね！",
      "ナイス！",
      "勝ち負けじゃない",
      "ありがとうございました！",
      "世界一やさしい格闘技ジム",
    ],
  },
  {
    n: 2,
    title: "ありがとうが言えるかな？",
    message: "感謝を言葉にする",
    cuts: EP2_CUTS,
    subtitles: [
      "ツム、5さい。",
      "あっ…",
      "はい、どうぞ！",
      "…（言えない）",
      "ゆっくりでいいよ",
      "すぅ…",
      "ありがとう！",
      "世界一やさしい格闘技ジム",
    ],
  },
  {
    n: 3,
    title: "新学期、勇気を出そう",
    message: "新環境への一歩",
    cuts: EP3_CUTS,
    subtitles: [
      "新学期、ドキドキ。",
      "手を出してくれた。",
      "握った。",
      "応援してくれる。",
      "中へ。",
      "初めて。",
      "新しい友だち。",
      "世界一やさしい格闘技ジム",
    ],
  },
  {
    n: 4,
    title: "夏、強くなろう",
    message: "友だちと力を合わせる",
    cuts: EP4_CUTS,
    subtitles: [
      "夏祭り、ジム。",
      "気合だ！",
      "力を合わせて。",
      "やった！",
      "全員で。",
      "ジャンプ！",
      "絆が深まる。",
      "世界一やさしい格闘技ジム",
    ],
  },
  {
    n: 5,
    title: "秋、心を整える",
    message: "落ち着きと集中力",
    cuts: EP5_CUTS,
    subtitles: [
      "秋、静かな時間。",
      "深呼吸。",
      "集中力。",
      "心を読む。",
      "向き合う。",
      "承認。",
      "調和。",
      "世界一やさしい格闘技ジム",
    ],
  },
  {
    n: 6,
    title: "冬、ありがとうをめぐる",
    message: "感謝と新年の希望",
    cuts: EP6_CUTS,
    subtitles: [
      "クリスマス。",
      "1年を思い出す。",
      "ありがとう。",
      "ハグ。",
      "お正月。",
      "新年の誓い。",
      "繋がる心。",
      "世界一やさしい格闘技ジム",
    ],
  },
];

/** 話数から定義を引く。未定義の話数はエラーにして誤生成を防ぐ */
export function getEpisode(n: number): Episode {
  const ep = EPISODES.find(e => e.n === n);
  if (!ep) {
    throw new Error(
      `EP${n} はまだ定義されていません。利用できるのは ${EPISODES.map(e => `EP${e.n}`).join(", ")} です。` +
      `（新しい話は src/reel/animeEpisodes.ts に追加してください）`
    );
  }
  return ep;
}

/** 引数 --episode N から話数を読む（既定1） */
export function parseEpisodeArg(args: string[]): number {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--episode" || args[i] === "--ep") {
      const v = Number(args[i + 1]);
      if (Number.isInteger(v) && v > 0) return v;
    }
  }
  const env = Number(process.env.ANIME_EPISODE);
  return Number.isInteger(env) && env > 0 ? env : 1;
}

export { EP1_STYLE_SUFFIX as STYLE_SUFFIX, EP1_MOTION_SUFFIX as MOTION_SUFFIX };

/** カットの完成した画像プロンプト（共通の画風付き） */
export function imagePromptOf(cut: EpisodeCut): string {
  return `${cut.image}, ${EP1_STYLE_SUFFIX}`;
}

/** カットの完成した動画プロンプト（共通の動かし方付き） */
export function videoPromptOf(cut: EpisodeCut): string {
  return `${cut.video}, ${EP1_MOTION_SUFFIX}`;
}
