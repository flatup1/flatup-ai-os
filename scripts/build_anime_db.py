#!/usr/bin/env python3
"""企画の資料(Markdown表)から docs/anime/db/ のCSV・XLSXを作る。資料が正本。DBは写し。"""
import re, csv, os, glob
from datetime import date
R = os.path.join(os.path.dirname(__file__), '..', 'docs', 'anime')
OUT = os.path.join(R, 'db'); os.makedirs(OUT, exist_ok=True)

def clean(s): return re.sub(r'\*\*|`', '', s).strip()

def tables(path, start_pat, end_pat=None):
    """start_pat の見出し以降にあるMarkdown表を全部返す(行リストのリスト)"""
    lines = open(os.path.join(R, path), encoding='utf-8').read().split('\n')
    i = next(k for k, l in enumerate(lines) if re.search(start_pat, l))
    j = len(lines)
    if end_pat:
        j = next((k for k in range(i + 1, len(lines)) if re.search(end_pat, lines[k])), len(lines))
    out, cur = [], []
    for l in lines[i:j]:
        if l.startswith('|'):
            cur.append([clean(c) for c in l.strip().strip('|').split('|')])
        else:
            if cur: out.append(cur); cur = []
    if cur: out.append(cur)
    return [[r for r in t if not all(re.fullmatch(r'-*:?-*', c) or c == '' for c in r)] for t in out]

def write(name, header, rows):
    with open(os.path.join(OUT, name + '.csv'), 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f); w.writerow(header); w.writerows(rows)
    return header, rows

sheets = {}
# 1 episodes
t = tables('series_12_plan.md', r'^### 2-1\.', r'^### 2-2\.')[0]
sheets['episodes'] = write('episodes', t[0], t[1:])
# 2 decisions
t = tables('omnibus_series_bible.md', r'^## 決定の記録', r'^\*\*この設計書での読み方')[0]
sheets['decisions'] = write('decisions', t[0], t[1:])
# 3 open questions
t = [x for x in tables('omnibus_series_bible.md', r'^## 10\.', r'^## 11\.') if x[0][0] == '#'][0]
sheets['open_questions'] = write('open_questions', t[0], t[1:])
# 4 canon ledger (adopted) and proposals
tt = tables('series_12_plan.md', r'^### 4-2\.', r'^## 5\.')
sheets['canon_adopted'] = write('canon_adopted', tt[0][0], tt[0][1:])
sheets['canon_proposed'] = write('canon_proposed', tt[1][0], tt[1][1:])
# 5 files index
files = []
status = {
 'master_prompt_2026-10-30.md': ('最上位の正本', '確定'),
 'ep01_hikkoshi_canon_A.md': ('第1話 正本A版(§1-4原文)', '確定'),
 'omnibus_series_bible.md': ('シリーズ設計書 v2', '採点r4=83'),
 'series_12_plan.md': ('12話の企画表', '提案(JIN採用待ち)'),
 'ep04_nimotsu_rep.md': ('代表作 第4話 台本・制作パック', '採点r4=81'),
 'ep01_hikkoshi_betsuko_v2.md': ('第1話の改善別稿', '下書き(採点r4=85)'),
 'manga_ep03_kaeshite.md': ('第5話「かえして」', '下書き(採点r4=88・直し後は未採点)'),
 'manga_seikimatsu_narita_ep1.md': ('第6話 世紀末ナリタ伝説', '下書き(採点r4=81・直し後は未採点)'),
 'opening_seikimatsu_narita.md': ('世紀末のオープニング', '下書き'),
 'character_design_proposals.md': ('見た目の案(決定ずみ)', '確定'),
 'character_reference_prompts.md': ('基準画像のプロンプト', '未生成(費用承認待ち)'),
 'master_prompt_reconciliation.md': ('マスタープロンプトと既存資料の対応表', '更新中'),
 'manga_ep02_hikkoshi.md': ('第1話 B系別稿', '別稿(参考)'),
 'hikkoshi_ep1_narita.md': ('第1話 B系別稿', '別稿(参考)'),
}
for p in sorted(glob.glob(os.path.join(R, '*.md')) + glob.glob(os.path.join(R, 'animatic', '*')) + glob.glob(os.path.join(R, 'manga_research', '*.*'))):
    rel = os.path.relpath(p, R); b = os.path.basename(p)
    if b in status: role, st = status[b]
    elif b.startswith('tokubetsu_'): role, st = 'GYMSTORYs別シリーズ', '触らない(cTSDajPz注意)'
    elif 'animatic' in rel: role, st = '動く絵コンテ/説明', '仮の絵'
    elif 'manga_research' in rel: role, st = 'ヤンキー・格闘技漫画DB資料', 'DB'
    else: role, st = '', ''
    files.append([rel, role, st])
sheets['files'] = write('files', ['パス', '役割', '状態'], files)
# 6 scores (独立審査員)
sc = [
 ['2026-11-02','r2','設計書',70,'独立審査員'],['2026-11-02','r3','設計書',79,'独立審査員'],
 ['2026-11-02','r4','シリーズ全体',83,'独立審査員'],['2026-11-02','r4','第1話パッケージ',85,'独立審査員'],
 ['2026-11-02','r4','代表作 第4話',81,'独立審査員'],['2026-11-02','r4','第5話 かえして',88,'独立審査員'],
 ['2026-11-02','r4','第6話 世紀末',81,'独立審査員'],
 ['2026-11-04','機械','漫画DB 133作品','56/65','scripts/check_manga_db.py'],
]
sheets['scores'] = write('scores', ['日付','回','対象','点','出どころ'], sc)
# xlsx
try:
    from openpyxl import Workbook
    wb = Workbook(); wb.remove(wb.active)
    for n, (h, rows) in sheets.items():
        ws = wb.create_sheet(n); ws.append(h)
        for r in rows: ws.append(r + [''] * (len(h) - len(r)))
        ws.freeze_panes = 'A2'
    wb.save(os.path.join(OUT, 'anime_project_db.xlsx'))
except ImportError:
    print('openpyxl なし: XLSXは作らない')
for n, (h, rows) in sheets.items(): print(n, len(rows), '行')
