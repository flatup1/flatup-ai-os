#!/bin/bash
# 閉館後のFLATUP 第0話 — Mac用ワンタップ実行
#
# 使い方: Finder でこのファイルをダブルクリックするだけ。
# （初回だけ「開発元が未確認」と出たら、右クリック →「開く」）
#
# 中身は npm run movie -- ... を呼んでいるだけ。
# ターミナルから直接叩きたい人は docs/emotional_movie_ep0_prompts.md を参照。

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
YELLOW=$'\033[33m'; CYAN=$'\033[36m'; OFF=$'\033[0m'

say()  { printf "%s\n" "$*"; }
head2() { printf "\n%s%s%s\n" "$BOLD" "$*" "$OFF"; }
warn() { printf "%s[!] %s%s\n" "$YELLOW" "$*" "$OFF"; }
err()  { printf "%s[×] %s%s\n" "$RED" "$*" "$OFF"; }
ok()   { printf "%s[✓] %s%s\n" "$GREEN" "$*" "$OFF"; }

pause() { printf "\n%sEnter を押すとメニューに戻ります%s" "$DIM" "$OFF"; read -r _; }

# ---- 事前チェック -----------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  err "Node.js が入っていません。https://nodejs.org からインストールしてください。"
  pause; exit 1
fi

if [ ! -d node_modules ]; then
  head2 "初回セットアップ（1回だけ・1分ほど）"
  npm install || { err "npm install に失敗しました"; pause; exit 1; }
  ok "セットアップ完了"
fi

has_key() { [ -f .env ] && grep -qE '^(FAL_KEY|ARK_API_KEY)=.+' .env; }

require_key() {
  if has_key; then return 0; fi
  head2 "APIキーが未設定です"
  say "画像を作るには fal.ai のキーが要ります。"
  say "  取得: ${CYAN}https://fal.ai/dashboard/keys${OFF}"
  say ""
  printf "いま入力しますか？（貼り付けて Enter / 空Enterでキャンセル）\n> "
  read -r key
  if [ -z "$key" ]; then
    warn "キー無しで進みます（生成はされず、プロンプトの確認だけ＝料金ゼロ）"
    return 0
  fi
  if [ -f .env ] && grep -q '^FAL_KEY=' .env; then
    # 既存行を置き換える（キーを2つ書くと分かりにくいので）
    grep -v '^FAL_KEY=' .env > .env.tmp && mv .env.tmp .env
  fi
  printf 'FAL_KEY=%s\n' "$key" >> .env
  chmod 600 .env
  ok ".env に保存しました（このファイルは Git に入りません）"
}

open_dir() { [ -d "$1" ] && open "$1" || warn "まだありません: $1"; }

# ---- 各メニュー -------------------------------------------------------------
scene_list() {
  head2 "どのシーンを作り直しますか？"
  cat <<'LIST'
   1) C1   Scene1 グローブの目覚め
   2) C2   Scene2 夜の全景
   3) C3   Scene3 秘密の会議
   4) C4   Scene4 昼の回想・強い子
   5) C5a  Scene5 母の後ろに隠れる
   6) C5b  Scene5 先生が目線を合わせる
   7) C5c  Scene5 手元クローズアップ ★最重要
   8) C5d  Scene5 一歩前へ
   9) C5e  Scene5 はじめてのミット
  10) C5f  Scene5 母の表情
  11) C6   Scene6 決定の瞬間
  12) C7   Scene7 朝
   a) ぜんぶ
LIST
  printf "\n番号 > "
  read -r n
  local ids=(C1 C2 C3 C4 C5a C5b C5c C5d C5e C5f C6 C7)
  if [ "$n" = "a" ]; then
    require_key; npm run movie -- scenes; return
  fi
  if ! [[ "$n" =~ ^[0-9]+$ ]] || [ "$n" -lt 1 ] || [ "$n" -gt 12 ]; then
    warn "1〜12 か a を入れてください"; return
  fi
  local id="${ids[$((n-1))]}"
  printf "何枚つくりますか？（既定 2）> "
  read -r takes
  [[ "$takes" =~ ^[1-3]$ ]] || takes=2
  require_key
  npm run movie -- scenes --only "$id" --takes "$takes"
}

# ---- メインループ -----------------------------------------------------------
while true; do
  clear
  printf "%s閉館後のFLATUP 第0話「今日のチャンピオン」%s\n" "$BOLD" "$OFF"
  printf "%s%s%s\n" "$DIM" "$ROOT" "$OFF"
  if has_key; then
    printf "%sAPIキー: 設定済み%s\n" "$GREEN" "$OFF"
  else
    printf "%sAPIキー: 未設定（今は料金ゼロの確認モード）%s\n" "$YELLOW" "$OFF"
  fi
  cat <<'MENU'

  ── Day 1  キャラを決める ────────────────
   1) 設定画をつくる（12種 × 2枚：道具4体・ジム・人間3人）
   2) 採用した設定画を登録する          ← 選ぶだけ。名前は自動

  ── Day 2  シーンの絵をつくる ────────────
   3) シーン画をぜんぶつくる（12種 × 2枚）
   4) シーンを選んでつくり直す          ← シナリオごと
   5) 採用したシーン画を登録する

  ── Day 3  編集する ──────────────────────
   6) 編集台本と字幕(.srt)を書き出す     ← APIもネットも不要

  ── Day 4  動かす ────────────────────────
   7) 動画4カットをつくる

  ── そのほか ─────────────────────────────
   8) 出力フォルダを開く
   9) 全部チェックする（テスト）
   0) 終了

MENU
  printf "番号 > "
  read -r choice

  case "$choice" in
    1) require_key; npm run movie -- refs; pause ;;
    2) npm run movie:adopt -- refs; pause ;;
    3) require_key; npm run movie -- scenes; pause ;;
    4) scene_list; pause ;;
    5) npm run movie:adopt -- scenes; pause ;;
    6) npm run movie -- edl; pause ;;
    7) require_key; npm run movie -- cuts; pause ;;
    8) open_dir "$ROOT/output/movie/ep0"; pause ;;
    9) npm test; pause ;;
    0|q) say "おつかれさまでした"; exit 0 ;;
    *) warn "メニューの番号を入れてください"; sleep 1 ;;
  esac
done
