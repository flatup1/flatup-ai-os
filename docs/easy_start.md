# FLATUP AI OS かんたん使い方ガイド

対象: オーナー・スタッフ向け  
目的: AIKAで下書きを作り、人間が確認して使う

## そもそもこれ何？

FLATUP GYMの「下書きアシスタント」を動かす道具箱です。

アシスタントの名前はAIKAです。パソコンに「これ書いて」と頼むと、ジムのことに詳しいAIKAがLINE返信、SNS投稿、追客文、動画台本などの下書きを作ってくれます。

ただし、送信ボタンを押すのは人間だけです。AIKAはあくまで下書き屋さんです。

FLATUPGYM AI全体の記憶・使い方・学習ログは Obsidian Vault にあります。

```text
/Users/jin/Documents/Obsidian Vault/00_CORE/FLATUPGYM_AI_HOME.md
```

## AIKAは何を覚えてる？

ジムの情報は `src/data/` の中に入っています。

| ファイル | 中身 |
|---|---|
| `gym_profile.md` | ジムの名前、場所、大切にしていること |
| `pricing.md` | 料金 |
| `rules.md` | ジムのルール |
| `brand_voice.md` | AIKAのしゃべり方 |
| `faq.md` | よくある質問 |
| `templates.md` | 返信の見本 |
| その他 | 体験の流れ、世界観、差別化、指導方針など |

料金やルールが変わったら、まず `src/data/` を直します。そうするとAIKAの下書きにも反映されます。

## 最初にやること

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/flatup-ai-os"
cp .env.example .env
```

`.env` を開いて、`ANTHROPIC_API_KEY=` の右側にAPIキーを貼ります。

APIキーがない場合でも、空のままでドライランできます。ドライランではAIに送る内容のプレビューだけが出るので、料金はかかりません。

## 基本の使い方

全部この形です。

```bash
npm run dev -- コマンド名 "状況を書く"
```

例:

```bash
npm run dev -- line_reply "明日18時に体験できますか？女性で初心者です"
```

AIKAの下書きは画面に出て、さらに `logs/` の中に自動保存されます。

コマンドを忘れたらこれです。

```bash
npm run list
```

## 毎日のおすすめ

朝の頭整理:

```bash
npm run dev -- daily_manager "今日18時から体験3名。SNS投稿もしたい。月末請求準備あり"
```

問い合わせが来たとき:

```bash
npm run dev -- line_reply "問い合わせ文をそのまま貼る"
```

体験後のフォロー:

```bash
npm run dev -- followup "30代女性。初心者で不安そうだったが、ミット打ちは楽しそうだった"
```

週末のSNS準備:

```bash
npm run dev -- sns_post "来週はキッズクラスの楽しさを伝えたい"
```

X投稿をTypefullyに下書き保存したいとき:

```bash
npm run dev -- sns_post "X向け。格闘技で人生が変わる理由を短いスレッドにしたい"
```

Typefullyの詳しい運用は `docs/typefully_x_ops.md` を見ます。AIKAは下書き担当で、公開・予約の最終決定は人間がTypefully画面で行います。

不安な事案があるとき:

```bash
npm run dev -- risk_check "会員さん同士で揉めそうな雰囲気がある。詳細は匿名で書く"
```

## うまく回すコツ

1. 状況は具体的に書く  
   例: 「体験」より「明日18時、初心者女性、子連れの可能性あり」の方が良いです。

2. 出てきた下書きは必ず人間が読む  
   AIKAは便利ですが、間違うことがあります。送信前に必ず確認します。

3. 良かった下書きは `src/data/templates.md` に追加する  
   良い見本が増えるほど、AIKAの返答がFLATUPらしくなります。

4. 個人情報は入れない  
   会員さんの本名、電話番号、住所などは入れず、必要なら「30代女性」「キッズ会員の保護者」のようにぼかします。

5. リスクっぽい話は先に `risk_check`  
   クレーム、会員同士のトラブル、規約判断、返金、怪我などは、いきなり返信文を作らずに一度リスク整理します。

## やっちゃダメなこと

- AIKAの出力をそのままお客さんに送る
- 値段や規約をAIKAに決めさせる
- クレーム対応をAIKAだけで完結させる
- `.env` をGitHubにアップする
- Typefully APIキーをGitHub、Obsidian、READMEに書く
- AIだけでXへ即時公開する
- 会員さんの本名や電話番号を入力する

## 一言まとめ

AIKAは超優秀な下書きアシスタントです。  
手は早いし、ジムのことにも詳しいです。  
でも最後に確認して使うのは、必ずオーナーです。
