/**
 * OS ごとの差を、ここだけに閉じ込める。
 *
 * core（../../../src/smartglass）は OS を知らない。
 * だから iOS と Android で作りが分かれず、テストは実機なしで回る。
 *
 * ⚠実機でしか確かめられない箇所には「実機」と書いてある。
 */

import { NativeModules, PermissionsAndroid, Platform as RNPlatform } from "react-native";
import { BleManager, type Device, type Subscription } from "react-native-ble-plx";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Speech from "expo-speech";
import WifiManager from "react-native-wifi-reborn";

import type {
  BleAdapter,
  HttpAdapter,
  HttpResponse,
  Platform,
  SpeechAdapter,
  StorageAdapter,
  WifiAdapter,
} from "../../../src/smartglass/platform";
import { SCAN_SERVICE_UUIDS, isSameUuid, type CharacteristicRole } from "../../../src/smartglass/protocol/uuids";
import type { GlassesDevice, WifiCredentials } from "../../../src/smartglass/types";

/**
 * 特性の役割 → UUID。
 * 機種で変わるので「見つけたものから当てはめる」方式にしてある。
 * write できるものを command、notify できるもののうち先に見つかったものを notify、
 * 残りを data とする。
 */
interface ResolvedCharacteristics {
  serviceUuid: string;
  command?: string;
  notify?: string;
  data?: string;
}

export class RnBleAdapter implements BleAdapter {
  private manager = new BleManager();
  private device: Device | null = null;
  private resolved: ResolvedCharacteristics | null = null;
  private monitors = new Map<CharacteristicRole, Subscription>();
  private disconnectListeners = new Set<() => void>();

  async isReady(): Promise<boolean> {
    if (RNPlatform.OS === "android") {
      const granted = await requestAndroidBlePermissions();
      if (!granted) return false;
    }
    const state = await this.manager.state();
    return state === "PoweredOn";
  }

  async scan(timeoutMs: number): Promise<GlassesDevice[]> {
    const found = new Map<string, GlassesDevice>();
    return new Promise((resolve) => {
      const stop = () => {
        this.manager.stopDeviceScan();
        resolve([...found.values()]);
      };
      const timer = setTimeout(stop, timeoutMs);

      this.manager.startDeviceScan(SCAN_SERVICE_UUIDS, { allowDuplicates: false }, (error, device) => {
        if (error || !device) {
          clearTimeout(timer);
          stop();
          return;
        }
        found.set(device.id, {
          id: device.id,
          name: device.name ?? device.localName ?? "スマートグラス",
          ...(device.rssi !== null ? { rssi: device.rssi } : {}),
        });
      });
    });
  }

  async connect(deviceId: string): Promise<void> {
    const device = await this.manager.connectToDevice(deviceId, { requestMTU: 247 });
    await device.discoverAllServicesAndCharacteristics();
    this.device = device;
    this.resolved = await resolveCharacteristics(device);

    device.onDisconnected(() => {
      this.device = null;
      this.resolved = null;
      for (const monitor of this.monitors.values()) monitor.remove();
      this.monitors.clear();
      for (const listener of this.disconnectListeners) listener();
    });
  }

  async disconnect(): Promise<void> {
    const id = this.device?.id;
    this.device = null;
    this.resolved = null;
    if (id) await this.manager.cancelDeviceConnection(id).catch(() => undefined);
  }

  isConnected(): boolean {
    return this.device !== null;
  }

  async write(role: CharacteristicRole, data: Uint8Array): Promise<void> {
    const device = this.device;
    const resolved = this.resolved;
    if (!device || !resolved?.[role]) throw new Error(`characteristic not found: ${role}`);
    await device.writeCharacteristicWithResponseForService(
      resolved.serviceUuid,
      resolved[role]!,
      toBase64(data),
    );
  }

  subscribe(role: CharacteristicRole, listener: (data: Uint8Array) => void): () => void {
    const device = this.device;
    const resolved = this.resolved;
    if (!device || !resolved?.[role]) return () => undefined;

    const subscription = device.monitorCharacteristicForService(
      resolved.serviceUuid,
      resolved[role]!,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        listener(fromBase64(characteristic.value));
      },
    );
    this.monitors.set(role, subscription);
    return () => {
      subscription.remove();
      this.monitors.delete(role);
    };
  }

  onDisconnected(listener: () => void): () => void {
    this.disconnectListeners.add(listener);
    return () => this.disconnectListeners.delete(listener);
  }
}

async function resolveCharacteristics(device: Device): Promise<ResolvedCharacteristics> {
  const services = await device.services();
  const target =
    services.find((service) => SCAN_SERVICE_UUIDS.some((uuid) => isSameUuid(uuid, service.uuid))) ??
    services[0];
  if (!target) throw new Error("no BLE service on device");

  const characteristics = await target.characteristics();
  const resolved: ResolvedCharacteristics = { serviceUuid: target.uuid };
  for (const characteristic of characteristics) {
    const writable = characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse;
    if (writable && !resolved.command) resolved.command = characteristic.uuid;
    else if (characteristic.isNotifiable && !resolved.notify) resolved.notify = characteristic.uuid;
    else if (characteristic.isNotifiable && !resolved.data) resolved.data = characteristic.uuid;
  }
  return resolved;
}

async function requestAndroidBlePermissions(): Promise<boolean> {
  // Android 12 以降はスキャン・接続の権限が分かれている。
  const permissions =
    Number(RNPlatform.Version) >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(permissions);
  return Object.values(result).every((value) => value === PermissionsAndroid.RESULTS.GRANTED);
}

/**
 * Wi-Fi。
 *  - Android: メガネが出す AP に つなぐ（Wi-Fi Direct のグループオーナーも同じ形で見える）
 *  - iOS:     NEHotspotConfiguration（joinOnce）。react-native-wifi-reborn が中で呼ぶ。
 * どちらも「入る／抜ける」だけを約束する。
 */
export class RnWifiAdapter implements WifiAdapter {
  private previousSsid: string | null = null;

  async join(credentials: WifiCredentials): Promise<boolean> {
    try {
      this.previousSsid = await WifiManager.getCurrentWifiSSID().catch(() => null);
      await WifiManager.connectToProtectedSSID(credentials.ssid, credentials.password, false, false);
      return true;
    } catch {
      return false;
    }
  }

  async leave(): Promise<void> {
    // iOS は joinOnce なので、切るだけで元に戻る。
    await WifiManager.disconnect().catch(() => undefined);
    if (RNPlatform.OS === "android" && this.previousSsid) {
      // Android は元の Wi-Fi に戻す（利用者の通信が切れたままにしない）。
      await WifiManager.connectToSSID(this.previousSsid).catch(() => undefined);
    }
    this.previousSsid = null;
  }

  async candidateHosts(): Promise<string[]> {
    // 実機: ゲートウェイが分かるならそれが最有力。分からなければ core の候補に任せる。
    const gateway = await WifiManager.getIP().catch(() => null);
    if (!gateway) return [];
    const parts = gateway.split(".");
    if (parts.length !== 4) return [];
    return [`${parts[0]}.${parts[1]}.${parts[2]}.1`];
  }
}

export class RnHttpAdapter implements HttpAdapter {
  async get(url: string, timeoutMs: number): Promise<HttpResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      return { status: response.status, text: await response.text() };
    } finally {
      clearTimeout(timer);
    }
  }

  async download(
    url: string,
    destPath: string,
    options: { timeoutMs: number; fromByte?: number; onProgress?: (received: number, total: number) => void },
  ): Promise<{ path: string; sizeBytes: number }> {
    // 途中まであるなら Range で続きから（切れても最初からやり直さない）。
    const headers = options.fromByte ? { Range: `bytes=${options.fromByte}-` } : undefined;
    const resumable = FileSystem.createDownloadResumable(
      url,
      destPath,
      headers ? { headers } : {},
      (progress) => {
        options.onProgress?.(
          (options.fromByte ?? 0) + progress.totalBytesWritten,
          progress.totalBytesExpectedToWrite,
        );
      },
    );
    const result = await resumable.downloadAsync();
    if (!result) throw new Error("download aborted");
    const info = await FileSystem.getInfoAsync(result.uri);
    return { path: result.uri, sizeBytes: info.exists ? (info.size ?? 0) : 0 };
  }
}

export class RnStorageAdapter implements StorageAdapter {
  private readonly dir = `${FileSystem.documentDirectory}smartglass/`;

  constructor() {
    void FileSystem.makeDirectoryAsync(this.dir, { intermediates: true }).catch(() => undefined);
  }

  mediaDir(): string {
    return this.dir.replace(/\/$/, "");
  }

  async exists(path: string): Promise<boolean> {
    return (await FileSystem.getInfoAsync(path)).exists;
  }

  async sizeOf(path: string): Promise<number> {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists ? (info.size ?? 0) : 0;
  }

  async remove(path: string): Promise<void> {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }

  async readJson<T>(key: string): Promise<T | null> {
    const path = `${this.dir}${key}.json`;
    if (!(await this.exists(path))) return null;
    try {
      return JSON.parse(await FileSystem.readAsStringAsync(path)) as T;
    } catch {
      return null;
    }
  }

  async writeJson(key: string, value: unknown): Promise<void> {
    await FileSystem.writeAsStringAsync(`${this.dir}${key}.json`, JSON.stringify(value));
  }

  async saveToCameraRoll(path: string): Promise<void> {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) throw new Error("camera_roll_permission");
    await MediaLibrary.saveToLibraryAsync(path);
  }
}

export class RnSpeechAdapter implements SpeechAdapter {
  async speak(text: string): Promise<void> {
    Speech.speak(text, { language: "ja-JP", rate: 0.95 });
  }

  async stop(): Promise<void> {
    Speech.stop();
  }

  async listen(lang: string, timeoutMs: number): Promise<string> {
    // 実機: 音声認識はネイティブ側（iOS: SFSpeechRecognizer / Android: SpeechRecognizer）。
    // ここは薄い橋渡しだけ。未実装の端末では空文字を返し、画面は「聞き取れませんでした」を出す。
    const module = (NativeModules as Record<string, { listen?: (lang: string, timeoutMs: number) => Promise<string> }>)
      .SmartGlassSpeech;
    if (!module?.listen) return "";
    return module.listen(lang, timeoutMs).catch(() => "");
  }
}

export function createReactNativePlatform(): Platform {
  return {
    os: RNPlatform.OS === "ios" ? "ios" : "android",
    ble: new RnBleAdapter(),
    wifi: new RnWifiAdapter(),
    http: new RnHttpAdapter(),
    storage: new RnStorageAdapter(),
    speech: new RnSpeechAdapter(),
    now: () => Date.now(),
  };
}

// ── base64 ⇄ バイト列（react-native-ble-plx が base64 でやり取りするため）

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const chunk = (bytes[i]! << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += B64[(chunk >> 18) & 63]! + B64[(chunk >> 12) & 63]!;
    out += i + 1 < bytes.length ? B64[(chunk >> 6) & 63]! : "=";
    out += i + 2 < bytes.length ? B64[chunk & 63]! : "=";
  }
  return out;
}

function fromBase64(text: string): Uint8Array {
  const clean = text.replace(/=+$/, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const index = B64.indexOf(char);
    if (index < 0) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}
