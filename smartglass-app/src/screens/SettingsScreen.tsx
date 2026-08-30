/**
 * 設定・ヘルプ。切り替えは大きなボタンで。スイッチは押しにくいので使わない。
 */

import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { SmartGlassApp } from "../../../src/smartglass/app";
import { FAQ, TUTORIAL, faqByCategory, searchFaq } from "../../../src/smartglass/help/faq";
import { T } from "../../../src/smartglass/i18n";
import { COLORS } from "../../../src/smartglass/ui/tokens";
import type { AppSettings, FontScaleName } from "../../../src/smartglass/types";
import { BigButton } from "../components/BigButton";

interface Props {
  app: SmartGlassApp;
  settings: AppSettings;
  fontSizes: { title: number; body: number; button: number; caption: number };
  buttonHeight: number;
  onOpenTutorial: () => void;
}

const FONT_CHOICES: [FontScaleName, string][] = [
  ["small", T.settings.fontSmall],
  ["medium", T.settings.fontMedium],
  ["large", T.settings.fontLarge],
  ["xlarge", T.settings.fontXLarge],
];

export function SettingsScreen({ app, settings, fontSizes, buttonHeight, onOpenTutorial }: Props) {
  const [query, setQuery] = useState("");
  const results = query.trim() ? searchFaq(query) : null;

  const toggle = (key: keyof AppSettings, label: string) => (
    <BigButton
      key={key}
      label={`${label}：${settings[key] ? "入" : "切"}`}
      tone={settings[key] ? "primary" : "plain"}
      onPress={() => void app.settings.update({ [key]: !settings[key] } as Partial<AppSettings>)}
      heightDp={buttonHeight}
      fontSize={fontSizes.button}
    />
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={[styles.title, { fontSize: fontSizes.title }]}>
        {T.settings.title}
      </Text>

      <Text style={[styles.label, { fontSize: fontSizes.body }]}>{T.settings.fontSize}</Text>
      <View style={styles.row}>
        {FONT_CHOICES.map(([scale, label]) => (
          <View key={scale} style={styles.rowItem}>
            <BigButton
              label={label}
              tone={settings.fontScale === scale ? "primary" : "plain"}
              onPress={() => void app.settings.setFontScale(scale)}
              heightDp={buttonHeight}
              fontSize={fontSizes.button}
            />
          </View>
        ))}
      </View>

      {toggle("voiceGuide", T.settings.voiceGuide)}
      <Text style={[styles.hint, { fontSize: fontSizes.caption }]}>{T.settings.voiceGuideHint}</Text>

      {toggle("autoTransfer", T.settings.autoTransfer)}
      <Text style={[styles.hint, { fontSize: fontSizes.caption }]}>{T.settings.autoTransferHint}</Text>

      {toggle("autoSaveToCameraRoll", T.settings.autoSave)}

      {toggle("allowCloudAi", T.settings.allowCloudAi)}
      <Text style={[styles.hint, { fontSize: fontSizes.caption }]}>{T.settings.allowCloudAiHint}</Text>

      <BigButton
        label={T.settings.tutorial}
        tone="plain"
        onPress={onOpenTutorial}
        heightDp={buttonHeight}
        fontSize={fontSizes.button}
      />

      <Text accessibilityRole="header" style={[styles.title, { fontSize: fontSizes.title, marginTop: 32 }]}>
        {T.settings.help}
      </Text>
      <TextInput
        accessibilityLabel={T.help.searchPlaceholder}
        style={[styles.input, { fontSize: fontSizes.body }]}
        value={query}
        onChangeText={setQuery}
        placeholder={T.help.searchPlaceholder}
        placeholderTextColor={COLORS.textMuted}
      />

      {results ? (
        results.length === 0 ? (
          <Text style={[styles.hint, { fontSize: fontSizes.body }]}>{T.help.noResult}</Text>
        ) : (
          results.map((entry) => <FaqBlock key={entry.id} entry={entry} fontSizes={fontSizes} />)
        )
      ) : (
        faqByCategory(FAQ).map((group) => (
          <View key={group.category}>
            <Text style={[styles.label, { fontSize: fontSizes.body }]}>{group.category}</Text>
            {group.entries.map((entry) => (
              <FaqBlock key={entry.id} entry={entry} fontSizes={fontSizes} />
            ))}
          </View>
        ))
      )}

      <Text style={[styles.hint, { fontSize: fontSizes.caption, marginTop: 24 }]}>
        {T.settings.version} 0.1.0 ／ 全{TUTORIAL.length}手順のご案内つき
      </Text>
    </ScrollView>
  );
}

function FaqBlock({
  entry,
  fontSizes,
}: {
  entry: (typeof FAQ)[number];
  fontSizes: { body: number; caption: number };
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faq}>
      <Text
        accessibilityRole="button"
        onPress={() => setOpen((prev) => !prev)}
        style={[styles.faqQuestion, { fontSize: fontSizes.body }]}
      >
        {open ? "▼ " : "▶ "}
        {entry.question}
      </Text>
      {open
        ? entry.steps.map((step, index) => (
            <Text key={index} style={[styles.faqStep, { fontSize: fontSizes.body }]}>
              {index + 1}. {step}
            </Text>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontWeight: "800", color: COLORS.text, marginBottom: 12 },
  label: { fontWeight: "700", color: COLORS.text, marginTop: 20, marginBottom: 4 },
  hint: { color: COLORS.textMuted, marginBottom: 8, lineHeight: 24 },
  row: { flexDirection: "row", gap: 8 },
  rowItem: { flex: 1 },
  input: {
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    marginVertical: 8,
  },
  faq: { borderTopWidth: 1, borderTopColor: COLORS.surface, paddingVertical: 12 },
  faqQuestion: { fontWeight: "700", color: COLORS.primary, lineHeight: 30 },
  faqStep: { color: COLORS.text, marginTop: 8, lineHeight: 28 },
});
