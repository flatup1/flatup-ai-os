#!/usr/bin/env bash
# FLATUP アニメ EP1 の6秒クリップ8本を、1本の縦動画（9:16）につなぐスクリプト。
#
# これで「③つなぐ」が自動になる。残る手作業は CapCut で「④文字・音楽・ロゴ」だけ。
#
# 使い方（手元のMac/PCで）:
#   1) 6秒クリップ8本を output/clips/ に入れる。
#      ★ ファイル名を順番どおりにする（例: cut1.mp4, cut2.mp4 ... cut8.mp4）
#      名前順につなぐので、01_ / 02_ のような並ぶ名前ならOK。
#   2) bash scripts/anime_ep1_stitch.sh
#      → output/ep1/flatup_ep1_YYYYMMDD.mp4 ができる
#
#   フォルダやファイルを直接指定もできる:
#      bash scripts/anime_ep1_stitch.sh path/to/clips
#      bash scripts/anime_ep1_stitch.sh a.mp4 b.mp4 c.mp4 ...
#
# 仕組み: 全クリップを 1080x1920・30fps・無音 にそろえてから連結（元動画がバラバラでも
#         きれいに1本になる）。音楽は入れない＝CapCutで好きな曲を足す前提。
#
# 必要な道具: ffmpeg（無ければ入れ方を下に表示する）

set -euo pipefail
cd "$(dirname "$0")/.."

# --- ffmpeg があるか確認 ---
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "❌ ffmpeg が見つかりません。先に入れてください:"
  echo "   Mac:      brew install ffmpeg"
  echo "   Windows:  winget install ffmpeg   （または https://ffmpeg.org）"
  exit 1
fi

# --- つなぐクリップを集める ---
CLIPS=()
if [ "$#" -eq 0 ]; then
  SRC_DIR="output/clips"
elif [ "$#" -eq 1 ] && [ -d "$1" ]; then
  SRC_DIR="$1"
else
  # ファイルを直接ならべて渡された場合
  for f in "$@"; do CLIPS+=("$f"); done
  SRC_DIR=""
fi

if [ -n "${SRC_DIR:-}" ]; then
  if [ ! -d "$SRC_DIR" ]; then
    echo "❌ フォルダが見つかりません: $SRC_DIR"
    echo "   6秒クリップ8本を output/clips/ に入れてから、もう一度実行してください。"
    exit 1
  fi
  # 名前順（cut1, cut2 ...）に mp4/mov/webm を集める
  while IFS= read -r f; do CLIPS+=("$f"); done < <(find "$SRC_DIR" -maxdepth 1 -type f \
    \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.webm' -o -iname '*.m4v' \) | sort)
fi

if [ "${#CLIPS[@]}" -eq 0 ]; then
  echo "❌ つなぐ動画が1本もありません（${SRC_DIR:-指定ファイル}）。"
  exit 1
fi

echo "つなぐ順番（この並びで連結します）:"
i=0; for c in "${CLIPS[@]}"; do i=$((i+1)); echo "  ${i}. $c"; done
if [ "${#CLIPS[@]}" -ne 8 ]; then
  echo "⚠️  ふつうEP1は8本です。今は ${#CLIPS[@]} 本。順番と本数を確認してね（このまま続行します）。"
fi

# --- 作業フォルダ ---
DATE="$(date +%Y%m%d)"
OUT_DIR="output/ep1"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/flatup_ep1_${DATE}.mp4"

# --- 各クリップを同じ規格(1080x1920/30fps/無音)にそろえる ---
LIST="$TMP_DIR/list.txt"
: > "$LIST"
i=0
for c in "${CLIPS[@]}"; do
  i=$((i+1))
  norm="$TMP_DIR/norm_$(printf '%02d' "$i").mp4"
  echo "  そろえ中 ${i}/${#CLIPS[@]} ..."
  ffmpeg -y -loglevel error \
    -i "$c" \
    -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=48000" \
    -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,fps=30,format=yuv420p" \
    -map 0:v:0 -map 1:a:0 -shortest \
    -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 128k \
    "$norm"
  echo "file '$norm'" >> "$LIST"
done

# --- 連結（そろえた後なのでコピーで速い）---
echo "つなげています ..."
ffmpeg -y -loglevel error -f concat -safe 0 -i "$LIST" -c copy "$OUT_FILE"

echo ""
echo "✅ 完成: $OUT_FILE"
echo "次: CapCut でこの1本を開き、④ 文字・音楽・ロゴ を足せば公開用EP1になります。"
echo "   文字と手順は docs/flatup_anime_episode1.md「編集メモ」を参照。"
