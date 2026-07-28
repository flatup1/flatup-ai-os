#!/usr/bin/env bash
# FLATUP アニメ EP1「世界一やさしい格闘技ジム」 8カット元画像を一括生成するバッチ。
#
# 使い方（手元のMac/PCで）:
#   1) .env に FAL_KEY を入れる（無ければ DRY-RUN でコストゼロ・動作確認だけ）
#   2) bash scripts/anime_ep1.sh            # 各カット候補4枚ずつ
#      bash scripts/anime_ep1.sh 1          # 各カット1枚だけ（お試し）
#
# 生成物: output/images/YYYY-MM-DD/ に保存される。
# 各カットから良い1枚を選び、fal Playground(Hailuo 2.3 Fast I2V)で6秒動画化 → CapCutで連結。
# 動画化プロンプトは docs/flatup_anime_episode1.md「カット別 Hailuo 動画プロンプト」を参照。
#
# ※ この環境（クラウド）では FAL_KEY も ffmpeg も無いため DRY-RUN のみ。実生成は手元で。

set -euo pipefail
cd "$(dirname "$0")/.."

COUNT="${1:-4}"

# 共通接尾（世界観・舞台・画風を全カットで固定）
SUFFIX="warm 3D animation movie style, Pixar and Illumination quality, soft golden-hour lighting, cinematic depth of field, FLATUP GYM interior with white floor, green mats, potted plants, one yellow and one neon pink punching bag, white wall FLATUP GYM sign, heartwarming, no scary faces, vertical 9:16"

# 8カットの主プロンプト（docs/flatup_anime_episode1.md と一致）
CUT1="Establishing shot, a cozy two-story martial-arts gym named FLAT UP GYM on a quiet Japanese town street at night, warm light glowing from the windows, a lit wooden FLAT UP GYM sign, wet asphalt reflecting streetlights, punching bags visible through the window, no people, cinematic wide shot"
CUT2="A cheerful young male coach in his late twenties with short black hair and a shonen-hero look, black FLAT UP GYM hoodie, smiling and greeting a small group of 2.5-head-tall chibi kids in FLAT UP GYM t-shirts, everyone smiling"
CUT3="The young male coach kneeling and speaking gently to chibi kids sitting in seiza on the white gym floor, kids listening with big sparkling eyes, tender heartwarming mood"
CUT4="A row of 2.5-head-tall chibi kids in FLAT UP GYM t-shirts and muay thai shorts throwing gentle jab punches in unison, barefoot, the coach watching with a proud smile, playful energetic mood"
CUT5="The young coach holding a yellow-and-black focus mitt while a happy chibi kid punches it with a clean light hit, coach smiling and cheering, joyful mood"
CUT6="Two friendly chibi kids wearing soft headgear and oversized boxing gloves facing each other in a gentle no-contact light spar, then bowing and touching gloves with big smiles, safe playful atmosphere, absolutely no aggression or pain"
CUT7="A group of chibi kids in FLAT UP GYM t-shirts kneeling in a neat row in seiza and bowing respectfully, the coach bowing with them, calm grateful heartwarming mood"
CUT8="Exterior night view of FLAT UP GYM, warm light from the windows with silhouettes of smiling kids inside, empty quiet street, gentle magical evening mood, space at center for a logo, cinematic"

run_cut () {
  local n="$1"; local body="$2"
  echo ""
  echo "==================== CUT ${n} / 8 ===================="
  npm run --silent img -- "${body}, ${SUFFIX}" --count "${COUNT}"
}

echo "FLATUP アニメ EP1 — 8カット元画像を一括生成（各カット ${COUNT} 枚）"
run_cut 1 "$CUT1"
run_cut 2 "$CUT2"
run_cut 3 "$CUT3"
run_cut 4 "$CUT4"
run_cut 5 "$CUT5"
run_cut 6 "$CUT6"
run_cut 7 "$CUT7"
run_cut 8 "$CUT8"

echo ""
echo "===================================================="
echo "完了。output/images/ の各カットから良い1枚を選ぶ。"
echo "次: fal Playground(Hailuo 2.3 Fast I2V)で6秒動画化 → CapCutで8本連結。"
echo "動画化プロンプト・編集手順は docs/flatup_anime_episode1.md を参照。"
