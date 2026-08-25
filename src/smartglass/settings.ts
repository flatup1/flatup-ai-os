/**
 * 設定の出し入れ。端末に残るので、次に開いても文字は大きいまま。
 */

import type { StorageAdapter } from "./platform.js";
import { DEFAULT_SETTINGS, type AppSettings, type FontScaleName } from "./types.js";

const KEY = "settings.v1";

type Listener = (settings: AppSettings) => void;

export class SettingsStore {
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private listeners = new Set<Listener>();

  constructor(private readonly storage: StorageAdapter) {}

  async load(): Promise<AppSettings> {
    const saved = await this.storage.readJson<Partial<AppSettings>>(KEY);
    // 増えた項目は既定値で埋める（古い設定でも壊れない）。
    this.settings = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
    this.emit();
    return this.settings;
  }

  get(): AppSettings {
    return this.settings;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.settings);
    return () => this.listeners.delete(listener);
  }

  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    this.settings = { ...this.settings, ...patch };
    await this.storage.writeJson(KEY, this.settings);
    this.emit();
    return this.settings;
  }

  /** 文字の大きさ。設定画面の4つのボタンから呼ぶ。 */
  async setFontScale(scale: FontScaleName): Promise<void> {
    await this.update({ fontScale: scale });
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.settings);
  }
}
