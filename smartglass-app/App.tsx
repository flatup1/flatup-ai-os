/**
 * アプリの入口。タブは4つまで（ホーム／写真／AI・翻訳／設定）。
 *
 * 画面の中身の判断は core（../src/smartglass）が持つ。
 * ここは「core の言うとおりに描く」だけにしてある。
 */

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";

import { SmartGlassApp, type HomeView } from "../src/smartglass/app";
import { TUTORIAL } from "../src/smartglass/help/faq";
import { T } from "../src/smartglass/i18n";
import { COLORS, MIN_TAP_TARGET_DP, tapTargetHeight } from "../src/smartglass/ui/tokens";
import type { AppSettings } from "../src/smartglass/types";
import { BigButton } from "./src/components/BigButton";
import { createReactNativePlatform } from "./src/platform/reactNative";
import { AiScreen } from "./src/screens/AiScreen";
import { GalleryScreen } from "./src/screens/GalleryScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

type Tab = "home" | "gallery" | "ai" | "settings";

const TABS: [Tab, string][] = [
  ["home", T.app.tabHome],
  ["gallery", T.app.tabGallery],
  ["ai", T.app.tabAi],
  ["settings", T.app.tabSettings],
];

export default function App() {
  const app = useMemo(() => new SmartGlassApp(createReactNativePlatform()), []);
  const [tab, setTab] = useState<Tab>("home");
  const [view, setView] = useState<HomeView | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  /** ギャラリーを描き直すための目印。 */
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let mounted = true;
    void app.start().then(async () => {
      if (!mounted) return;
      // はじめて開いた人には、そのまま案内を出す。
      const seen = await app.settings.get();
      if (seen.fontScale === "large" && app.gallery.all().length === 0) setTutorialStep(0);
    });

    const offView = app.subscribe((next) => {
      setView(next);
      setRevision((prev) => prev + 1);
    });
    const offSettings = app.settings.subscribe(setSettings);
    return () => {
      mounted = false;
      offView();
      offSettings();
    };
  }, [app]);

  if (!view || !settings) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={styles.loadingText}>{T.common.loading}</Text>
      </SafeAreaView>
    );
  }

  const buttonHeight = tapTargetHeight(settings.fontScale, MIN_TAP_TARGET_DP + 8);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {tab === "home" ? (
        <HomeScreen app={app} view={view} onOpenGallery={() => setTab("gallery")} />
      ) : null}
      {tab === "gallery" ? (
        <GalleryScreen app={app} fontSizes={view.fontSizes} buttonHeight={buttonHeight} revision={revision} />
      ) : null}
      {tab === "ai" ? <AiScreen app={app} fontSizes={view.fontSizes} buttonHeight={buttonHeight} /> : null}
      {tab === "settings" ? (
        <SettingsScreen
          app={app}
          settings={settings}
          fontSizes={view.fontSizes}
          buttonHeight={buttonHeight}
          onOpenTutorial={() => setTutorialStep(0)}
        />
      ) : null}

      <View style={styles.tabBar}>
        {TABS.map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: tab === value }}
            onPress={() => setTab(value)}
            style={[styles.tab, { minHeight: buttonHeight }, tab === value ? styles.tabActive : null]}
          >
            <Text
              style={[
                styles.tabLabel,
                { fontSize: view.fontSizes.button, color: tab === value ? COLORS.primary : COLORS.textMuted },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={tutorialStep !== null} animationType="fade" onRequestClose={() => setTutorialStep(null)}>
        <View style={styles.tutorial}>
          {tutorialStep !== null ? (
            <>
              <Text style={[styles.tutorialTitle, { fontSize: view.fontSizes.title }]}>
                {TUTORIAL[tutorialStep]!.title}
              </Text>
              <Text style={[styles.tutorialBody, { fontSize: view.fontSizes.body }]}>
                {TUTORIAL[tutorialStep]!.body}
              </Text>
              <BigButton
                label={TUTORIAL[tutorialStep]!.action ?? T.common.next}
                onPress={() =>
                  setTutorialStep((step) =>
                    step === null || step + 1 >= TUTORIAL.length ? null : step + 1,
                  )
                }
                heightDp={buttonHeight}
                fontSize={view.fontSizes.button}
              />
              <BigButton
                label={T.common.close}
                tone="plain"
                onPress={() => setTutorialStep(null)}
                heightDp={buttonHeight}
                fontSize={view.fontSizes.button}
              />
              <Text style={[styles.tutorialCount, { fontSize: view.fontSizes.caption }]}>
                {tutorialStep + 1} / {TUTORIAL.length}
              </Text>
            </>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  loadingText: { fontSize: 22, color: COLORS.text },
  tabBar: { flexDirection: "row", borderTopWidth: 2, borderTopColor: COLORS.surface },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  tabActive: { borderTopWidth: 4, borderTopColor: COLORS.primary },
  tabLabel: { fontWeight: "700" },
  tutorial: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: "center" },
  tutorialTitle: { fontWeight: "800", color: COLORS.text, marginBottom: 16 },
  tutorialBody: { color: COLORS.text, lineHeight: 32, marginBottom: 24 },
  tutorialCount: { color: COLORS.textMuted, textAlign: "center", marginTop: 12 },
});
