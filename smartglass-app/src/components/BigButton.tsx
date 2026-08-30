/**
 * 大きなボタン。押せるものは、かならずこれで作る。
 * 高さは core の tapTargetHeight() が決める（48dpを下回らない）。
 */

import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { COLORS } from "../../../src/smartglass/ui/tokens";

interface Props {
  label: string;
  onPress: () => void;
  heightDp: number;
  fontSize: number;
  disabled?: boolean;
  busy?: boolean;
  tone?: "primary" | "plain";
}

export function BigButton({ label, onPress, heightDp, fontSize, disabled, busy, tone = "primary" }: Props) {
  const isPrimary = tone === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.base,
        {
          height: heightDp,
          backgroundColor: isPrimary ? COLORS.primary : COLORS.surface,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {busy ? <ActivityIndicator color={isPrimary ? COLORS.onPrimary : COLORS.text} /> : null}
      <Text style={[styles.label, { fontSize, color: isPrimary ? COLORS.onPrimary : COLORS.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  label: { fontWeight: "700", textAlign: "center" },
});
