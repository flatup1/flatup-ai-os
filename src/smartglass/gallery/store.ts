/**
 * 取り込み済みの写真の目録。
 *
 * 目録は端末の中に持つ。だからメガネがなくても、電波がなくても写真は見られる。
 */

import type { StorageAdapter } from "../platform.js";
import type { MediaItem } from "../types.js";
import { friendlyDate } from "../i18n.js";

const STORE_KEY = "gallery.index.v1";
/** 取り込めなかったものは別に覚えて、次につながったときに続きをやる。 */
const PENDING_KEY = "gallery.pending.v1";

export interface GallerySection {
  /** 「きょう」「8月25日」。 */
  title: string;
  /** その日の分。新しい順。 */
  items: MediaItem[];
}

export class GalleryStore {
  private items: MediaItem[] = [];
  private pending: MediaItem[] = [];
  private loaded = false;

  constructor(private readonly storage: StorageAdapter) {}

  /** 起動時に一度だけ。 */
  async load(): Promise<void> {
    if (this.loaded) return;
    this.items = (await this.storage.readJson<MediaItem[]>(STORE_KEY)) ?? [];
    this.pending = (await this.storage.readJson<MediaItem[]>(PENDING_KEY)) ?? [];
    this.loaded = true;
  }

  /** すでに持っているもののID。転送前にこれを渡すと、二度取り込まない。 */
  knownIds(): Set<string> {
    return new Set(this.items.map((item) => item.id));
  }

  all(): MediaItem[] {
    return [...this.items].sort((a, b) => b.takenAt - a.takenAt);
  }

  find(id: string): MediaItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  /** 取り込めなかったもの。画面の「あとで取り込む」に出す。 */
  pendingItems(): MediaItem[] {
    return [...this.pending];
  }

  /** 取り込めたものを目録に足す。 */
  async add(items: MediaItem[]): Promise<void> {
    if (items.length === 0) return;
    const map = new Map(this.items.map((item) => [item.id, item]));
    for (const item of items) map.set(item.id, { ...map.get(item.id), ...item });
    this.items = [...map.values()];
    // 取り込めたものは「あとで」から外す。
    const added = new Set(items.map((item) => item.id));
    this.pending = this.pending.filter((item) => !added.has(item.id));
    await this.persist();
  }

  /** 取り込めなかったものを覚える。 */
  async setPending(items: MediaItem[]): Promise<void> {
    this.pending = items;
    await this.storage.writeJson(PENDING_KEY, this.pending);
  }

  /** カメラロールへ保存して、印を付ける。 */
  async saveToCameraRoll(id: string): Promise<void> {
    const item = this.find(id);
    if (!item?.localPath) return;
    await this.storage.saveToCameraRoll(item.localPath);
    this.items = this.items.map((it) => (it.id === id ? { ...it, savedToCameraRoll: true } : it));
    await this.persist();
  }

  /** 端末から消す（メガネの中は消さない）。 */
  async remove(id: string): Promise<void> {
    const item = this.find(id);
    if (item?.localPath) await this.storage.remove(item.localPath).catch(() => undefined);
    this.items = this.items.filter((it) => it.id !== id);
    await this.persist();
  }

  /** 日付ごとにまとめる。画面はこれをそのまま並べる。 */
  sections(now: number = Date.now()): GallerySection[] {
    const groups = new Map<string, MediaItem[]>();
    for (const item of this.all()) {
      const title = friendlyDate(item.takenAt, now);
      const list = groups.get(title) ?? [];
      list.push(item);
      groups.set(title, list);
    }
    return [...groups.entries()].map(([title, items]) => ({ title, items }));
  }

  private async persist(): Promise<void> {
    await this.storage.writeJson(STORE_KEY, this.items);
    await this.storage.writeJson(PENDING_KEY, this.pending);
  }
}
