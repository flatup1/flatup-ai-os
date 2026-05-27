# Typefully X 運用メモ

FLATUP の X 投稿は、AIKA/Codex が「下書き」を作り、Typefully に保存し、人間オーナーが最後に確認して公開します。

## 現在の接続状態

- Typefully API 疎通: ローカルPCから確認済み
- 設定ファイル: `/Users/jin/.config/typefully/config.json`
- 権限: `600`
- default social set ID: `307036`
- username: `flatupgym`
- APIキー本体: ドキュメントやGitには書かない

注意: Typefully API では、今回のキーは `tf_` を外した値で認証成功しています。設定ファイルにも `tf_` なしで保存済みです。

## 運用憲法

1. 公開は人間の明示承認後のみ。
2. AIは `--immediate` や即時公開コマンドを勝手に使わない。
3. 1日のX投稿は最大5本。
4. オリジナル比率は70%以上を守る。
5. APIキーは絶対にコミットしない。
6. 自動リプライ、自動いいね、自動フォローは禁止。

## 役割分担

| 担当 | 役割 |
|---|---|
| AIKA / Codex | 投稿案、スレッド構成、Typefully下書き、スケジュール案の作成 |
| Typefully | 下書き保存、予約投稿管理、公開前レビュー画面 |
| 人間オーナー | 最終確認、修正、公開・予約の承認 |

## 基本フロー

1. AIOSで投稿テーマを作る。

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/flatup-ai-os"
npm run dev -- sns_post "初心者歓迎。弱い自分と戦う人へ届けるX投稿"
```

2. 内容をX向けに整える。

- 1投稿280字以内を目安にする。
- スレッドは投稿ごとに区切る。
- 宣伝だけでなく、体験談・学び・価値観を中心にする。
- 参考ポストを使う場合も、FLATUPの経験と言葉に置き換える。

3. Typefullyに下書き保存する。

`asukenn` リポの Typefully skill がある場合:

```bash
cd "/path/to/asukenn"
./.claude/skills/x-post/scripts/typefully.js config:show
./.claude/skills/x-post/scripts/typefully.js drafts:create --platform x --text "投稿本文"
```

公式 Typefully skill を使う場合:

```bash
<skill-path>/scripts/typefully.js config:show
<skill-path>/scripts/typefully.js drafts:create --platform x --text "投稿本文"
```

4. Typefully画面で人間が確認して公開または予約する。

## 週間運用

| 曜日 | やること |
|---|---|
| 月 | 今週のテーマを1つ決める |
| 火-木 | 下書きを作り、オリジナル性・表現・安全性を確認する |
| 金 | Typefullyで翌週分を予約する |
| 日 | 反応を見て、次週テーマと改善点を決める |

## 投稿上限チェック

投稿を予約する前に、同日の投稿数を確認します。

- すでに5本ある日は追加しない。
- 同じ話題の連投は避ける。
- 1本ごとに「FLATUP自身の経験・思想・具体例」が入っているか確認する。

## 禁止事項

- APIキーを `.env`、README、Obsidian、GitHubに書く。
- AIだけで即時公開する。
- 自動リプライ、いいね、フォローを行う。
- 参考元の文体や構成をそのまま日本語化する。
- 会員の個人情報や特定できる体験談を書く。

## トラブル時

### API key not found

```bash
ls -l /Users/jin/.config/typefully/config.json
```

ファイルがなければ、Typefully skill の setup を再実行します。

### Unauthorized

キーの先頭に `tf_` が付いていないか確認します。今回のローカル検証では `tf_` なしで成功しています。

### GitHub / asukenn がない

`asukenn` リポはこのローカルPCでは未確認です。取得できたら、`claude/typefully-x-automation-FTcI2` ブランチの `.claude/skills/x-post/` を使います。
