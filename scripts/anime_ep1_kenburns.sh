#!/usr/bin/env bash
# 静止画を「ゆっくり寄る／引く／流す」動きに変えて6秒クリップにする（ffmpegのみ・生成費ゼロ）。
#
# 動画AI（1本あたり約$1.5）を使わずに、画像だけでEP1を作るための低コスト経路。
#   画像8枚（約$0.3） → この処理（無料） → 連結 → 45秒の動画
# 動画AIを使う場合と比べて、費用がおよそ 1/40 になる。
#
# 使い方:
#   bash scripts/anime_ep1_kenburns.sh            # output/clips_src/cut*.png → output/clips/cut*.mp4
#   bash scripts/anime_ep1_kenburns.sh --selftest # 合成画像で動作確認（画像もAPIキーも不要）
#
# 仕上がり: 1080x1920 / 30fps / 6秒 / 無音。そのまま anime:ep1:stitch へ渡せる。

set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "❌ ffmpeg が見つかりません:"
  echo "   Mac:     brew install ffmpeg"
  echo "   Windows: winget install ffmpeg"
  exit 1
fi

SRC_DIR="output/clips_src"
OUT_DIR="output/clips"
DUR=6
FPS=30
W=1080
H=1920
FRAMES=$((DUR * FPS))

SELFTEST=0
[ "${1:-}" = "--selftest" ] && SELFTEST=1

if [ "$SELFTEST" = "1" ]; then
  SRC_DIR="$(mktemp -d)/src"
  OUT_DIR="$(mktemp -d)/out"
  mkdir -p "$SRC_DIR"
  echo "セルフテスト: 合成画像を8枚作って処理します（費用ゼロ）"
  for n in $(seq 1 8); do
    ffmpeg -y -loglevel error -f lavfi -i "testsrc2=size=${W}x${H}:duration=1:rate=1" \
      -frames:v 1 "$SRC_DIR/cut${n}.png"
  done
fi

if [ ! -d "$SRC_DIR" ]; then
  echo "❌ フォルダが見つかりません: $SRC_DIR"
  echo "   先に npm run anime:ep1:images で画像を作ってください。"
  exit 1
fi

mkdir -p "$OUT_DIR"

# カットごとに動きを変えて単調さを避ける。
# 1,8=外観(ゆっくり寄る/引く) / 3,7=静かな場面(微速ズーム) / 4,5=動きのある場面(やや強め)
motion_for () {
  case "$1" in
    1) echo "in" ;;    # 夜の外観 → ゆっくり寄る
    2) echo "in" ;;    # あいさつ
    3) echo "slow" ;;  # テーマ提示（静か）
    4) echo "left" ;;  # 基本練習（横に流す）
    5) echo "in" ;;    # ミット打ち
    6) echo "right" ;; # マススパー・礼
    7) echo "slow" ;;  # 整列・礼（静か）
    *) echo "out" ;;   # 外観に戻る → 引いて締める
  esac
}

# zoompan は入力を大きくしてから使うと揺れが出にくい
build_filter () {
  local kind="$1"
  local base="scale=$((W*2)):$((H*2)):force_original_aspect_ratio=increase,crop=$((W*2)):$((H*2))"
  local zp
  case "$kind" in
    in)    zp="z='min(zoom+0.00035,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'" ;;
    out)   zp="z='if(lte(zoom,1.0),1.12,max(zoom-0.00035,1.0))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'" ;;
    slow)  zp="z='min(zoom+0.00018,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'" ;;
    left)  zp="z='1.10':x='(iw-iw/zoom)*(1-on/${FRAMES})':y='ih/2-(ih/zoom/2)'" ;;
    right) zp="z='1.10':x='(iw-iw/zoom)*(on/${FRAMES})':y='ih/2-(ih/zoom/2)'" ;;
  esac
  echo "${base},zoompan=${zp}:d=${FRAMES}:s=${W}x${H}:fps=${FPS},format=yuv420p"
}

ok=0
missing=()
for n in $(seq 1 8); do
  src=""
  for ext in png jpg jpeg webp; do
    [ -f "$SRC_DIR/cut${n}.${ext}" ] && src="$SRC_DIR/cut${n}.${ext}" && break
  done
  if [ -z "$src" ]; then
    missing+=("cut${n}")
    continue
  fi
  kind="$(motion_for "$n")"
  printf "[cut%s] %s の動きを付けています..." "$n" "$kind"
  ffmpeg -y -loglevel error -loop 1 -i "$src" -t "$DUR" \
    -vf "$(build_filter "$kind")" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r "$FPS" \
    "$OUT_DIR/cut${n}.mp4"
  echo " 完了 → $OUT_DIR/cut${n}.mp4"
  ok=$((ok + 1))
done

echo ""
echo "完了: ${ok}/8 本（生成費ゼロ）"
[ ${#missing[@]} -gt 0 ] && echo "※ 画像が無いカット: ${missing[*]}"

# 素材が1枚も無いまま成功扱いにすると、後続の連結が「クリップが無い」という
# 分かりにくいエラーで落ちる。原因のある場所で止めて、何をすべきか示す。
if [ "$ok" = "0" ]; then
  echo ""
  echo "❌ 元になる画像が1枚もありません（$SRC_DIR が空）。"
  echo "   先に画像生成（npm run anime:ep1:images）が成功している必要があります。"
  echo "   直前の画像生成が 403 Exhausted balance で失敗している場合は、"
  echo "   fal.ai/dashboard/billing で残高をチャージしてから再実行してください。"
  exit 1
fi

if [ "$SELFTEST" = "1" ]; then
  echo ""
  echo "--- セルフテスト検証 ---"
  fail=0
  for n in $(seq 1 8); do
    f="$OUT_DIR/cut${n}.mp4"
    [ -s "$f" ] || { echo "❌ cut${n}.mp4 が作られていない"; fail=1; continue; }
    size="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height \
      -of csv=p=0:s=x "$f")"
    dur="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"
    echo "cut${n}: ${size} ${dur}s"
    [ "$size" = "${W}x${H}" ] || { echo "❌ cut${n} のサイズが ${W}x${H} でない"; fail=1; }
    case "$dur" in 6.*|5.9*) ;; *) echo "❌ cut${n} の長さが6秒でない"; fail=1 ;; esac
  done
  [ "$fail" = "0" ] && echo "✅ セルフテスト成功（8本すべて ${W}x${H}）" || { echo "❌ セルフテスト失敗"; exit 1; }
  exit 0
fi

echo "次: npm run anime:ep1:stitch で1本につなぐ"
