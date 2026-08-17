/**
 * キャラクター基準画像の登録簿（ANIMATION BIBLE v3.0「制作時の使い方」1.の実装）。
 *
 * バイブルは「各キャラ1枚を確定し、以後全カット・全話でその画像を参照する（顔ブレ防止）」
 * と定めているが、これまで画像生成は文章のみで、参照画像を渡す口が無かった。
 * ここでキャラIDと基準画像を結び付け、カットに写るキャラの画像を生成時に添えられるようにする。
 *
 * 基準画像の置き場所: assets/characters/<id>.png （jpg/jpeg/webp も可）
 *   例: assets/characters/tsumu.png
 *
 * 画像が無いキャラは「文章の姿かたち（look）」だけで生成される（従来と同じ挙動）。
 */

import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

/** 基準画像を置くフォルダ（リポジトリ直下からの相対） */
export const CHARACTER_DIR = join(process.cwd(), "assets", "characters");

const IMG_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export interface Character {
  /** 英数字のID（ファイル名に使う） */
  id: string;
  /** 日本語名（ログ表示・バイブルとの対応用） */
  name: string;
  /** 基準画像が無いときに使う英語の姿かたち */
  look: string;
}

/**
 * レギュラー陣（ANIMATION BIBLE v3.0「子どもたち（レギュラー）」と1対1）。
 * 実在会員の顔に寄せない、というバイブルの禁止事項を守るため、
 * look にはモデルとなる実在人物を一切書かない。
 */
export const CHARACTERS: Character[] = [
  {
    id: "tsumu",
    name: "ツム",
    look:
      "a 2.5-head-tall chibi 5-year-old girl with shoulder-length light brown wavy hair in a small ponytail, " +
      "large round glossy brown eyes, rosy cheeks, white t-shirt and light blue FLAT UP GYM muay thai shorts, barefoot, shy gentle expression",
  },
  {
    id: "riku",
    name: "リク",
    look:
      "a 2.5-head-tall chibi 7-year-old boy with spiky black hair, large round glossy dark eyes, " +
      "black FLAT UP GYM tank top and blue muay thai shorts, barefoot, energetic cheerful expression",
  },
  {
    id: "yui",
    name: "ユイ",
    look:
      "a 2.5-head-tall chibi 8-year-old girl with long dark hair tied back, large round glossy eyes, " +
      "FLAT UP GYM t-shirt and shorts, barefoot, kind caring expression",
  },
  {
    id: "sota",
    name: "ソウタ",
    look:
      "a 2.5-head-tall chibi 6-year-old boy with short brown hair, large round glossy eyes, " +
      "FLAT UP GYM t-shirt and shorts, barefoot, determined competitive expression",
  },
  {
    id: "koko",
    name: "ココ",
    look:
      "a 2.5-head-tall chibi 4-year-old girl with short fluffy hair and tiny pigtails, very large round glossy eyes, " +
      "FLAT UP GYM t-shirt and shorts, barefoot, adorable innocent expression",
  },
  {
    id: "masaki",
    name: "マサキ",
    look:
      "a friendly young male kickboxing coach in his late teens with short black hair, " +
      "black FLAT UP GYM hoodie, warm encouraging smile, stylized 3D animation character",
  },
];

/** ID または日本語名からキャラを引く */
export function findCharacter(idOrName: string): Character | undefined {
  const q = idOrName.trim().toLowerCase();
  if (!q) return undefined;
  return CHARACTERS.find(c => c.id === q || c.name === idOrName.trim());
}

/** 指定キャラたちの「姿かたち」をプロンプト用の一文にまとめる */
export function describeCharacters(ids: string[]): string {
  const looks = ids
    .map(id => findCharacter(id))
    .filter((c): c is Character => Boolean(c))
    .map(c => c.look);
  return looks.join(". ");
}

/** 拡張子から MIME を返す（未対応は undefined） */
export function imageMime(path: string): string | undefined {
  return IMG_EXT[extname(path).toLowerCase()];
}

/**
 * キャラの基準画像を data URI で読む。
 * 見つからない・未対応形式なら undefined（呼び側は文章生成にフォールバックする）。
 */
export async function characterReference(id: string, dir = CHARACTER_DIR): Promise<string | undefined> {
  for (const ext of Object.keys(IMG_EXT)) {
    const path = join(dir, `${id}${ext}`);
    try {
      const buf = await readFile(path);
      return `data:${IMG_EXT[ext]};base64,${buf.toString("base64")}`;
    } catch {
      // 次の拡張子を試す
    }
  }
  return undefined;
}

/** 指定キャラたちの基準画像を、見つかったぶんだけ集める */
export async function characterReferences(ids: string[], dir = CHARACTER_DIR): Promise<string[]> {
  const found: string[] = [];
  for (const id of ids) {
    const ref = await characterReference(id, dir);
    if (ref) found.push(ref);
  }
  return found;
}
