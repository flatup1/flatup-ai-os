/**
 * つまずいたときの案内。「何が起きたか」と「次にどうするか」を必ず2行で出す。
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { FriendlyError } from "../../../src/smartglass/errors";
import { COLORS } from "../../../src/smartglass/ui/tokens";
import { BigButton } from "./BigButton";

interface Props {
  error: FriendlyError;
  bodyFontSize: number;
  buttonFontSize: number;
  buttonHeight: number;
  onAction: () => void;
  onClose: () => void;
}

export function ErrorCard({ error, bodyFontSize, buttonFontSize, buttonHeight, onAction, onClose }: Props) {
  return (
    <View accessibilityRole="alert" style={styles.card}>
      <Text style={[styles.what, { fontSize: bodyFontSize }]}>{error.what}</Text>
      <Text style={[styles.next, { fontSize: bodyFontSize }]}>{error.next}</Text>
      {error.action ? (
        <BigButton
          label={error.action}
          onPress={onAction}
          heightDp={buttonHeight}
          fontSize={buttonFontSize}
        />
      ) : (
        <BigButton
          label="とじる"
          tone="plain"
          onPress={onClose}
          heightDp={buttonHeight}
          fontSize={buttonFontSize}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: COLORS.error,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    backgroundColor: COLORS.background,
  },
  what: { color: COLORS.error, fontWeight: "700", marginBottom: 8 },
  next: { color: COLORS.text, marginBottom: 12 },
});
