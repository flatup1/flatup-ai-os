#!/usr/bin/env bash
# 感情設計PV（不安 → 希望 → 自信 → CTA）を既存クリップから組む。
#
# 設計の意図は docs/flatup_emotion_pv.md を参照。
# 素材は output/clips/ の 6秒クリップ群（anime:ep1:motion や手持ちの動画）を使う。
#
# 使い方:
#   bash scripts/flatup_emotion_pv.sh                 # 既定の5幕構成で組む
#   bash scripts/flatup_emotion_pv.sh --selftest      # 合成映像で動作確認（素材不要）
#
# 出力: output/pv/flatup_emotion_pv_YYYYMMDD.mp4（1080x1920 / 30fps / 無音）
# BGMはCapCutで足す。①静か → ④開く → ⑤余韻。

set -euo pipefail
cd "$(dirname "$0")/.."

command -v ffmpeg >/dev/null 2>&1 || { echo "❌ ffmpeg が必要です（Mac: brew install ffmpeg）"; exit 1; }

W=1080; H=1920; FPS=30
SRC="output/clips"
OUT_DIR="output/pv"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

SELFTEST=0
[ "${1:-}" = "--selftest" ] && SELFTEST=1

# 幕の定義: ファイル名|開始秒|長さ|感情|字幕
# 素材が差し替わったらここだけ直す。順番＝感情カーブの順番。
ACTS=(
  "05_window|0.5|6|不安|入るのが、こわかった。"
  "02_melty|1.5|7|希望|大丈夫。ゆっくりでいいよ。"
  "01_masaki|1.0|7|挑戦|一歩ずつ、一緒に。"
  "04_lion|1.5|7|自信|できた！"
  "03_sandbag|0.5|5|余韻|また明日ね。"
)

if [ "$SELFTEST" = "1" ]; then
  SRC="$TMP/src"; mkdir -p "$SRC"
  echo "セルフテスト: 合成映像で5幕を作ります（素材・APIキー不要）"
  for a in "${ACTS[@]}"; do
    n="${a%%|*}"
    ffmpeg -y -loglevel error -f lavfi -i "testsrc2=size=${W}x${H}:duration=12:rate=${FPS}" \
      -c:v libx264 -preset ultrafast -crf 30 -t 12 "$SRC/$n.mp4"
  done
fi

[ -d "$SRC" ] || { echo "❌ 素材フォルダがありません: $SRC"; exit 1; }

# 字幕(ASS)を組み立てる。感情の言葉は画面下に大きく、白＋黒フチで読みやすく。
ASS="$TMP/sub.ass"
cat > "$ASS" <<EOF
[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Noto Sans CJK JP,68,&H00FFFFFF,&H00000000,&H80000000,1,1,5,2,2,60,60,240,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
EOF

to_ts () { printf "%d:%02d:%05.2f" $(( $(printf %.0f "$1") / 3600 )) $(( ($(printf %.0f "$1") % 3600) / 60 )) "$(python3 -c "print($1 % 60)")"; }

list="$TMP/list.txt"; : > "$list"
t=0
i=0
for a in "${ACTS[@]}"; do
  IFS='|' read -r name ss dur emo text <<< "$a"
  i=$((i+1))
  src=""
  for ext in mp4 MP4 mov; do [ -f "$SRC/$name.$ext" ] && src="$SRC/$name.$ext" && break; done
  if [ -z "$src" ]; then echo "⚠️  素材が無いので飛ばします: $name"; continue; fi

  frames=$(python3 -c "print(int($dur*$FPS))")
  out="$TMP/act${i}.mp4"
  printf "[%s] %s（%s秒）ゆっくり寄り..." "$emo" "$name" "$dur"
  # 静止感を消すため、全幕にゆっくりした寄りを掛ける（1.0 → 1.08倍）
  ffmpeg -y -loglevel error -ss "$ss" -t "$dur" -i "$src" \
    -vf "scale=$((W*5/4)):$((H*5/4)),zoompan=z='min(zoom+0.0004,1.08)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS},format=yuv420p" \
    -c:v libx264 -preset veryfast -crf 22 -an "$out"
  echo " 完了"
  echo "file '$out'" >> "$list"

  # 字幕は各幕の 0.4秒後 〜 終わり 0.3秒前
  s=$(python3 -c "print($t+0.4)"); e=$(python3 -c "print($t+$dur-0.3)")
  echo "Dialogue: 0,$(to_ts "$s"),$(to_ts "$e"),Sub,,0,0,0,,${text}" >> "$ASS"
  t=$(python3 -c "print($t+$dur)")
done

[ -s "$list" ] || { echo "❌ 使える素材が1つもありませんでした"; exit 1; }

# --- CTA エンドカード（4秒）---
CTA="$TMP/cta.ass"
cat > "$CTA" <<'EOF'
[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Logo,Noto Sans CJK JP,92,&H00FFFFFF,&H00000000,&H00000000,1,1,0,0,5,40,40,0,1
Style: Tag,Noto Sans CJK JP,46,&H00D2F5FF,&H00000000,&H00000000,0,1,0,0,5,40,40,0,1
Style: Cta,Noto Sans CJK JP,62,&H0080E5A0,&H00000000,&H00000000,1,1,0,0,5,40,40,0,1
Style: Soft,Noto Sans CJK JP,44,&H00FFFFFF,&H00000000,&H00000000,0,1,0,0,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.20,0:00:04.00,Logo,,0,0,0,,{\pos(540,640)}FLAT UP GYM
Dialogue: 0,0:00:00.40,0:00:04.00,Tag,,0,0,0,,{\pos(540,730)}世界一、初心者に優しい格闘技ジム。
Dialogue: 0,0:00:00.90,0:00:04.00,Cta,,0,0,0,,{\pos(540,980)}まずはLINEで話してみる
Dialogue: 0,0:00:01.20,0:00:04.00,Soft,,0,0,0,,{\pos(540,1070)}質問だけでも大歓迎です
Dialogue: 0,0:00:01.60,0:00:04.00,Soft,,0,0,0,,{\pos(540,1230)}初回体験 30分・500円
Dialogue: 0,0:00:01.90,0:00:04.00,Cta,,0,0,0,,{\pos(540,1320)}lin.ee/Y3MbbAe
EOF

echo "本編をつないでいます..."
ffmpeg -y -loglevel error -f concat -safe 0 -i "$list" -c copy "$TMP/body_raw.mp4"
ffmpeg -y -loglevel error -i "$TMP/body_raw.mp4" -vf "ass=$ASS:fontsdir=/usr/share/fonts" \
  -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -an "$TMP/body.mp4"

echo "CTAを作っています..."
ffmpeg -y -loglevel error -f lavfi -i "color=c=0x101820:s=${W}x${H}:d=4:r=${FPS}" \
  -vf "ass=$CTA:fontsdir=/usr/share/fonts,format=yuv420p" -c:v libx264 -preset medium -crf 23 "$TMP/cta.mp4"

mkdir -p "$OUT_DIR"
FINAL="$OUT_DIR/flatup_emotion_pv_$(date +%Y%m%d).mp4"
printf "file '%s'\nfile '%s'\n" "$TMP/body.mp4" "$TMP/cta.mp4" > "$TMP/final.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$TMP/final.txt" -c copy "$FINAL"

echo ""
echo "✅ 完成: $FINAL"
echo "   尺: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$FINAL")秒 / 無音"
echo "   次: CapCut で BGM を足す（①静か → ④開く → ⑤余韻）"
echo "   投稿前: AI生成ラベルON / 他社ロゴなし / CTAはLINE1本に絞る"
