import React, { useEffect, useState } from "react";
import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface AutoSizedImageProps {
  uri: string;
  alt: string;
  style?: StyleProp<ViewStyle>;
  /**
   * Narrowest width/height ratio to display (e.g. 0.8 = at most 25% taller than wide).
   * Taller images are letterboxed ("contain") instead of cropped, so nothing is cut off.
   */
  minRatio?: number;
  onFailed?: () => void;
}

/**
 * Remote image shown at its natural aspect ratio (measured with Image.getSize) — never cropped.
 * Falls back to 16:9 until the size is known; renders nothing if the image fails to load.
 */
export default function AutoSizedImage({ uri, alt, style, minRatio = 0, onFailed }: AutoSizedImageProps) {
  const [naturalRatio, setNaturalRatio] = useState(16 / 9);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Image.getSize(
      uri,
      (w, h) => {
        if (active && w > 0 && h > 0) setNaturalRatio(w / h);
      },
      () => {
        if (!active) return;
        setFailed(true);
        onFailed?.();
      },
    );
    return () => {
      active = false;
    };
  }, [uri, onFailed]);

  if (failed) return null;

  const ratio = Math.max(naturalRatio, minRatio);
  const isClamped = ratio !== naturalRatio;

  return (
    <View style={[styles.frame, { aspectRatio: ratio }, isClamped && styles.letterbox, style]}>
      <Image
        source={{ uri }}
        accessibilityLabel={alt}
        accessible
        style={StyleSheet.absoluteFill}
        resizeMode={isClamped ? "contain" : "cover"}
        onError={() => {
          setFailed(true);
          onFailed?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", overflow: "hidden", backgroundColor: "#E2E8F0" },
  letterbox: { backgroundColor: "#0F172A" },
});
