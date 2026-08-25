# AIスマートグラス コンパニオン — 開発の入口

「メガネで撮った写真や動画を、確実に・簡単に・ワイヤレスでスマホに取り込む」ためのアプリ。

- **調べたこと** → [smartglass_research.md](smartglass_research.md)
- **通信の仕様** → [smartglass_protocol.md](smartglass_protocol.md)
- **UIの決まり** → [smartglass_ux.md](smartglass_ux.md)

---

## 実機がなくても、いま動かせる

```bash
npm run glasses                 # つなぐ〜取り込む〜ギャラリー〜AI を一気に見る
npm run glasses -- --flaky      # 途中で切れる状況（続きから取り込むのを確認）
npm run glasses -- --json       # 一覧が manifest.json 形式のメガネ
npm run test:glasses            # 回帰テスト（54件）
```

---

## 作りかた（なぜこう分けたか）

```
src/smartglass/          ← core。OSを知らない。依存ゼロ。ここにテストがある
├── types.ts             共通の言葉
├── platform.ts          OSとの差し込み口（BLE/Wi-Fi/HTTP/保存/読み上げ）
├── protocol/            UUID・コマンド・一覧の読み取り
├── device/connection.ts つなぐ・つなぎ直す
├── transfer/            取り込みの順番待ちと段取り  ← いちばん大事
├── gallery/store.ts     取り込み済みの目録（オフラインで見られる）
├── ai/                  アシスタント・翻訳・物体認識
├── ui/tokens.ts         文字とボタンの大きさ、色
├── i18n.ts              画面の言葉（ここ以外に日本語を書かない）
├── errors.ts            「何が起きたか」＋「次にどうするか」
├── help/faq.ts          困ったときと、はじめての方へ
├── app.ts               画面が見る窓口。ホーム画面の中身を組み立てる
└── mock/                実機なしで動かすための偽物

smartglass-app/          ← 画面（React Native / Expo）。core の言うとおりに描くだけ
├── App.tsx              4つのタブ
├── src/platform/        OSごとの実装（ble-plx / wifi-reborn / expo-file-system …）
├── src/screens/         ホーム・写真・AI/翻訳・設定
└── src/components/      大きなボタン・エラー・進み具合
```

**なぜ分けたか**: 判断を core に集めると、iOS版とAndroid版で作りが分かれない。
そして実機がなくてもテストが回る（いまは54件）。
画面を足しても、UXの決まり（48dp・コントラスト・専門用語なし）はテストが見張る。

---

## 画面から呼ぶのは、ほぼこの4つ

```ts
const app = new SmartGlassApp(createReactNativePlatform());
await app.start();

await app.connect();                 // つなぐ
await app.importMedia();             // 写真を取り込む
app.home();                          // ホームに出すもの一式
await app.settings.setFontScale("xlarge");
```

`app.subscribe(view => …)` で、状態が変わるたびに描き直すものが届く。

---

## 実機で最初にやること

core は実機なしでテスト済み。実機でしか確かめられないのは次の3つ。

1. **オペコードの値**（`protocol/frame.ts` の `OpCode`）
   フレームの形は公開情報どおり。値が違ったらここだけ直す。
2. **特性のUUID**（`platform/reactNative.ts` の `resolveCharacteristics`）
   いまは「write可＝コマンド、notify可＝通知」で当てている。
   実機のUUIDが分かったら、決め打ちに変えたほうが速い。
3. **グラスのIPと一覧のパス**
   `npm run glasses` と同じ流れが実機で通るかを見る。
   通らなければ `CANDIDATE_HOSTS` と `MANIFEST_PATHS` を足す。

---

## 画面（React Native）を動かす

```bash
cd smartglass-app
npm install
npx expo run:android    # または npx expo run:ios
```

`react-native-ble-plx` と `react-native-wifi-reborn` はネイティブを含むので、
Expo Go では動かない（development build が要る）。
