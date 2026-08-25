/**
 * 見た目の決まりごと。ここを守れば「大きい・読める・押せる」が崩れない。
 *
 * 根拠:
 *  - タップできる大きさは 48dp 以上（Android のアクセシビリティ指針 / iOS は44pt）。
 *  - 本文と背景のコントラスト比は 4.5:1 以上、大きな文字は 3:1 以上（WCAG 2.1 AA）。
 * どちらもテストで機械的に見張る（tokens.test.ts）。
 */

import type { FontScaleName } from "../types.js";

/** どれだけ大きくするか。既定は "large"。 */
export const FONT_SCALES: Record<FontScaleName, number> = {
  small: 1.0,
  medium: 1.15,
  large: 1.35,
  xlarge: 1.6,
};

/** 基準の文字サイズ（scale をかける前）。 */
export const BASE_FONT_SIZES = {
  /** 画面のいちばん上の見出し。 */
  title: 22,
  /** 本文。 */
  body: 16,
  /** 補足。これより小さい文字は作らない。 */
  caption: 14,
  /** 大きなボタンの中の文字。 */
  button: 18,
  /** 電池・接続など、遠目で読ませたい数字。 */
  status: 20,
} as const;

export type FontRole = keyof typeof BASE_FONT_SIZES;

/** 押せるものの最小の大きさ（dp）。これを下回るボタンは作らない。 */
export const MIN_TAP_TARGET_DP = 48;

/** ホームの主役ボタンの高さ。指の大きさに余裕を持たせる。 */
export const PRIMARY_BUTTON_HEIGHT_DP = 72;

/** 実際の文字サイズを出す。 */
export function fontSize(role: FontRole, scale: FontScaleName): number {
  return Math.round(BASE_FONT_SIZES[role] * FONT_SCALES[scale]);
}

/**
 * 文字が大きくなったらボタンも大きくする。
 * 文字だけ大きくして枠がそのままだと、字が切れて逆に読めなくなる。
 */
export function tapTargetHeight(scale: FontScaleName, base: number = MIN_TAP_TARGET_DP): number {
  return Math.max(MIN_TAP_TARGET_DP, Math.round(base * FONT_SCALES[scale]));
}

/** 色。明るい背景に濃い文字。色だけで意味を伝えない（かならず文字も添える）。 */
export const COLORS = {
  background: "#FFFFFF",
  surface: "#F2F4F7",
  text: "#1A1A1A",
  textMuted: "#4A4A4A",
  /** つながっている。 */
  ok: "#0B6B3A",
  /** 注意（電池が少ないなど）。 */
  warn: "#8A4B00",
  /** うまくいかなかった。 */
  error: "#A4123F",
  /** 主役のボタン。 */
  primary: "#0B4F9E",
  onPrimary: "#FFFFFF",
} as const;

/** コントラスト比を出す（WCAG 2.1 の式）。 */
export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const [light, dark] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}
