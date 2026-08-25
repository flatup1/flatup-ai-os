/**
 * 取り込みの進み具合。棒と「○枚中○枚」の両方を出す（棒だけだと分からない）。
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { TransferProgress } from "../../../src/smartglass/types";
import { COLORS } from "../../../src/smartglass/ui/tokens";

export function ProgressBar({ progress, fontSize }: { progress: TransferProgress; fontSize: number }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: progress.total, now: progress.completed }}
      style={styles.wrap}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress.ratio * 100)}%` }]} />
      </View>
      <Text style={[styles.text, { fontSize }]}>{progress.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 12 },
  track: { height: 16, borderRadius: 8, backgroundColor: COLORS.surface, overflow: "hidden" },
  fill: { height: 16, backgroundColor: COLORS.primary },
  text: { marginTop: 8, color: COLORS.text, fontWeight: "600" },
});
