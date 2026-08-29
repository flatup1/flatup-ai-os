/**
 * ホーム。ここに出すのは4つだけ。
 *  ① つながっているか ② メガネの電池 ③ 大きなボタン1つ ④ 最近の写真
 * 迷いどころを作らないため、押せるものは基本ひとつにしてある。
 */

import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import type { HomeView, SmartGlassApp } from "../../../src/smartglass/app";
import { T } from "../../../src/smartglass/i18n";
import { COLORS } from "../../../src/smartglass/ui/tokens";
import { BigButton } from "../components/BigButton";
import { ErrorCard } from "../components/ErrorCard";
import { ProgressBar } from "../components/ProgressBar";

interface Props {
  app: SmartGlassApp;
  view: HomeView;
  onOpenGallery: () => void;
}

export function HomeScreen({ app, view, onOpenGallery }: Props) {
  const busy = view.progress !== undefined || !view.primaryAction.enabled;

  const runPrimary = () => {
    if (view.primaryAction.kind === "connect") void app.connect();
    else if (view.primaryAction.kind === "retry") void app.retryFailed();
    else void app.importMedia();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.status, { borderColor: toneColor(view.statusTone) }]}>
        <Text
          accessibilityRole="header"
          style={[styles.statusText, { fontSize: view.fontSizes.status, color: toneColor(view.statusTone) }]}
        >
          {view.statusText}
        </Text>
        {view.batteryText ? (
          <Text style={[styles.battery, { fontSize: view.fontSizes.status }]}>{view.batteryText}</Text>
        ) : null}
        {view.batteryWarning ? (
          <Text style={[styles.warning, { fontSize: view.fontSizes.body }]}>{view.batteryWarning}</Text>
        ) : null}
        {view.statusTone === "error" ? (
          <Text style={[styles.hint, { fontSize: view.fontSizes.body }]}>{T.connection.hintPowerOn}</Text>
        ) : null}
      </View>

      <BigButton
        label={view.primaryAction.label}
        onPress={runPrimary}
        heightDp={view.primaryAction.heightDp}
        fontSize={view.fontSizes.button}
        disabled={!view.primaryAction.enabled}
        busy={busy && view.progress !== undefined}
      />

      {view.progress && view.progress.total > 0 ? (
        <ProgressBar progress={view.progress} fontSize={view.fontSizes.body} />
      ) : null}

      {view.error ? (
        <ErrorCard
          error={view.error}
          bodyFontSize={view.fontSizes.body}
          buttonFontSize={view.fontSizes.button}
          buttonHeight={view.primaryAction.heightDp}
          onAction={runPrimary}
          onClose={() => app.dismissError()}
        />
      ) : null}

      <Text accessibilityRole="header" style={[styles.section, { fontSize: view.fontSizes.title }]}>
        {T.gallery.title}
      </Text>
      {view.recent.length === 0 ? (
        <Text style={[styles.empty, { fontSize: view.fontSizes.body }]}>{T.gallery.empty}</Text>
      ) : (
        <>
          <View style={styles.thumbs}>
            {view.recent.map((item) => (
              <View key={item.id} style={styles.thumb}>
                {item.kind === "photo" && item.localPath ? (
                  <Image source={{ uri: item.localPath }} style={styles.thumbImage} resizeMode="cover" />
                ) : null}
                <Text
                  style={[styles.thumbLabel, { fontSize: view.fontSizes.caption }]}
                  numberOfLines={1}
                >
                  {item.fileName}
                </Text>
              </View>
            ))}
          </View>
          <BigButton
            label={`${T.gallery.title}をぜんぶ見る`}
            tone="plain"
            onPress={onOpenGallery}
            heightDp={view.primaryAction.heightDp}
            fontSize={view.fontSizes.button}
          />
        </>
      )}
    </ScrollView>
  );
}

function toneColor(tone: HomeView["statusTone"]): string {
  if (tone === "ok") return COLORS.ok;
  if (tone === "warn") return COLORS.warn;
  if (tone === "error") return COLORS.error;
  return COLORS.textMuted;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 48 },
  status: { borderWidth: 3, borderRadius: 16, padding: 16, marginBottom: 8 },
  statusText: { fontWeight: "800" },
  battery: { color: COLORS.text, fontWeight: "700", marginTop: 8 },
  warning: { color: COLORS.warn, marginTop: 8 },
  hint: { color: COLORS.textMuted, marginTop: 8 },
  section: { fontWeight: "800", color: COLORS.text, marginTop: 24, marginBottom: 8 },
  empty: { color: COLORS.textMuted, lineHeight: 28 },
  thumbs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumb: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  thumbImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  thumbLabel: { backgroundColor: "rgba(255,255,255,0.88)", color: COLORS.textMuted, padding: 6 },
});
