"""調査結果 g*.json を1つの作品DB（CSV + XLSX）にまとめる。

使い方: python3 scripts/merge_manga_db.py <g*.jsonのあるフォルダ> docs/anime/manga_research

<フォルダ>/deep/ に作品カルテ（<key>.json）があれば、一覧に統合する（カルテID列で対応づけ、分析の列の「未確認」を補い、あらすじなどの列を足す）。
"""
import csv, json, sys, re
from pathlib import Path

src = Path(sys.argv[1])
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)

COLS = [
    ("id", "ID"), ("title", "作品名"), ("title_kana", "よみ"), ("category", "分類"),
    ("series_group", "シリーズ"), ("relation", "位置づけ"), ("author_story", "原作"),
    ("author_art", "作画"), ("publisher", "出版社"), ("magazine", "掲載誌"),
    ("run_period", "連載期間"), ("volumes", "巻数"), ("genre_tags", "ジャンル"),
    ("related_works", "関連作品"), ("themes", "主なテーマ"), ("psychology", "心理描写"),
    ("dialogue_style", "セリフの特徴"), ("direction_style", "演出の特徴"),
    ("gag_style", "ギャグの特徴"), ("flatup_priority", "FLATUP優先度"),
    ("homage_mode", "演出モード"), ("flatup_use", "FLATUP活用案"),
    ("copyright_caution", "著作権上の注意"), ("net_reputation", "ネットの評判"),
    ("sources", "情報源"), ("checked_date", "確認日"), ("status", "確認状態"),
]

def norm(t):
    return re.sub(r"[\s・!！?？〜~\-－]", "", t).lower()

rows, seen, dups = [], set(), []
for f in sorted(src.glob("g*.json")):
    for idx, r in enumerate(json.loads(f.read_text(encoding="utf-8"))):
        key = norm(r.get("title", ""))
        if key in seen:
            dups.append(r.get("title"))
            continue
        seen.add(key)
        r["sources"] = " | ".join(r.get("sources") or [])
        r["_group"] = f.stem
        r["key"] = f"{f.stem}_{idx:02d}"
        rows.append(r)


# --- 作品カルテの統合 -------------------------------------------------
KARTE_COLS = [
    ("key", "カルテID"), ("synopsis", "あらすじ"), ("setting", "舞台と時代"), ("cast_structure", "登場人物の役割"),
    ("story_structure", "物語の構成"), ("popular_scene_types", "人気の場面の型"), ("martial_arts_depiction", "格闘描写"),
    ("yankee_culture", "不良文化の描き方"), ("media_adaptations", "メディア展開"), ("awards_sales", "受賞・部数"),
    ("flatup_scene_ideas", "FLATUP場面案"), ("flatup_line_ideas", "オリジナルのセリフ案"),
    ("avoid_specifics", "真似しない要素"), ("evidence_basis", "カルテの根拠"), ("unverified", "カルテで確かめられなかった点"),
]
FILL = [("psychology", "psychology_techniques"), ("dialogue_style", "dialogue_techniques"),
        ("direction_style", "paneling_techniques"), ("gag_style", "gag_techniques")]
deep_dir = src / "deep"
karte_n = filled = corrected = 0
def missing(v):
    """空、または「未確認」で始まる／ほぼ「未確認」だけの値を、欠けているとみなす（本文の途中に注記として「未確認」が入っているだけの値は、欠けていない）。"""
    s = str(v).strip()
    return (not s) or s.startswith("未確認") or ("未確認" in s and len(s) <= 20)
LABEL2KEY = {j: k for k, j in COLS}
if deep_dir.is_dir():
    for r in rows:
        kf = deep_dir / (r["key"] + ".json")
        if not kf.exists():
            continue
        k = json.loads(kf.read_text(encoding="utf-8"))
        karte_n += 1
        for base, deep in FILL:
            if missing(r.get(base, "")) and not missing(k.get(deep, "")):
                r[base] = str(k[deep]) + "（カルテによる）"
                filled += 1
        for c in k.get("fact_corrections") or []:
            fld = LABEL2KEY.get(c.get("field"), c.get("field"))
            if fld in r and c.get("new") and fld not in ("sources", "id", "key"):
                r[fld] = c["new"]
                corrected += 1
        for kk, _ in KARTE_COLS:
            v = k.get(kk, "")
            r["k_" + kk] = "\n".join(f"・{x}" for x in v) if isinstance(v, list) and kk in ("flatup_scene_ideas", "flatup_line_ideas", "popular_scene_types", "unverified") else (" / ".join(map(str, v)) if isinstance(v, list) else str(v))
    # 作品カルテの出典URLを、情報源に足す
        extra = [u for u in (k.get("sources") or []) if u not in r["sources"]]
        if extra:
            r["sources"] = (r["sources"] + " | " if r["sources"] else "") + " | ".join(extra)
# 評判の「X直接検索なし」は、JINの方針（Xは不要）で出力から外す
for r in rows:
    r["net_reputation"] = re.sub(r"\s*X直接検索なし[。.]?", "", str(r.get("net_reputation", ""))).strip()
print(f"カルテ統合: {karte_n}件 / 分析の列を補った: {filled}か所 / 事実の直し: {corrected}か所", file=sys.stderr)

order = {"ヤンキー・不良": 0, "両方": 1, "格闘技・武道": 2}
rows.sort(key=lambda r: (order.get(r.get("category"), 3), r.get("series_group", ""), r["_group"]))
for i, r in enumerate(rows, 1):
    r["id"] = f"W{i:03d}"

ALLCOLS = COLS + [("k_" + k, j) for k, j in KARTE_COLS]
with open(out / "works_database.csv", "w", encoding="utf-8-sig", newline="") as fh:
    w = csv.writer(fh)
    w.writerow([j for _, j in ALLCOLS])
    for r in rows:
        w.writerow([str(r.get(k, "")) for k, _ in ALLCOLS])

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
wb = Workbook()
ws = wb.active
ws.title = "作品DB"
ws.append([j for _, j in ALLCOLS])
for r in rows:
    ws.append([str(r.get(k, "")) for k, _ in ALLCOLS])
for c in ws[1]:
    c.font = Font(bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor="1F2937")
widths = {"作品名": 28, "FLATUP活用案": 50, "著作権上の注意": 40, "情報源": 50, "あらすじ": 60, "物語の構成": 50, "FLATUP場面案": 55, "オリジナルのセリフ案": 45, "真似しない要素": 40}
for i, (_, j) in enumerate(ALLCOLS, 1):
    ws.column_dimensions[ws.cell(1, i).column_letter].width = widths.get(j, 22)
for row in ws.iter_rows(min_row=2):
    for c in row:
        c.alignment = Alignment(wrap_text=True, vertical="top")
ws.freeze_panes = "C2"
ws.auto_filter.ref = ws.dimensions

s = wb.create_sheet("集計")
from collections import Counter
s.append(["区分", "値", "件数"])
for name, key in (("分類", "category"), ("確認状態", "status")):
    for v, n in Counter(r.get(key, "") for r in rows).most_common():
        s.append([name, v, n])
s.append(["合計", "", len(rows)])
wb.save(out / "works_database.xlsx")

stats = Counter(r.get("status") for r in rows)
print(json.dumps({"total": len(rows), "status": stats, "category": Counter(r.get("category") for r in rows),
                  "duplicates_dropped": dups, "with_sources": sum(1 for r in rows if r["sources"])},
                 ensure_ascii=False, indent=1))
