import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import {
  X,
  Scan,
  Zap,
  ZapOff,
  Camera,
  CheckCircle,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";

const { width } = Dimensions.get("window");
const SCAN_BOX_SIZE = width * 0.75;

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (scannedValue: string, barcodeType?: string) => void;
}

export default function BarcodeScannerModal({
  visible,
  onClose,
  onBarcodeScanned,
}: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");

  // Laser animation line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setTorchOn(false);
      setManualCode("");

      if (!permission || !permission.granted) {
        requestPermission();
      }

      // Start laser scan line animation loop
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: SCAN_BOX_SIZE - 8,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();

      return () => animation.stop();
    }
  }, [visible]);

  const handleScan = (result: BarcodeScanningResult) => {
    if (scanned) return;
    const rawVal = result.data ? result.data.trim() : "";
    if (rawVal) {
      setScanned(true);
      onBarcodeScanned(rawVal, result.type);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header Overlay */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={26} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Scan size={20} color={COLORS.gold} />
            <Text style={styles.headerTitle}>Barcode Ticket Reader</Text>
          </View>
          <TouchableOpacity
            style={[styles.torchBtn, torchOn && styles.torchBtnActive]}
            onPress={() => setTorchOn(!torchOn)}
          >
            {torchOn ? (
              <Zap size={22} color={COLORS.gold} />
            ) : (
              <ZapOff size={22} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* Camera View or Permission Prompt / Web Simulator */}
        {!permission || !permission.granted ? (
          <View style={styles.centerContainer}>
            <Scan size={64} color={COLORS.primary} />
            <Text style={styles.permissionTitle}>Barcode Camera Reader</Text>
            <Text style={styles.permissionSub}>
              Point camera at lottery ticket barcode or test scan sample barcodes below:
            </Text>
            <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
              <Camera size={18} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.grantBtnText}>Enable Live Camera Access</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 24, width: "100%", paddingHorizontal: 20 }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>
                SAMPLE BARCODE SIMULATOR (TAP TO SCAN)
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {["BT 263322", "DF 319327", "SB 501348", "KN 987654"].map((sample) => (
                  <TouchableOpacity
                    key={sample}
                    style={{
                      backgroundColor: COLORS.primaryLight,
                      borderColor: COLORS.primary,
                      borderWidth: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                    onPress={() => onBarcodeScanned(sample, "code128")}
                  >
                    <Text style={{ color: COLORS.primary, fontWeight: "800", fontSize: 13 }}>
                      📷 Scan {sample}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                <TextInput
                  style={{
                    flex: 1,
                    height: 42,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    color: COLORS.textDark,
                    backgroundColor: COLORS.cardBg,
                    fontSize: 13,
                  }}
                  placeholder="Enter barcode text..."
                  placeholderTextColor={COLORS.textLight}
                  value={manualCode}
                  onChangeText={setManualCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    paddingHorizontal: 16,
                    height: 42,
                    borderRadius: 8,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => {
                    if (manualCode.trim()) {
                      onBarcodeScanned(manualCode.trim(), "manual");
                    }
                  }}
                >
                  <Text style={{ color: COLORS.white, fontWeight: "800", fontSize: 13 }}>Scan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            enableTorch={torchOn}
            barcodeScannerSettings={{
              barcodeTypes: [
                "code128",
                "code39",
                "code93",
                "ean13",
                "ean8",
                "upc_a",
                "upc_e",
                "itf14",
                "codabar",
              ],
            }}
            onBarcodeScanned={scanned ? undefined : handleScan}
          >
            {/* Viewfinder Reticle Overlay */}
            <View style={styles.overlay}>
              <View style={styles.overlayTop} />
              
              <View style={styles.overlayMiddleRow}>
                <View style={styles.overlaySide} />
                <View style={styles.scanBox}>
                  {/* Four Corner Accents */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {/* Animated Laser Beam */}
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [{ translateY: scanLineAnim }],
                      },
                    ]}
                  />

                  {scanned && (
                    <View style={styles.scannedOverlay}>
                      <CheckCircle size={48} color={COLORS.successText} />
                      <Text style={styles.scannedText}>Barcode Scanned!</Text>
                    </View>
                  )}
                </View>
                <View style={styles.overlaySide} />
              </View>

              <View style={styles.overlayBottom}>
                <Text style={styles.instructionTitle}>Position Barcode Inside Box</Text>
                <Text style={styles.instructionSub}>
                  Hold ticket steady • Barcode scanning only
                </Text>
              </View>
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    height: Platform.OS === "ios" ? 100 : 70,
    paddingTop: Platform.OS === "ios" ? 44 : 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 10,
  },
  closeBtn: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
  },
  torchBtn: {
    padding: 8,
    borderRadius: 20,
  },
  torchBtnActive: {
    backgroundColor: "rgba(234, 179, 8, 0.2)",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#111827",
  },
  permissionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSub: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionText: {
    color: COLORS.white,
    fontSize: 16,
  },
  grantBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  grantBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  overlayMiddleRow: {
    flexDirection: "row",
    height: SCAN_BOX_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  scanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: COLORS.gold,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },
  scannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  scannedText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  instructionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  instructionSub: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: "600",
  },
});
