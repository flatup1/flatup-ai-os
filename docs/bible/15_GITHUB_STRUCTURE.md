<!-- この巻は「索引」であり正本ではない。内容を書き写して増やさないこと。
     正本と食い違ったら必ず正本が勝つ。全体の使い方は README.md を読む。 -->

# 15 リポジトリ構成

## 正本
- `CLAUDE.md` §Directory Guide

## 第0話に関係する場所
```
src/movie/
  promptBank.ts       何が画面に写るか（実行される正本）
  editPlan.ts         何秒目に何をどう置くか（実行される正本）
  generate.ts         生成CLI
  adopt.ts            採用
  falClient.ts        fal.ai クライアント
  *.test.ts           45ケース
scripts/movie.command Macワンタップ
assets/canon/         絵柄の最終決定権を持つ確定素材（コミットする）
assets/movie/         作業用（.gitignore）
output/               生成物（.gitignore）
docs/                 文章の正本
docs/bible/           この索引
```

## ブランチ
`claude/<feature-name>`。

## 未確定
なし。
