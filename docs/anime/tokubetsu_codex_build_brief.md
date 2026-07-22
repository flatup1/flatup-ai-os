# 【Codex貼り付け用・実装ビルド指示書】GYMSTORYs特別編『そのちから、なにに使う?』を“動くアニメ”にする

> このファイルをそのまま Codex（コーディングAI）に貼り付けてください。既存の Canvas→MP4 エンジン
> **`openqlow/girl-power-op/`** の上に、本特別編アニメを実装し、**本編・60秒・30秒・15秒**の MP4 と
> サイト埋め込み用ループを生成できる状態にするのがゴールです。
>
> 併せて公開用の **LP差別化コピー / 60秒絵コンテ / SNS初回3投稿** も本書に同梱（Codexはこれらを
> 字幕・投稿文としてそのまま使う）。原作コンセプトは `docs/anime/tokubetsu_chikara_to_sekinin_shijisho.md`、
> トーン正本は `docs/marketing/oya_column_yasashii_tsuyosa.md`。

---

## 0. 事前理解（既存エンジンの仕組み・変更しない前提）
`openqlow/girl-power-op/` は「時刻 t の1枚を Canvas に描く index.html」＋「1/30秒ずつ撮って ffmpeg で繋ぐ render.js」。
- 物語は `window.STORY`（シーン配列）。`index.html` は `?story=` で読むファイルを切替（既定=flatup、`op`=旧版）。
- 各シーンは `SCENES[type](t, lt, p, sc)`。`t`=全体時刻/`lt`=シーン内時刻/`p`=進捗0〜1/`sc`=story行。
- 使える描画API: `cx2d`,`W`,`H`,`VERT`,`pose(name,fallback)`,`cardDraw(x,yTop,scale,rot,sqx,sqy,img)`,
  `coverDraw`,`popText(txt,x,y,size,fill,t0,t,rot,maxW)`,`heart(x,y,s,color)`,`star`,`flash(a,color)`,
  `halftone(a)`,`sunburst`,`skyBg`,`QUIET`(静か系BGMのSet),`sceneAt(t)`,`draw(t)`,`seek(t)`。
- 既存の予約CTA: `#booking-cta`（本物のHTMLリンク）が cta シーン中に表示される（loop時）。触らない。
- レンダリング: `npm run video`（1280x720）/ `npm run video:vertical`（1080x1920）。

**IP・安全（絶対厳守）**: スター・ウォーズ/ジェダイ/ライトセーバー/“フォース”/スパイダーマン等の
造形・固有名・決め台詞・効果音は不使用。**剣・銃・光る剣を出さない。** 表現は本エンジン独自の
「**手に灯る光**（金色=守る／青紫の影=傷つける）」のみ。暴力を派手に見せない。出血・恐怖なし。
子どもの人格否定なし。保護者・家庭を責めない。

---

## 1. Codex がやること（タスク）
1. `girl-power-op/index.html` の `SCENES` に**新シーン型**を追加（§3）。描画ヘルパ `glow()` `coolOverlay()` `parentSilhouette()` を追加。
2. `girl-power-op/story.chikara.js` を新規作成（§4）。`?cut=` で 本編/60/30/15 を切替。
3. `girl-power-op/index.html` の story セレクタを拡張し `?story=chikara` を読めるようにする（§5）。
4. `girl-power-op/render.js` を拡張し `--story=` `--cut=` `--out=` を受け付ける（§6）。
5. **生成**: 本編/60/30/15 を横型・縦型で出力（§6のコマンド）。
6. **検証**: §10 の受け入れ基準を Playwright で自動確認（pageerror 0、全シーン描画、CTAリンク、4本レンダリング）。
7. 公開用テキスト（§7 LP / §8 60秒字幕 / §9 SNS3投稿）は本書からコピーして所定箇所へ（動画字幕・投稿下書き）。

---

## 2. 追加/変更ファイル
```
girl-power-op/
├── index.html          # 変更: SCENES に新型追加 + ヘルパ + story セレクタ拡張
├── render.js           # 変更: --story/--cut/--out 対応
├── story.chikara.js    # 新規: 本特別編の物語(?cut=main|60|30|15)
└── (poses/ は既存流用。新規アセット不要 = 光は Canvas 演出で描く)
```

---

## 3. 追加する描画ヘルパと新シーン型（実装ヒント。エンジンの書き味に合わせる）

### 3-1. ヘルパ（`index.html` の effects 群の近くに追加）
```js
// 手に灯る光: 金色(warm)＝守る / 青紫(cold)＝傷つける
function glow(x, y, r, color, alpha) {
  cx2d.save();
  cx2d.globalAlpha = alpha;
  const g = cx2d.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  cx2d.fillStyle = g;
  cx2d.beginPath(); cx2d.arc(x, y, r, 0, 7); cx2d.fill();
  cx2d.restore();
}
const GOLD = '#ffcf6a', COLD = '#7b6bd6';   // 金色 / 青紫
// 影の場面用: 画面を少し冷たく沈ませる(彩度が落ちた印象)
function coolOverlay(alpha) { flash(alpha, '#3a2f55'); }
// 保護者(後ろ姿シルエット): 顔は見せない
function parentSilhouette(x, yBottom, s, color) {
  cx2d.save(); cx2d.fillStyle = color || 'rgba(60,40,70,.55)';
  cx2d.beginPath(); cx2d.arc(x, yBottom - s * 1.6, s * .5, 0, 7); cx2d.fill();   // 頭
  cx2d.beginPath();
  cx2d.moveTo(x - s, yBottom); cx2d.quadraticCurveTo(x - s, yBottom - s * 1.1, x, yBottom - s * 1.1);
  cx2d.quadraticCurveTo(x + s, yBottom - s * 1.1, x + s, yBottom); cx2d.closePath(); cx2d.fill(); // 肩
  cx2d.restore();
}
```

### 3-2. 新シーン型（`SCENES` に追加）
`sc.glowColor` は 'warm'|'cold'|'turn'（turn は青紫→金へ p で遷移）を想定。拳の位置は
キャラ中央やや下（横型: `W/2, H*0.42` / 縦型: `W/2, H*0.5` 目安。既存 cardDraw 位置に合わせ微調整）。

- **power**（強くなった）: `sunburst(warm)`→`cardDraw(..., pose('punch1','idle'))`→拳に `glow(fx,fy, 120, GOLD, .8)`。text（例「つよくなった！」）を popText。
- **shadowturn**（影がさす）: 冷たい背景（`skyBg`ではなく `night`寄りの寒色 or グレー寄りグラデ）→`cardDraw(..., pose('idle'))`→拳の光を **金→青紫**へ: `const c = sc.turn ? lerpColor(GOLD,COLD,p) : COLD;`（`lerpColor` は簡易にRGB補間 or `p<.5?GOLD:COLD`で可）→`glow(fx,fy,120,c,.8)`→`coolOverlay(.25*p)`。顔に影＝キャラ上に暗い楕円を薄く。text「あれ…？」等。
- **mentor**（責任の問い）: 夜寄りの背景→あぷちゃん `pose('welcome','idle')` と主人公 `pose('idle')` を左右に→手のひらの上に **金と青紫の小さな光を2つ** `glow()` を並べる→popText で3行（§9台詞）。BGMは静か系（`QUIET` に 'mentor' 追加）。
- **openlight**（選び直す）: あたたかい背景→`cardDraw(..., pose('idle'))`→拳の光を **青紫→金**へ `turn`（p で遷移）＝呼吸で開くイメージ→`glow(fx,fy, 90+p*60, GOLD, .3+.5*p)` を最後に大きく→text「それ、やめよう。」。
- **watch**（見守る大人）: あたたかい背景→`parentSilhouette(W*(VERT?.5:.3), H*(VERT?.8:.9), VERT?90:110)`→遠くに小さく主人公→ナレーション字幕（§8のN）。BGM静か系（'watch' を QUIET に追加）。

> `sunrise` `cta` `night` は既存流用。`QUIET` に `'mentor','watch'` を追加（静かなオルゴール調に）。
> 実装後、`SCENES` に未定義 type があると entrance にフォールバックするので、全 type を必ず定義すること。

---

## 4. `story.chikara.js`（物語＝絵コンテのデータ。`?cut=` で長さ切替）
```js
// story.chikara.js — GYMSTORYs特別編『そのちから、なにに使う?』
// ?story=chikara&cut=main|60|30|15 で長さを切替。既定は main。
(function () {
  const cut = new URLSearchParams(location.search).get('cut') || 'main';

  const CTA = { type: 'cta', sec: 4.0,
    title: '強くなった我が子が、優しくなる場所。',
    subtitle: '見学だけでもOK ／ 初回体験30分・500円',
    button: '見学・体験を申し込む',
    href: 'https://lin.ee/cTSDajPz' };

  const MAIN = [
    { type: 'power',      sec: 4.0, text: 'つよくなった！' },
    { type: 'shadowturn', sec: 4.5, text: 'あれ…？', turn: true },
    { type: 'mentor',     sec: 5.5, text: 'つよくなったぶん、やさしく使う番。' },
    { type: 'openlight',  sec: 5.0, text: 'それ、やめよう。', turn: true },
    { type: 'watch',      sec: 3.5, text: '' },
    { type: 'sunrise',    sec: 2.0, text: '' },
    CTA,
  ]; // 合計 ≒ 28.5s

  const SNS60 = [ // 保護者向け60秒(各シーンを長めに＋ナレーション余白)
    { type: 'power',      sec: 6.0, text: 'つよくなった！' },
    { type: 'shadowturn', sec: 7.0, text: 'あれ…？', turn: true },
    { type: 'mentor',     sec: 11.0, text: 'つよくなったぶん、やさしく使う番。' },
    { type: 'openlight',  sec: 9.0, text: 'それ、やめよう。', turn: true },
    { type: 'watch',      sec: 8.0, text: '' },
    { type: 'sunrise',    sec: 3.0, text: '' },
    { type: 'cta', sec: 8.0, title: '強くなった我が子が、優しくなる場所。',
      subtitle: '見学だけでもOK ／ 初回体験30分・500円',
      button: '見学・体験を申し込む', href: 'https://lin.ee/cTSDajPz' },
  ]; // 合計 ≒ 60s

  const KIDS30 = [ // 練習前キッズ版(1メッセージ完結)
    { type: 'power',      sec: 5.0, text: 'そのちから、なにに使う？' },
    { type: 'shadowturn', sec: 6.0, text: 'つめたい手…', turn: true },
    { type: 'openlight',  sec: 8.0, text: 'まもるために、つかおう！', turn: true },
    { type: 'cta', sec: 6.0, title: 'つよさは、やさしさに。',
      subtitle: '', button: '', href: 'https://lin.ee/cTSDajPz' },
  ]; // 合計 ≒ 25s (30秒枠)

  const SNS15 = [ // SNSフック
    { type: 'shadowturn', sec: 5.0, text: '', turn: true },
    { type: 'openlight',  sec: 6.0, text: '', turn: true },
    { type: 'cta', sec: 4.0, title: '強さを、光に変える場所。',
      subtitle: '', button: '', href: 'https://lin.ee/cTSDajPz' },
  ]; // 合計 ≒ 15s

  window.STORY = ({ main: MAIN, '60': SNS60, '30': KIDS30, '15': SNS15 })[cut] || MAIN;
})();
```

---

## 5. `index.html` の story セレクタ拡張
現在は既定=flatup / `op`=旧版のみ。`chikara` を読めるよう、`document.write` する分岐に追加:
```js
(function () {
  var s = new URLSearchParams(location.search).get('story');
  var file = s === 'op' || s === 'girlpower' ? 'story.js'
           : s === 'chikara' ? 'story.chikara.js'
           : 'story.flatup.js';
  document.write('<scr' + 'ipt src="' + file + '"><\/scr' + 'ipt>');
})();
```

---

## 6. `render.js` 拡張とレンダリングコマンド
`render.js` に CLI 引数を追加（既存の `--vertical` はそのまま）:
- `--story=<name>`（例 chikara）→ URL に `&story=<name>` を付ける
- `--cut=<main|60|30|15>` → URL に `&cut=<cut>` を付ける
- `--out=<file.mp4>` → 出力名を上書き（未指定なら `<story>_<cut>_<横/縦>.mp4`）

実装ヒント（goto URL 組み立て箇所）:
```js
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const STORY = arg('story', '');          // '' なら既定(flatup)
const CUT   = arg('cut', '');
let extra = '';
if (STORY) extra += `&story=${encodeURIComponent(STORY)}`;
if (CUT)   extra += `&cut=${encodeURIComponent(CUT)}`;
const OUT = arg('out', `${STORY||'flatup'}_${CUT||'main'}_${VERTICAL?'v':'h'}.mp4`);
await page.goto('file://' + path.join(DIR, 'index.html') + `?w=${W}&h=${H}` + posesParam + extra);
```

**生成コマンド（このタスクの成果物）**:
```bash
cd girl-power-op && npm install    # playwright(既導入なら不要)
# 本編(横) / 縦
node render.js --story=chikara --cut=main
node render.js --story=chikara --cut=main --vertical
# 60秒 保護者版(縦推奨)
node render.js --story=chikara --cut=60 --vertical
# 30秒 キッズ版(縦)
node render.js --story=chikara --cut=30 --vertical
# 15秒 SNSフック(縦)
node render.js --story=chikara --cut=15 --vertical
```
> ffmpeg は環境の playwright 同梱 or システムの ffmpeg を使用（既存 render.js の実装に従う）。

---

## 7. LP用 差別化コピー（公開テキスト・正本準拠）
（正本 `oya_column_yasashii_tsuyosa.md` をLP構造に整形。Codexはページ文言としてそのまま使用可）

**ヒーロー見出し**: 強くなった我が子が、優しくなる場所。
**サブ**: 「ケンカに強い子」ではなく、「強さを、優しさに使える子」へ。

**ブロック1｜親の願い**
子どもには、自分を守れる強さを。嫌なことから、すぐに逃げない心を。でも、強さを見せつける子ではなく、困っている人に手を差し伸べられる子に——多くの保護者が願うのは、そんな未来です。

**ブロック2｜格闘技は自信を育てる（メリット）**
できなかったパンチができる。怖くても練習に入れる。負けても立ち上がる。小さな成功体験の積み重ねが、心と体を強くします。（研究でも、格闘技はむしろ攻撃性を下げ、自制心・自己肯定感を育てる傾向。）

**ブロック3｜だから「どこで・誰に」習うか（=ジム選び）**
力を持つほど、その使い方が大切。ジム選びでは、指導する大人の姿を見てください。
・怒鳴っていないか ・比べていないか ・できない子を置いていかないか ・一歩を踏み出した子も認めているか
子どもは、大人の言葉と態度から「強さとは何か」を学びます。

**クロージング＋CTA**
FLAT UP GYM は、世界一、初心者に優しい格闘技ジム。怒鳴らない。比べない。置いていかない。
無理に入会は勧めません。まずは、練習する子の表情と、指導する大人の姿を見に来てください。
**初回体験30分・500円／見学だけでもOK** → 公式LINE https://lin.ee/cTSDajPz

---

## 8. 60秒 保護者版 絵コンテ（=cut:60 の字幕・演出。動画字幕にそのまま）
| 秒 | 映像(シーン) | 字幕/ナレーション | 光の色 |
|---|---|---|---|
| 0–6 | power：ハルが強いパンチ、拳に光 | 「嫌なことから逃げず、でも人に優しくできる子に——そう願っていませんか？」 | 金 |
| 6–13 | shadowturn：小さい子を押しそうに | 「つよさは、つかい方で、あたたかくも、つめたくもなる。」 | 金→青紫 |
| 13–24 | mentor：あぷちゃんの問い | 「大いなる力には、大いなる責任が伴う——つよくなったぶん、やさしく使う番。」 | 金と青紫の2つ |
| 24–33 | openlight：拳を開いて止める | 「打てることより、止まれること。守るために、つかおう。」 | 青紫→金 |
| 33–41 | watch：見守る保護者の後ろ姿 | 「光になるか、影になるか。決めるのは、習う場所かもしれません。」 | 暖色 |
| 41–52 | sunrise→cta | 「怒鳴らない。比べない。置いていかない。」＋研究テロップ「※格闘技はむしろ攻撃性を下げる傾向（研究）」 | 朝日 |
| 52–60 | cta | 「強くなった我が子が、優しくなる場所。／見学だけでもOK・初回30分500円」＋LINE | 金 |

---

## 9. SNS 初回3投稿（文面・ビジュアル指示・ハッシュタグ）
**投稿1（問い＝関心喚起）**
- ビジュアル: 15秒フック動画（cut:15、影→金）
- 本文: 「『格闘技を習うと乱暴になりませんか？』——いちばん多いご質問。でも研究ではむしろ逆。強さは“どこで習うか”で光にも影にもなります。🥊 強くなった我が子が、優しくなる場所。まずは見学だけでもOK。」
- タグ: #成田 #キッズ #キックボクシング #習い事 #初心者に優しい

**投稿2（力と責任＝フック）**
- ビジュアル: mentorカットの静止画 or 30秒キッズ版
- 本文: 「強さに、いいも悪いもない。大切なのは“なにに使うか”。大きな力を持つほど、その使い方が問われる。だから“どこで習うか”で決まる。つよくなったぶん、やさしく使う番。」
- タグ: #子育て #武道 #自己肯定感 #FLATUPGYM

**投稿3（安心＋CTA）**
- ビジュアル: 60秒保護者版（cut:60・縦）
- 本文: 「“ケンカに強い子”がゴールじゃない。嫌なことから逃げない、でも人に優しくできる子へ。無理な入会勧誘はしません。まずは指導の様子を見に来てください。初回体験30分・500円／見学OK。ご予約は公式LINEから。」
- タグ: #成田市 #習い事デビュー #キッズ格闘技 #体験

> 運用: AI生成物はラベルON、人物は手元・後ろ姿中心、暴力を派手にしない、投稿前に人間確認。
> 「大いなる力には大いなる責任が伴う」は広く知られた格言として使用（特定作品の引用・造形は出さない）。

---

## 10. 受け入れ基準（Codex は満たすまで直す）
- [ ] `?story=chikara&cut=main|60|30|15` で `window.STORY` が正しく切替（要素数・type）。
- [ ] 全 type（power/shadowturn/mentor/openlight/watch/sunrise/cta）が `SCENES` に定義され、`window.ready===true` 後に全シーンを数フレーム描いても **pageerror 0**。
- [ ] `?loop=1` の cta シーン中に `#booking-cta` が表示され href=公式LINE。MP4（loopなし）には写らない。
- [ ] 光の演出: power=金、shadowturn=金→青紫、openlight=青紫→金 が視認できる。剣/銃/既存IPの要素が画面に無い。
- [ ] `node render.js --story=chikara --cut=main`（横/縦）と 60/30/15（縦）で MP4 が生成される。
- [ ] ネガティブ要素（暗黒面の語・ライトセーバー・スパイダーマン等）を画面・字幕に出さない。

### 検証スクリプト（Playwright・参考）
```js
// verify_chikara.mjs : 各cutでwindow.STORY確認 + 全シーン描画 + pageerror0 + CTA存在
const cuts = ['main','60','30','15'];
for (const cut of cuts) {
  const page = await browser.newPage({ viewport:{width:1080,height:1920} });
  const errs=[]; page.on('pageerror',e=>errs.push(''+e));
  await page.goto(`file://.../index.html?w=1080&h=1920&story=chikara&cut=${cut}`);
  await page.waitForFunction('window.ready===true',{timeout:8000});
  const dur = await page.evaluate('DUR');
  for (let t=0;t<dur;t+=0.5) await page.evaluate(`seek(${t})`);
  console.log(cut,'dur',dur,'errs',errs.length);
  await page.close();
}
```

---

## 11. 完了時の報告フォーマット（Codex→人間）
- 変更ファイルと要点（新シーン型/ヘルパ/セレクタ/CLI）
- 生成した MP4 の一覧（本編横・縦、60/30/15 縦）と各尺
- 受け入れ基準チェック結果（pageerror件数、CTA確認、IP混入なし）
- 既知の制限（本エンジンは~30秒級の短尺ブランド映像向け。5〜6分の本編フィルムは別パイプライン）
- ⚠️ 公開・投稿・送信は人間（オーナー）承認後。数値/研究表現は出典で最終確認。
