# Today

## セットアップ系
- [ ] `.env` を作り `ANTHROPIC_API_KEY` を設定
- [ ] `npm install` を実行
- [ ] `npm run list` で利用可能ルートを確認

## 動作確認(各 1 回ずつ実行して logs/ を確認)
- [ ] `npm run dev -- line_reply "明日18時に体験できますか?"`
- [ ] `npm run dev -- sns_post "初心者歓迎の体験紹介投稿"`
- [ ] `npm run dev -- video_script "体験トレーニング編"`
- [ ] `npm run dev -- risk_check "ジム内で女性会員への声かけが多いと相談あり"`

## 仕上げ
- [ ] AIKA の口調を `data/brand_voice.md` で再確認(違和感あればここを直す)
- [ ] 体験予約 LINE 返信を 3 件分作って `logs/replies/` に貯める
- [ ] 体験トレーニング動画台本の初稿を `logs/videos/` に保存
- [ ] SNS 投稿テーマを 1 週間分に分割し `tasks/backlog.md` に転記
