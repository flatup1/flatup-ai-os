# AIスマートグラス — 既存の成果しらべ（車輪の再発明をしないために）

対象: Mingtown（Mingtawn）製 AIスマートグラス／純正アプリ **HeyCyan**。
しらべた日: 2026-08-25。

---

## 1. 使える既存プロジェクト

| プロジェクト | 何がある | このアプリでの使い方 |
|---|---|---|
| [FerSaiyan/Alternative-HeyCyan-App-and-SDK](https://github.com/FerSaiyan/Alternative-HeyCyan-App-and-SDK)（CyanBridge） | Android代替アプリ。BLE接続 + Wi-Fi Direct でのメディア転送が実装済み。ローカルAI、ギャラリー、転送手順の文書 | **転送の手順そのもの**を借りる。`/files/media.config` → 各ファイル、という道すじはここが出どころ |
| [ebowwa/HeyCyanSmartGlassesSDK](https://github.com/ebowwa/HeyCyanSmartGlassesSDK) | iOS / Android / Python の BLE制御SDK。写真・動画・音声・電池・AI画像。Wi-Fi転送のアーキテクチャ文書 | **BLEのUUIDとコマンドの並び**、iOS側の Wi-Fi 手順を借りる |
| iOS側のリバース結果（同SDKの `WIFI_TRANSFER_ARCHITECTURE.md` ほか） | iOSは Wi-Fi Direct 非対応 → グラスが通常APを出す。`NEHotspotConfiguration(joinOnce)` で入る | **iOS実装の骨組み**をそのまま踏襲 |

出回っているベンダー製バイナリ（`glasses_sdk_20250723_v01.aar` / `QCSDK.framework`）は
このリポジトリには**取り込まない**。ライセンスがはっきりせず、中身も読めないため。
必要な部分だけを、上の公開情報にもとづいて自前で書き直している。

---

## 2. 分かっている技術的な事実

### BLE
- 主サービス UUID: `7905FFF0-B5CE-4E99-A40F-4B1E122D00D0`
- 副サービス UUID: `6e40fff0-b5a3-f393-e0a9-e50e24dcca9e`
- 特性は3つの役割（コマンド書き込み／通知受信／大きなデータ受信）。
  **UUIDそのものは機種差があり公開情報が無い** → 実装では
  「write できるもの＝コマンド、notify できるもの＝通知」と、つないでから当てる。
- コマンドの形: ヘッダ＋オペコード＋長さ＋ペイロード＋チェックサム、応答は必須。
- 操作の種類（QCSDK の名前）: `Photo` / `Video` / `VideoStop` / `Audio` / `AudioStop` / `AIPhoto`、
  ほかに電池・メディア件数・時刻合わせ。

### Wi-Fi 転送
- 起点は BLE のコマンド（QCSDK では `openWifiWithMode:QCOperatorDeviceModeTransfer`）。
  返ってくるのが **SSID とパスワード**。パスワードが無いときの既定は `123456789`。
- SSID は Bluetooth名と**別物**で、MACアドレス入りの形になる。
- グラスのIPは決め打ちできない。実機で報告があるのは
  `192.168.43.1` / `192.168.4.1` / `192.168.1.1` / `192.168.0.1` / `10.0.0.1`。
  Wi-Fi Direct のグループオーナーは `192.168.49.1` になることもある。
  → **候補を同時に叩いて、返事をしたものを使う**（10秒で打ち切り）。
- 一覧の取得先に**2つの流儀**がある。両方読めるようにしておく必要がある。
  - Android/CyanBridge 系: `GET http://<ip>/files/media.config`（1行1ファイルのテキスト）
  - iOS/ebowwa 系: `GET http://<ip>/manifest.json`（`{"files":[…]}`）
- ファイル本体はどちらも `GET http://<ip>/files/<filename>`。

### OS ごとの違い
| | Android | iOS |
|---|---|---|
| 入り方 | Wi-Fi Direct（グラスがグループオーナー） | 通常APに `NEHotspotConfiguration`（`joinOnce: YES`） |
| 元のWi-Fiに戻す | 自分で戻す必要がある | joinOnce なので切るだけで戻る |
| 権限 | Android 12以降は `BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT` が別 | Bluetooth と ローカルネットワーク |

### 純正アプリの弱点（作り直す理由）
- クラウド経由が前提で、写真が外に出る作りになっている。
- 画面の項目が多く、どれを押せばいいのか分かりにくい。高齢の方には特に厳しい。
- セキュリティ上の指摘が出ている。

---

## 3. この実装で「借りたところ」と「変えたところ」

**借りた**: BLEのUUID、コマンドの形、転送の道すじ、IP候補、2つの一覧形式。

**変えた**:
1. **転送の信頼性** — 途中で切れても消えない。`Range` で続きから。
   1件失敗しても次へ進む。失敗ぶんは覚えておき、次につながったら自動で続きをやる。
2. **UI** — ホームに出す押しどころを**1つ**にした（つながっていなければ「つなぐ」、
   つながっていれば「取り込む」）。文字は既定で大きめ、4段階で変えられる。
3. **プライバシー** — AIは既定で端末の中だけ。外へ出すのは設定で許したときだけ。
4. **OS差の閉じ込め** — 判断は core に集め、OSごとの違いはアダプタ1枚に押し込んだ。
   おかげで実機なしのテストが54件回る。

---

## 出どころ

- https://github.com/FerSaiyan/Alternative-HeyCyan-App-and-SDK
- https://github.com/ebowwa/HeyCyanSmartGlassesSDK
- https://github.com/ebowwa/HeyCyanSmartGlassesSDK/blob/main/WIFI_TRANSFER_ARCHITECTURE.md
