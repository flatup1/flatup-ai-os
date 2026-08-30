/**
 * 起動するだけの入口。
 *
 *   npm run glasses:web -- --ssid "HeyCyan-XXXX"
 *   npm run glasses:web -- --ssid "HeyCyan-XXXX" --password 123456789 --port 8787
 *
 * 環境変数でも指定できる: GLASSES_SSID / GLASSES_PASSWORD / GLASSES_PORT / GLASSES_DIR
 */

import path from "node:path";
import os from "node:os";

import { DEFAULT_WIFI_PASSWORD } from "../protocol/frame.js";
import { createSmartGlassServer } from "./server.js";
import { lanAddress } from "./nodePlatform.js";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const ssid = arg("ssid") ?? process.env.GLASSES_SSID ?? "";
  const password = arg("password") ?? process.env.GLASSES_PASSWORD ?? DEFAULT_WIFI_PASSWORD;
  const port = Number(arg("port") ?? process.env.GLASSES_PORT ?? 8787);
  const dataDir =
    arg("dir") ?? process.env.GLASSES_DIR ?? path.join(os.homedir(), "FLATUPスマートグラス");

  if (!ssid) {
    console.error(
      [
        "",
        "メガネのWi-Fiの名前が分かりません。",
        "→ Mac の Wi-Fi 一覧に出ている、メガネの名前を教えてください。",
        "",
        '   npm run glasses:web -- --ssid "HeyCyan-XXXXXXXX"',
        "",
      ].join("\n"),
    );
    process.exit(1);
  }

  const app = await createSmartGlassServer({
    glassesSsid: ssid,
    glassesPassword: password,
    dataDir,
    port,
    homeSsid: arg("home-ssid") ?? process.env.GLASSES_HOME_SSID ?? null,
    homePassword: arg("home-password") ?? process.env.GLASSES_HOME_PASSWORD ?? null,
  });

  app.server.listen(port, () => {
    const lan = lanAddress();
    void lan.then((address) => {
      const line = "─".repeat(52);
      console.log(`\n${line}`);
      console.log("  スマートグラス — 準備できました");
      console.log(line);
      console.log(`  Mac    : http://localhost:${port}`);
      if (address) console.log(`  iPhone : http://${address}:${port}  （同じWi-Fiで開く）`);
      console.log(`  写真の置き場: ${dataDir}`);
      console.log(`${line}\n`);
      console.log("  止めるときは control + C\n");
    });
  });
}

void main();
