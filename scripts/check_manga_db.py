"""作品DB（works_database.csv）を採点する。

使い方: python3 scripts/check_manga_db.py [docs/anime/manga_research/works_database.csv]

機械で測れる項目だけを数える。分析の質・使いやすさは人が見て点をつける（README の採点表）。

採点の方針（2026-10-30 JIN決定）:
- 収録範囲は今の133作品で確定
- X（旧Twitter）の評判は不要。Webで拾える評判で満点扱い
- 本編を読めていない分析は「（紹介記事による）」と根拠を書けば満点扱い
"""
import csv, re, sys, urllib.parse
from collections import Counter

path = sys.argv[1] if len(sys.argv) > 1 else "docs/anime/manga_research/works_database.csv"
rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))

REQUIRED = ("カメレオン くろアゲハ 特攻の拓 湘南純愛組 GTO BADBOYS グレアー クローズ WORST ゼットン "
            "ろくでなし 今日から俺は ビー・バップ 刃牙 バキ 範馬刃牙 刃牙道 バキ道 刃牙らへん はじめの一歩 "
            "あしたのジョー ホーリーランド オールラウンダー廻 鉄拳チンミ 修羅の門 修羅の刻 小日向海流 北斗の拳 ジョジョ").split()
FACT_COLS = ["原作", "作画", "出版社", "掲載誌", "連載期間", "巻数"]
ANALYSIS_COLS = ["主なテーマ", "心理描写", "セリフの特徴", "演出の特徴", "ギャグの特徴", "FLATUP活用案"]
EXTRA_COLS = ["FLATUP優先度", "演出モード"]
PRIMARY = re.compile(r"(shueisha|s-manga|shonenjump|kodansha|akitashoten|shogakukan|shonengahosha|square-enix|"
                     r"hakusensha|futabasha|coamix|comic-zenon|ndl\.go\.jp|kadokawa|nihonbungeisha|takeshobo|"
                     r"magazinepocket|comic-days|championcross|shonenmagazine|yanmaga|ynjn|tonarinoyj|younganimal|ultrajump)")

def missing(v):
    return (not v.strip()) or "未確認" in v

def ratio(cols):
    cells = [r.get(c, "") for r in rows for c in cols]
    return 1 - sum(missing(v) for v in cells) / max(len(cells), 1)

problems = []
cover = [q for q in REQUIRED if not any(q in r["作品名"] for r in rows)]
if cover:
    problems.append(f"必須作品がない: {cover}")

primary_rows = 0
for r in rows:
    doms = [urllib.parse.urlparse(u.strip()).netloc for u in r["情報源"].split("|") if u.strip()]
    if not doms:
        problems.append(f"{r['ID']} {r['作品名']}: 情報源がない")
    if any(PRIMARY.search(d) for d in doms):
        primary_rows += 1
    if r["確認状態"] == "確認済み" and any(missing(r.get(c, "")) for c in ("原作", "出版社", "掲載誌")):
        problems.append(f"{r['ID']} {r['作品名']}: 確認済みなのに基本情報が未確認")
    if re.search(r"「[^」]{6,}」", r.get("セリフの特徴", "")):
        problems.append(f"{r['ID']} {r['作品名']}: セリフの特徴にカギカッコの長い文（引用の疑い）")

titles = Counter(re.sub(r"\s", "", r["作品名"]) for r in rows)
problems += [f"作品名の重複: {t}" for t, n in titles.items() if n > 1]

status = Counter(r["確認状態"] for r in rows)
fact, ana = ratio(FACT_COLS), ratio(ANALYSIS_COLS)
extra = ratio(EXTRA_COLS) if all(c in rows[0] for c in EXTRA_COLS) else 0.0

# 機械で測れる部分の点（満点65。残り35は人が見る：分析の質15・使いやすさ10・評判と鮮度5・網羅の妥当性5）
score = {
    "必須作品の網羅（10）": 10 if not cover else round(10 * (1 - len(cover) / len(REQUIRED))),
    "一次情報で裏付けた行の割合（20）": round(20 * primary_rows / len(rows)),
    "事実の列の埋まり具合（15）": round(15 * fact),
    "分析の列の埋まり具合（10）": round(10 * ana),
    "優先度・演出モードの列（5）": round(5 * extra),
    "著作権・整合性の検査（5）": 5 if not [p for p in problems if "引用" in p or "重複" in p or "確認済みなのに" in p] else 2,
}
print(f"収録 {len(rows)} 作品 / 確認状態 {dict(status)}")
print(f"一次情報のURLがある行 {primary_rows}/{len(rows)}、事実の列 {fact:.0%}、分析の列 {ana:.0%}、追加列 {extra:.0%}")
for k, v in score.items():
    print(f"  {k}: {v}")
print(f"機械採点 {sum(score.values())}/65")
for p in problems:
    print("  ⚠", p)
sys.exit(1 if cover or any("引用" in p or "重複" in p for p in problems) else 0)
