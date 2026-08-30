# スマートグラス コンパニオン（画面）

iOS / Android の画面。**判断は持たない**。
中身は core（`../src/smartglass`）が決めて、ここはそのとおりに描くだけ。

```bash
npm install
npx expo run:android   # または npx expo run:ios
```

`react-native-ble-plx` / `react-native-wifi-reborn` はネイティブを含むので、
Expo Go では動かない（development build が必要）。

実機がなくても、core だけならリポジトリのルートで動く:

```bash
cd .. && npm run glasses
```

## 権限

**Android** (`app.json` の `android.permissions`)
- `BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT`（Android 12以降）
- `ACCESS_FINE_LOCATION`（BLEスキャンに必要）
- `ACCESS_WIFI_STATE` / `CHANGE_WIFI_STATE` / `NEARBY_WIFI_DEVICES`

**iOS** (`Info.plist`)
- `NSBluetoothAlwaysUsageDescription` … 「メガネにつなぐために使います」
- `NSLocalNetworkUsageDescription` … 「メガネから写真を受け取るために使います」
- `NSMicrophoneUsageDescription` … 「翻訳のときだけ使います」
- Capability: **Hotspot Configuration**（`NEHotspotConfiguration` に必要）

説明文は「何のために使うか」を利用者の言葉で書く。
「BLE」「ホットスポット」とは書かない。

## 画面

| ファイル | 出すもの |
|---|---|
| `App.tsx` | 4つのタブ、はじめての方への案内 |
| `src/screens/HomeScreen.tsx` | 接続状態・電池・大きなボタン1つ・最近の写真 |
| `src/screens/GalleryScreen.tsx` | 日付ごとの一覧、全画面、スマホに保存、共有 |
| `src/screens/AiScreen.tsx` | AIにきく／会話の翻訳／これは何？ |
| `src/screens/SettingsScreen.tsx` | 文字の大きさ、音声ガイド、自動取り込み、ヘルプ |
