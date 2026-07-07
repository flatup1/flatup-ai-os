# Backlog

## セットアップ・動作確認（旧 today.md から移動 2026-07-07）
- [ ] `.env` を作り `ANTHROPIC_API_KEY` を設定 → `npm install` → `npm run list`
- [ ] 各ルート動作確認: `line_reply` / `sns_post` / `video_script` / `risk_check`
- [ ] AIKA の口調を `data/brand_voice.md` で再確認
- [ ] 体験予約 LINE 返信 3 件を `logs/replies/` に貯める

## 仕様書(これをベースに設計.rtf)で約束した成果物
- [ ] 成果物 A: 動画マニュアル台本(全編)
  - 体験トレーニング編
  - 初心者基本フォーム編
  - ミット打ち編
  - サンドバッグ編
  - マススパーリング説明編
  - スパーリング説明編
  - ジムルール説明編
  - 他ジムとの差別化編
- [ ] 成果物 B: スタッフ指導マニュアル(全項目)
  - 体験者の迎え方〜入会案内の自然な流れ
- [ ] 成果物 C: 差別化ページ原稿(HP / LP)
- [ ] 成果物 D: SNS 投稿セット(10 テーマ分)

## データ拡充
- [ ] `data/templates.md` をケース別に増やす(8〜12 パターン)
- [ ] `data/faq.md` を実際の問い合わせから更新
- [ ] `data/visual_brand.md` に撮影サンプル画像のリンクを足す
- [ ] リスク対応の過去事案を `logs/risks/` に貯めて `data/` 化

## システム改善
- [ ] LINE Webhook を受けて自動で下書きをキューに入れる仕組み
- [ ] `logs/replies/` の使用率からテンプレ精度を可視化
- [ ] `claude-sonnet-4-6` モードと Opus モードの自動切替(コスト最適化)
- [ ] 出力に対する人間レビュー結果を `feedback.md` に貯めて改善ループを作る
