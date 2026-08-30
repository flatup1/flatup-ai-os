/**
 * AI・翻訳。3つのモードを大きなボタンで切り替えるだけ。
 *  ① AIにきく ② 会話の翻訳 ③ これは何？（写真を見てもらう）
 */

import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { SmartGlassApp } from "../../../src/smartglass/app";
import { SHORTCUT_QUESTIONS } from "../../../src/smartglass/ai/assistant";
import { orderedLanguages } from "../../../src/smartglass/ai/translate";
import { asFriendly } from "../../../src/smartglass/errors";
import { T } from "../../../src/smartglass/i18n";
import { COLORS } from "../../../src/smartglass/ui/tokens";
import { BigButton } from "../components/BigButton";
import { ErrorCard } from "../components/ErrorCard";

type Mode = "assistant" | "translate" | "vision";

interface Props {
  app: SmartGlassApp;
  fontSizes: { title: number; body: number; button: number; caption: number };
  buttonHeight: number;
}

export function AiScreen({ app, fontSizes, buttonHeight }: Props) {
  const [mode, setMode] = useState<Mode>("assistant");
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<{ who: "user" | "ai"; text: string; note?: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ReturnType<typeof asFriendly> | null>(null);

  const settings = app.settings.get();
  const languages = orderedLanguages(settings.favoriteLanguages);
  const [myLang, setMyLang] = useState(languages[0]?.code ?? "ja");
  const [theirLang, setTheirLang] = useState(languages[1]?.code ?? "en");

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setBusy(true);
    setError(null);
    setLines((prev) => [...prev, { who: "user", text: question }]);
    setInput("");
    try {
      const reply = await app.assistant.ask(question);
      const note = reply.source === "local" ? T.ai.localOnly : T.ai.cloudNotice;
      setLines((prev) => [...prev, { who: "ai", text: reply.text, note }]);
      void app.speak(reply.text);
    } catch (caught) {
      setError(asFriendly(caught));
    } finally {
      setBusy(false);
    }
  };

  const translateOnce = async (direction: "mine" | "theirs") => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const [from, to] = direction === "mine" ? [myLang, theirLang] : [theirLang, myLang];
      const entry = await app.translator.listenAndTranslate(from, to, direction);
      setLines((prev) => [
        ...prev,
        { who: "user", text: entry.sourceText },
        { who: "ai", text: entry.translatedText },
      ]);
      void app.speak(entry.translatedText);
    } catch (caught) {
      setError(asFriendly(caught));
    } finally {
      setBusy(false);
    }
  };

  const describeNewest = async () => {
    const newest = app.gallery.all().find((item) => item.kind === "photo" && item.localPath);
    if (!newest?.localPath) {
      setError(asFriendly(new Error("no photo")));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const answer = await app.vision.describe(newest.localPath);
      setLines((prev) => [
        ...prev,
        { who: "user", text: `${T.ai.vision}（${newest.fileName}）` },
        { who: "ai", text: answer.spoken, note: answer.source === "local" ? T.ai.localOnly : T.ai.cloudNotice },
      ]);
      void app.speak(answer.spoken);
    } catch (caught) {
      setError(asFriendly(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={[styles.title, { fontSize: fontSizes.title }]}>
        {T.ai.title}
      </Text>

      <View style={styles.modes}>
        {(
          [
            ["assistant", T.ai.assistant],
            ["translate", T.ai.translateTitle],
            ["vision", T.ai.vision],
          ] as [Mode, string][]
        ).map(([value, label]) => (
          <BigButton
            key={value}
            label={label}
            tone={mode === value ? "primary" : "plain"}
            onPress={() => setMode(value)}
            heightDp={buttonHeight}
            fontSize={fontSizes.button}
          />
        ))}
      </View>

      {mode === "assistant" ? (
        <>
          {SHORTCUT_QUESTIONS.map((question) => (
            <BigButton
              key={question}
              label={question}
              tone="plain"
              onPress={() => void ask(question)}
              heightDp={buttonHeight}
              fontSize={fontSizes.button}
            />
          ))}
          <TextInput
            accessibilityLabel={T.ai.ask}
            style={[styles.input, { fontSize: fontSizes.body }]}
            value={input}
            onChangeText={setInput}
            placeholder={T.ai.ask}
            placeholderTextColor={COLORS.textMuted}
            multiline
          />
          <BigButton
            label={T.ai.ask}
            onPress={() => void ask(input)}
            heightDp={buttonHeight}
            fontSize={fontSizes.button}
            busy={busy}
          />
        </>
      ) : null}

      {mode === "translate" ? (
        <>
          <Text style={[styles.label, { fontSize: fontSizes.body }]}>
            {T.ai.myLanguage}: {labelOf(languages, myLang)} ／ {T.ai.theirLanguage}: {labelOf(languages, theirLang)}
          </Text>
          <BigButton
            label={T.ai.swap}
            tone="plain"
            onPress={() => {
              setMyLang(theirLang);
              setTheirLang(myLang);
            }}
            heightDp={buttonHeight}
            fontSize={fontSizes.button}
          />
          <BigButton
            label={`${labelOf(languages, myLang)}で話す`}
            onPress={() => void translateOnce("mine")}
            heightDp={buttonHeight}
            fontSize={fontSizes.button}
            busy={busy}
          />
          <BigButton
            label={`${labelOf(languages, theirLang)}を聞く`}
            onPress={() => void translateOnce("theirs")}
            heightDp={buttonHeight}
            fontSize={fontSizes.button}
            busy={busy}
          />
        </>
      ) : null}

      {mode === "vision" ? (
        <BigButton
          label={T.ai.vision}
          onPress={() => void describeNewest()}
          heightDp={buttonHeight}
          fontSize={fontSizes.button}
          busy={busy}
        />
      ) : null}

      {error ? (
        <ErrorCard
          error={error}
          bodyFontSize={fontSizes.body}
          buttonFontSize={fontSizes.button}
          buttonHeight={buttonHeight}
          onAction={() => setError(null)}
          onClose={() => setError(null)}
        />
      ) : null}

      {lines.map((line, index) => (
        <View key={index} style={[styles.bubble, line.who === "user" ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.bubbleText, { fontSize: fontSizes.body }]}>{line.text}</Text>
          {line.note ? (
            <Text style={[styles.note, { fontSize: fontSizes.caption }]}>{line.note}</Text>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

function labelOf(languages: { code: string; label: string; flag: string }[], code: string): string {
  const lang = languages.find((item) => item.code === code);
  return lang ? `${lang.flag} ${lang.label}` : code;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontWeight: "800", color: COLORS.text, marginBottom: 12 },
  modes: { marginBottom: 16 },
  label: { color: COLORS.text, fontWeight: "700", marginVertical: 8 },
  input: {
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    borderRadius: 12,
    padding: 14,
    minHeight: 96,
    color: COLORS.text,
    marginVertical: 8,
  },
  bubble: { borderRadius: 14, padding: 14, marginVertical: 6 },
  userBubble: { backgroundColor: COLORS.surface, alignSelf: "flex-end", maxWidth: "90%" },
  aiBubble: { backgroundColor: COLORS.background, borderWidth: 2, borderColor: COLORS.surface },
  bubbleText: { color: COLORS.text, lineHeight: 28 },
  note: { color: COLORS.textMuted, marginTop: 6 },
});
