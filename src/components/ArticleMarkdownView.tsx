import React, { useEffect, useMemo, useState } from "react";
import { Image, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Info, Lightbulb, TriangleAlert } from "lucide-react-native";
import { BlockNode, CalloutTone, InlineNode, parseMarkdown } from "../utils/articleMarkdown";
import { COLORS } from "../constants/colors";

const WEBSITE_URL = "https://www.keralalotteryresultstoday.in";

interface Props {
  markdown: string;
  /** Called for site-relative links (e.g. "/search") so the app can navigate in-app. */
  onInternalLink?: (path: string) => void;
}

const CALLOUTS: Record<CalloutTone, { bg: string; border: string; color: string; Icon: typeof Info }> = {
  tip: { bg: "#ECFDF5", border: "#A7F3D0", color: "#047857", Icon: Lightbulb },
  warning: { bg: "#FFFBEB", border: "#FDE68A", color: "#B45309", Icon: TriangleAlert },
  info: { bg: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8", Icon: Info },
};

const openExternal = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch (err: unknown) {
    console.warn("[ArticleMarkdownView] open link failed:", err instanceof Error ? err.message : String(err));
  }
};

/** Remote image that keeps its own aspect ratio (falls back to 16:9). */
const AutoImage = ({ uri, alt }: { uri: string; alt: string }) => {
  const [ratio, setRatio] = useState(16 / 9);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Image.getSize(
      uri,
      (w, h) => active && w > 0 && h > 0 && setRatio(w / h),
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, [uri]);

  if (failed) return null;
  return (
    <Image
      source={{ uri }}
      accessibilityLabel={alt}
      accessible
      style={[styles.image, { aspectRatio: ratio }]}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
};

export default function ArticleMarkdownView({ markdown, onInternalLink }: Props) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);

  const handleLink = (href: string) => {
    if (href.startsWith("#")) return; // in-page anchors: no-op on mobile
    if (href.startsWith("/")) {
      if (onInternalLink) onInternalLink(href);
      else openExternal(`${WEBSITE_URL}${href}`);
      return;
    }
    openExternal(href);
  };

  const renderInline = (nodes: InlineNode[], keyPrefix: string): React.ReactNode[] =>
    nodes.map((node, idx) => {
      const key = `${keyPrefix}-${idx}`;
      switch (node.type) {
        case "text":
          return node.text;
        case "bold":
          return (
            <Text key={key} style={styles.bold}>
              {renderInline(node.children, key)}
            </Text>
          );
        case "italic":
          return (
            <Text key={key} style={styles.italic}>
              {renderInline(node.children, key)}
            </Text>
          );
        case "code":
          return (
            <Text key={key} style={styles.inlineCode}>
              {node.text}
            </Text>
          );
        case "link":
          return (
            <Text key={key} style={styles.link} onPress={() => handleLink(node.href)} accessibilityRole="link">
              {renderInline(node.children, key)}
            </Text>
          );
        default:
          return null;
      }
    });

  const renderBlock = (block: BlockNode, idx: number): React.ReactNode => {
    const key = `b-${idx}`;
    switch (block.type) {
      case "heading":
        return (
          <Text key={key} style={[styles.heading, styles[`h${block.level}`]]} accessibilityRole="header">
            {renderInline(block.children, key)}
          </Text>
        );
      case "paragraph":
        return (
          <Text key={key} style={styles.paragraph}>
            {renderInline(block.children, key)}
          </Text>
        );
      case "list":
        return (
          <View key={key} style={styles.list}>
            {block.items.map((item, i) => (
              <View key={`${key}-${i}`} style={styles.listItem}>
                <Text style={styles.bullet}>{block.ordered ? `${i + 1}.` : "•"}</Text>
                <Text style={[styles.paragraph, styles.listText]}>{renderInline(item, `${key}-${i}`)}</Text>
              </View>
            ))}
          </View>
        );
      case "quote":
        return (
          <View key={key} style={styles.quote}>
            <Text style={[styles.paragraph, styles.italic, { marginBottom: 0 }]}>{renderInline(block.children, key)}</Text>
          </View>
        );
      case "callout": {
        const { bg, border, color, Icon } = CALLOUTS[block.tone];
        return (
          <View key={key} style={[styles.callout, { backgroundColor: bg, borderColor: border }]}>
            <Icon size={18} color={color} />
            <Text style={[styles.paragraph, { flex: 1, marginBottom: 0 }]}>{renderInline(block.children, key)}</Text>
          </View>
        );
      }
      case "image":
        return (
          <View key={key} style={styles.figure}>
            <AutoImage uri={block.src.startsWith("/") ? `${WEBSITE_URL}${block.src}` : block.src} alt={block.alt} />
            {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
          </View>
        );
      case "code":
        return (
          <ScrollView key={key} horizontal style={styles.codeBlock} showsHorizontalScrollIndicator={false}>
            <Text style={styles.codeText}>{block.text}</Text>
          </ScrollView>
        );
      case "table":
        return (
          <ScrollView key={key} horizontal style={styles.tableWrap} showsHorizontalScrollIndicator={false}>
            <View>
              <View style={[styles.tableRow, styles.tableHeader]}>
                {block.header.map((cell, c) => (
                  <Text key={c} style={[styles.tableCell, styles.bold]}>
                    {renderInline(cell, `${key}-h${c}`)}
                  </Text>
                ))}
              </View>
              {block.rows.map((row, r) => (
                <View key={r} style={styles.tableRow}>
                  {row.map((cell, c) => (
                    <Text key={c} style={styles.tableCell}>
                      {renderInline(cell, `${key}-${r}-${c}`)}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        );
      case "divider":
        return <View key={key} style={styles.divider} />;
      default:
        return null;
    }
  };

  return <View>{blocks.map(renderBlock)}</View>;
}

const styles = StyleSheet.create({
  heading: { color: COLORS.textDark, fontWeight: "800", marginTop: 22, marginBottom: 10 },
  h2: { fontSize: 21, lineHeight: 28 },
  h3: { fontSize: 18, lineHeight: 25 },
  h4: { fontSize: 16, lineHeight: 22 },
  paragraph: { fontSize: 16, lineHeight: 26, color: "#334155", marginBottom: 14 },
  bold: { fontWeight: "800", color: COLORS.textDark },
  italic: { fontStyle: "italic" },
  inlineCode: { fontFamily: "monospace", backgroundColor: "#F1F5F9", fontSize: 14 },
  link: { color: "#0B5CAD", fontWeight: "700", textDecorationLine: "underline" },
  list: { marginBottom: 12 },
  listItem: { flexDirection: "row", gap: 8, paddingRight: 8 },
  bullet: { fontSize: 16, lineHeight: 26, color: COLORS.primary, fontWeight: "800", minWidth: 18 },
  listText: { flex: 1, marginBottom: 6 },
  quote: { borderLeftWidth: 4, borderLeftColor: COLORS.primary, backgroundColor: "#F8FAFC", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginBottom: 14 },
  callout: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 14, alignItems: "flex-start" },
  figure: { marginBottom: 16 },
  image: { width: "100%", borderRadius: 12, backgroundColor: "#E2E8F0" },
  caption: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginTop: 6 },
  codeBlock: { backgroundColor: "#0F172A", borderRadius: 12, padding: 14, marginBottom: 14 },
  codeText: { fontFamily: "monospace", color: "#E2E8F0", fontSize: 13 },
  tableWrap: { marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableHeader: { backgroundColor: "#F8FAFC" },
  tableCell: { width: 140, padding: 10, fontSize: 14, color: "#334155" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
});
