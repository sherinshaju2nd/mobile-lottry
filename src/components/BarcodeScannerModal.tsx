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
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import {
  X,
  Scan,
  Zap,
  ZapOff,
  Camera,
  CheckCircle,
  Sparkles,
  Flashlight,
  ChevronRight,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { scanTicketWithGeminiVision } from "../api/lotteryApi";
import { useLanguage } from "../context/LanguageContext";
import { triggerSuccessHaptic, triggerLightHaptic } from "../utils/haptics";

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
  const scanBoxSize = Math.min(
    width * 0.74,
    height * (isLandscape ? 0.46 : 0.38),
    280,
  );

  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isAiScanning, setIsAiScanning] = useState(false);
  const cameraRef = useRef<any>(null);

  // Animated laser line value
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setManualCode("");
      setIsAiScanning(false);

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
      triggerSuccessHaptic();
      setScanned(true);
      onBarcodeScanned(rawVal, result.type);
    }
  };

  const handleAiPhotoScan = async () => {
    if (!cameraRef.current || isAiScanning) return;
    try {
      triggerLightHaptic();
      setIsAiScanning(true);
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (photo?.base64) {
        const res = await scanTicketWithGeminiVision(photo.base64);
        if (res.ticketNumber) {
          triggerSuccessHaptic();
          setScanned(true);
          onBarcodeScanned(res.ticketNumber, "gemini-ai");
        } else {
          Alert.alert(
            "Scan Notice",
            "Ticket digits could not be clearly recognized. Please ensure good lighting and try again.",
          );
        }
      }
    } catch (e: any) {
      Alert.alert(
        "AI Scan Notice",
        e.message || "Failed to analyze ticket with AI.",
      );
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
        {/* Top Header Overlay */}
        <View style={styles.header}>
          {/* Close Button (Circular Translucent) */}
          <TouchableOpacity
            style={styles.circleHeaderBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Header Title & Subtitle */}
          <View style={styles.headerCenter}>
            <Scan size={18} color="#00E5FF" style={{ marginBottom: 3 }} />
            <Text style={styles.headerTitle}>{t("scan_ticket_title")}</Text>
            <Text style={styles.headerSubtitle}>
              SCAN • CHECK • GET RESULTS
            </Text>
          </View>

          {/* Flashlight Button (Circular Translucent) */}
          <TouchableOpacity
            style={[
              styles.circleHeaderBtn,
              torchOn && styles.circleHeaderBtnActive,
            ]}
            onPress={() => {
              triggerLightHaptic();
              setTorchOn(!torchOn);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {torchOn ? (
              <Zap size={20} color="#0F172A" />
            ) : (
              <ZapOff size={20} color="#FFFFFF" />
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
                {isMl
                  ? "സാമ്പിൾ ബാർകോഡ് സിമുലേറ്റർ (തട്ടുക)"
                  : "SAMPLE BARCODE SIMULATOR (TAP TO SCAN)"}
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
                  placeholder={
                    isMl
                      ? "ബാർകോഡ് നമ്പർ ടൈപ്പ് ചെയ്യുക..."
                      : "Enter barcode text..."
                  }
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
              style={StyleSheet.absoluteFill}
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

            {/* Viewfinder Reticle Overlay */}
            <View style={styles.overlayTop} />

            <View style={[styles.overlayMiddleRow, { height: scanBoxSize }]}>
              <View style={styles.overlaySide} />
              <View
                style={[
                  styles.scanBox,
                  { width: scanBoxSize, height: scanBoxSize },
                ]}
              >
                {/* Four Cyan Rounded Corner Accents */}
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
                    <CheckCircle size={48} color="#22C55E" />
                    <Text style={styles.scannedText}>
                      {isMl ? "ബാർകോഡ് സ്‌കാൻ ചെയ്തു!" : "Barcode Scanned!"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.overlaySide} />
            </View>

            {/* Bottom Controls Area (Matching Image 2) */}
            <View style={styles.overlayBottom}>
              {/* 1. Translucent Hint Pill */}
              <View style={styles.instructionPill}>
                <Text style={styles.instructionPillText}>
                  {isMl
                    ? "ടിക്കറ്റ് ബാർകോഡ് ചട്ടക്കൂടിനുള്ളിൽ വെക്കുക"
                    : "Align the barcode inside the frame"}
                </Text>
              </View>

              {/* 2. Primary Vibrant AI Smart Photo Scan Button */}
              <TouchableOpacity
                style={styles.aiSmartScanBtn}
                activeOpacity={0.85}
                disabled={isAiScanning}
                onPress={handleAiPhotoScan}
              >
                {isAiScanning ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                    style={{ marginRight: 10 }}
                  />
                ) : (
                  <View style={styles.aiBtnIconBg}>
                    <Sparkles size={16} color="#0084FF" />
                  </View>
                )}

                <View style={styles.aiBtnTextWrap}>
                  <Text style={styles.aiSmartScanBtnText} numberOfLines={1}>
                    {isAiScanning
                      ? t("ai_analyzing_ticket")
                      : t("ai_photo_scan_btn")}
                  </Text>
                  {!isAiScanning && (
                    <Text
                      style={styles.aiSmartScanBtnSubText}
                      numberOfLines={1}
                    >
                      {t("ai_scan_hint")}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* 3. Secondary Flashlight Toggle Pill */}
              <TouchableOpacity
                style={[
                  styles.flashlightPillBtn,
                  torchOn && styles.flashlightPillBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  triggerLightHaptic();
                  setTorchOn(!torchOn);
                }}
              >
                <Flashlight size={16} color={torchOn ? "#FACC15" : "#FFFFFF"} />
                <View style={styles.flashlightDivider} />
                <Text
                  style={[
                    styles.flashlightPillText,
                    torchOn && { color: "#FEF08A" },
                  ]}
                >
                  {torchOn
                    ? isMl
                      ? "Flashlight Off"
                      : "Flashlight Off"
                    : isMl
                      ? "Flashlight On"
                      : "Flashlight On"}
                </Text>
              </TouchableOpacity>

              {/* 4. Bottom Divider: "SCAN THIS BARCODE" */}
              <View style={styles.barcodeDividerRow}>
                <View style={styles.barcodeDividerLine} />
                <Text style={styles.barcodeDividerText}>
                  {isMl ? "ഈ ബാർകോഡ് സ്‌കാൻ ചെയ്യുക" : "SCAN THIS BARCODE"}
                </Text>
                <View style={styles.barcodeDividerLine} />
              </View>

              {/* 5. Clean Barcode Sample Card with Cyan Corner Accents */}
              <View style={styles.sampleBarcodeWrapper}>
                <View style={[styles.sampleCorner, styles.sampleCornerTL]} />
                <View style={[styles.sampleCorner, styles.sampleCornerTR]} />
                <View style={[styles.sampleCorner, styles.sampleCornerBL]} />
                <View style={[styles.sampleCorner, styles.sampleCornerBR]} />

                <View style={styles.barcodeCard}>
                  <View style={styles.barcodeBarsRow}>
                    {[
                      3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 2, 4, 1, 3,
                      1, 2, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3,
                    ].map((w, idx) => (
                      <View
                        key={idx}
                        style={{
                          width: w,
                          height: 24,
                          backgroundColor:
                            idx % 2 === 0 ? "#0F172A" : "transparent",
                          marginRight: 1,
                        }}
                      />
                    ))}
                  </View>
                  <Text style={styles.sampleBarcodeCode}>EIH24US5NXQER09</Text>
                </View>
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
    backgroundColor: "#070B14",
  },
  header: {
    height: Platform.OS === "ios" ? 104 : 76,
    paddingTop: Platform.OS === "ios" ? 44 : 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(7, 11, 20, 0.92)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    zIndex: 20,
  },
  circleHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleHeaderBtnActive: {
    backgroundColor: "#FACC15",
  },
  headerCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginTop: 2,
    textTransform: "uppercase",
  },

  /* Center Container (Permissions) */
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

  /* Camera & Viewfinder Overlay */
  cameraContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#000000",
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(7, 11, 20, 0.68)",
  },
  overlayMiddleRow: {
    flexDirection: "row",
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(7, 11, 20, 0.68)",
  },
  scanBox: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#00E5FF",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    height: 2.5,
    backgroundColor: "#00E5FF",
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  scannedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(7, 11, 20, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  scannedText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },

  /* Overlay Bottom Controls (Image 2) */
  overlayBottom: {
    flex: 1.4,
    backgroundColor: "rgba(7, 11, 20, 0.72)",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },

  /* 1. Instruction Pill */
  instructionPill: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginBottom: 14,
  },
  instructionPillText: {
    color: "#E2E8F0",
    fontSize: 12.5,
    fontWeight: "600",
    textAlign: "center",
  },

  /* 2. AI Smart Photo Scan Radiant Button */
  aiSmartScanBtn: {
    width: "100%",
    maxWidth: 350,
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: "#0084FF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: "#0084FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
  },
  aiBtnIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  aiBtnTextWrap: {
    flex: 1,
    justifyContent: "center",
  },
  aiSmartScanBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  aiSmartScanBtnSubText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 1,
  },
  aiSmartScanChevron: {
    marginLeft: 6,
  },

  /* 3. Flashlight Pill Button */
  flashlightPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  flashlightPillBtnActive: {
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderColor: "#FACC15",
  },
  flashlightDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 10,
  },
  flashlightPillText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },

  /* 4. Barcode Divider */
  barcodeDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 350,
    marginBottom: 12,
  },
  barcodeDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  barcodeDividerText: {
    paddingHorizontal: 12,
    color: "#94A3B8",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  /* 5. Barcode Sample Card & Cyan Frame */
  sampleBarcodeWrapper: {
    position: "relative",
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  sampleCorner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: "#00E5FF",
  },
  sampleCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 6,
  },
  sampleCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 6,
  },
  sampleCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 6,
  },
  sampleCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 6,
  },
  barcodeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 170,
  },
  barcodeBarsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 24,
    marginBottom: 3,
  },
  sampleBarcodeCode: {
    color: "#0F172A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});
