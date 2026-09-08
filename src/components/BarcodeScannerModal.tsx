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
  useWindowDimensions,
  Platform,
  Image,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { X, Scan, Zap, ZapOff, Camera, CheckCircle, Sparkles } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { scanTicketWithGeminiVision } from "../api/lotteryApi";
import { ActivityIndicator, Alert } from "react-native";
import { useLanguage } from "../context/LanguageContext";

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
  const { language, t } = useLanguage();
  const isMl = language === "ml";
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const scanBoxSize = Math.min(width * 0.72, height * (isLandscape ? 0.48 : 0.42), 290);

  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isAiScanning, setIsAiScanning] = useState(false);
  const cameraRef = useRef<any>(null);

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
            toValue: scanBoxSize - 8,
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
        ]),
      );
      animation.start();

      return () => animation.stop();
    }
  }, [visible, scanBoxSize]);

  const handleScan = (result: BarcodeScanningResult) => {
    if (scanned) return;
    const rawVal = result.data ? result.data.trim() : "";
    if (rawVal) {
      setScanned(true);
      onBarcodeScanned(rawVal, result.type);
    }
  };

  const handleAiPhotoScan = async () => {
    if (!cameraRef.current || isAiScanning) return;
    try {
      setIsAiScanning(true);
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (photo?.base64) {
        const res = await scanTicketWithGeminiVision(photo.base64);
        if (res.ticketNumber) {
          setScanned(true);
          onBarcodeScanned(res.ticketNumber, "gemini-ai");
        } else {
          Alert.alert(
            "Scan Notice",
            "Ticket digits could not be clearly recognized. Please ensure good lighting and try again."
          );
        }
      }
    } catch (e: any) {
      Alert.alert("AI Scan Notice", e.message || "Failed to analyze ticket with AI.");
    } finally {
      setIsAiScanning(false);
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
            <Text style={styles.headerTitle}>{t("scan_ticket_title")}</Text>
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
            <Text style={styles.permissionTitle}>{t("scan_ticket_title")}</Text>
            <Text style={styles.permissionSub}>
              {isMl
                ? "ലോട്ടറി ടിക്കറ്റിന്റെ ബാർകോഡിലേക്ക് ക്യാമറ തിരിക്കുക അല്ലെങ്കിൽ താഴെ നൽകിയിരിക്കുന്ന സാമ്പിളുകൾ ഉപയോഗിക്കുക:"
                : "Point camera at lottery ticket barcode or test scan sample barcodes below:"}
            </Text>
            <TouchableOpacity
              style={styles.grantBtn}
              onPress={requestPermission}
            >
              <Camera
                size={18}
                color={COLORS.white}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.grantBtnText}>
                {isMl ? "ക്യാമറ അനുമതി നൽകുക" : "Enable Live Camera Access"}
              </Text>
            </TouchableOpacity>

            <View
              style={{ marginTop: 24, width: "100%", paddingHorizontal: 20 }}
            >
              <Text
                style={{
                  color: COLORS.textMuted,
                  fontSize: 12,
                  fontWeight: "700",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {isMl ? "സാമ്പിൾ ബാർകോഡ് സിമുലേറ്റർ (തട്ടുക)" : "SAMPLE BARCODE SIMULATOR (TAP TO SCAN)"}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                {["BT 263322", "DF 319327", "SB 501348", "KN 987654"].map(
                  (sample) => (
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
                      <Text
                        style={{
                          color: COLORS.primary,
                          fontWeight: "800",
                          fontSize: 13,
                        }}
                      >
                        📷 {isMl ? "സ്‌കാൻ" : "Scan"} {sample}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
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
                  placeholder={isMl ? "ബാർകോഡ് നമ്പർ ടൈപ്പ് ചെയ്യുക..." : "Enter barcode text..."}
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
                  <Text
                    style={{
                      color: COLORS.white,
                      fontWeight: "800",
                      fontSize: 13,
                    }}
                  >
                    {t("scan")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
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
            />

            {/* Viewfinder Reticle Overlay positioned on top */}
            <View style={styles.overlay} pointerEvents="box-none">
              <View style={styles.overlayTop} />

              <View style={[styles.overlayMiddleRow, { height: scanBoxSize }]}>
                <View style={styles.overlaySide} />
                <View style={[styles.scanBox, { width: scanBoxSize, height: scanBoxSize }]}>
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
                      <Text style={styles.scannedText}>
                        {isMl ? "ബാർകോഡ് സ്‌കാൻ ചെയ്തു!" : "Barcode Scanned!"}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.overlaySide} />
              </View>

              <View style={styles.overlayBottom}>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    borderColor: "#38BDF8",
                    borderWidth: 1.5,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 22,
                    paddingVertical: 13,
                    borderRadius: 25,
                    marginBottom: 10,
                    shadowColor: "#0B3C5D",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 10,
                    elevation: 6,
                  }}
                  disabled={isAiScanning}
                  onPress={handleAiPhotoScan}
                >
                  {isAiScanning ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Sparkles size={18} color={COLORS.gold} />
                  )}
                  <Text
                    style={{
                      color: COLORS.white,
                      fontWeight: "900",
                      fontSize: 14,
                      letterSpacing: 0.3,
                    }}
                  >
                    {isAiScanning
                      ? (isMl ? "AI ടിക്കറ്റ് പരിശോധിക്കുന്നു..." : "AI Analyzing Ticket...")
                      : (isMl ? "📸 AI ഫോട്ടോ സ്‌കാൻ" : "📸 AI Smart Photo Scan")}
                  </Text>
                </TouchableOpacity>

                <View
                  style={{
                    backgroundColor: "rgba(11, 60, 93, 0.75)",
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    marginBottom: 10,
                  }}
                >
                  <Text style={styles.instructionSub}>
                    {isMl
                      ? "ടിക്കറ്റ് ബാർകോഡ് ചട്ടക്കൂടിനുള്ളിൽ വെക്കുക അല്ലെങ്കിൽ AI ഫോട്ടോ സ്‌കാൻ ഉപയോഗിക്കുക"
                      : "Align barcode in box, or tap AI Smart Photo Scan above"}
                  </Text>
                </View>
                {/* Lottery ticket barcode hint image */}
                <Image
                  source={require("../../assets/barcode_hint.png")}
                  style={styles.hintImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B3C5D",
  },
  header: {
    height: Platform.OS === "ios" ? 100 : 70,
    paddingTop: Platform.OS === "ios" ? 44 : 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0B3C5D",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
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
    fontWeight: "800",
  },
  torchBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  torchBtnActive: {
    backgroundColor: "rgba(234, 179, 8, 0.3)",
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },
  permissionTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "800",
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
    color: COLORS.textDark,
    fontSize: 16,
  },
  grantBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  grantBtnText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 15,
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(11, 60, 93, 0.55)",
  },
  overlayMiddleRow: {
    flexDirection: "row",
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(11, 60, 93, 0.55)",
  },
  scanBox: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  corner: {
    position: "absolute",
    width: 26,
    height: 26,
    borderColor: "#38BDF8",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: "#38BDF8",
    shadowColor: "#00D2FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  scannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 60, 93, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  scannedText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(11, 60, 93, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  instructionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  instructionSub: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  hintImage: {
    width: "82%",
    maxWidth: 340,
    height: 140,
    borderRadius: 10,
    opacity: 0.9,
  },
});
