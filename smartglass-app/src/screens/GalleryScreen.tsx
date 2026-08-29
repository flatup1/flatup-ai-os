/**
 * 写真。日付ごとに、大きなサムネイルで並べる。
 * 押すと大きく出て、そこから「スマホに保存する」「送る・共有する」。
 */

import React, { useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import type { SmartGlassApp } from "../../../src/smartglass/app";
import { T, friendlySize } from "../../../src/smartglass/i18n";
import { COLORS } from "../../../src/smartglass/ui/tokens";
import type { MediaItem } from "../../../src/smartglass/types";
import { BigButton } from "../components/BigButton";

interface Props {
  app: SmartGlassApp;
  fontSizes: { title: number; body: number; button: number; caption: number };
  buttonHeight: number;
  /** 目録が変わるたびに増える値。これで並べ直す。 */
  revision: number;
}

export function GalleryScreen({ app, fontSizes, buttonHeight, revision }: Props) {
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sections = useMemo(() => app.gallery.sections(), [app, revision]);

  const save = async () => {
    if (!selected) return;
    await app.gallery.saveToCameraRoll(selected.id).catch(() => undefined);
    setNotice(T.gallery.saved);
    void app.speak(T.gallery.saved);
  };

  const share = async () => {
    if (!selected?.localPath) return;
    await Share.share({ url: selected.localPath, message: selected.fileName }).catch(() => undefined);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={[styles.title, { fontSize: fontSizes.title }]}>
        {T.gallery.title}
      </Text>

      {sections.length === 0 ? (
        <Text style={[styles.empty, { fontSize: fontSizes.body }]}>{T.gallery.empty}</Text>
      ) : (
        sections.map((section) => (
          <View key={section.title}>
            <Text style={[styles.sectionTitle, { fontSize: fontSizes.body }]}>{section.title}</Text>
            <View style={styles.grid}>
              {section.items.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`${kindLabel(item)} ${item.fileName}`}
                  onPress={() => setSelected(item)}
                  style={styles.cell}
                >
                  {item.kind === "photo" && item.localPath ? (
                    // 写真そのものを出す。ファイル名だけだと、どれがどれか分からない。
                    <Image source={{ uri: item.localPath }} style={styles.cellImage} resizeMode="cover" />
                  ) : null}
                  <View style={styles.cellCaption}>
                    <Text style={[styles.cellKind, { fontSize: fontSizes.caption }]}>{kindLabel(item)}</Text>
                    <Text style={[styles.cellName, { fontSize: fontSizes.caption }]} numberOfLines={1}>
                      {item.fileName}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}

      <Modal visible={selected !== null} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modal}>
          {selected?.kind === "photo" && selected.localPath ? (
            <Image
              accessibilityLabel={`${T.gallery.photo} ${selected.fileName}`}
              source={{ uri: selected.localPath }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : null}
          <Text style={[styles.title, { fontSize: fontSizes.title }]}>{selected?.fileName}</Text>
          <Text style={[styles.meta, { fontSize: fontSizes.body }]}>
            {selected ? `${kindLabel(selected)}・${friendlySize(selected.sizeBytes)}` : ""}
          </Text>
          {notice ? <Text style={[styles.notice, { fontSize: fontSizes.body }]}>{notice}</Text> : null}

          <BigButton label={T.gallery.saveToPhone} onPress={save} heightDp={buttonHeight} fontSize={fontSizes.button} />
          <BigButton label={T.gallery.share} onPress={share} heightDp={buttonHeight} fontSize={fontSizes.button} tone="plain" />
          <BigButton
            label={T.common.close}
            tone="plain"
            onPress={() => {
              setNotice(null);
              setSelected(null);
            }}
            heightDp={buttonHeight}
            fontSize={fontSizes.button}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

function kindLabel(item: MediaItem): string {
  if (item.kind === "video") return T.gallery.video;
  if (item.kind === "audio") return T.gallery.audio;
  return T.gallery.photo;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontWeight: "800", color: COLORS.text, marginBottom: 12 },
  sectionTitle: { fontWeight: "700", color: COLORS.textMuted, marginTop: 20, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  cellImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  cellCaption: { backgroundColor: "rgba(255,255,255,0.88)", padding: 8 },
  fullImage: { width: "100%", height: "55%", marginBottom: 16, borderRadius: 12 },
  cellKind: { color: COLORS.primary, fontWeight: "700" },
  cellName: { color: COLORS.textMuted },
  empty: { color: COLORS.textMuted, lineHeight: 28 },
  modal: { flex: 1, backgroundColor: COLORS.background, padding: 20, justifyContent: "center" },
  meta: { color: COLORS.textMuted, marginBottom: 16 },
  notice: { color: COLORS.ok, fontWeight: "700", marginBottom: 12 },
});
