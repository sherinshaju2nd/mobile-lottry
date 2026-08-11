import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

interface CameraScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (ticketNumbers: string[]) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FINDER_WIDTH = SCREEN_WIDTH * 0.85;
const FINDER_HEIGHT = 120;

export default function CameraScannerModal({
  visible,
  onClose,
  onScanSuccess,
}: CameraScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!visible) return null;

  if (!permission) {
    return <View />;
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error("Failed to capture image");
      }

      // 2. Crop/Resize the image to speed up upload & focus OCR on target box
      // Target box location in screen space is roughly:
      // X: (SCREEN_WIDTH - FINDER_WIDTH) / 2
      // Y: (SCREEN_HEIGHT - FINDER_HEIGHT) / 2
      const cropXFraction = (SCREEN_WIDTH - FINDER_WIDTH) / 2 / SCREEN_WIDTH;
      const cropYFraction = (SCREEN_HEIGHT - FINDER_HEIGHT) / 2 / SCREEN_HEIGHT;
      const cropWidthFraction = FINDER_WIDTH / SCREEN_WIDTH;
      const cropHeightFraction = FINDER_HEIGHT / SCREEN_HEIGHT;

      // Crop actions: Resize image to standardized width 1080px first
      const resizedWidth = 1080;
      // Aspect ratio of the original photo
      const imageAspectRatio = photo.width ? photo.height / photo.width : 1.33;
      const resizedHeight = resizedWidth * imageAspectRatio;

      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            resize: {
              width: resizedWidth,
              height: resizedHeight,
            },
          },
          {
            crop: {
              originX: Math.floor(resizedWidth * cropXFraction),
              originY: Math.floor(resizedHeight * cropYFraction),
              width: Math.floor(resizedWidth * cropWidthFraction),
              height: Math.floor(resizedHeight * cropHeightFraction),
            },
          },
        ],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipResult.base64) {
        throw new Error("Failed to encode cropped image to base64");
      }

      // 3. Send base64 to Next.js API OCR endpoint
      // Fallback to local network IP for testing on physical devices (edit this URL or use process.env)
      const backendUrl =
        process.env.EXPO_PUBLIC_OCR_API_URL ||
        (Platform.OS === "android"
          ? "http://10.0.2.2:3000"
          : "http://localhost:3000");

      console.log(`Sending image to OCR: ${backendUrl}/api/ocr`);

      const response = await fetch(`${backendUrl}/api/ocr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: manipResult.base64 }),
      });

      const data = await response.json();

      if (data.success && data.tickets && data.tickets.length > 0) {
        onScanSuccess(data.tickets);
        onClose();
      } else {
        setErrorMsg(
          data.error || "No ticket numbers detected. Please align properly."
        );
      }
    } catch (e: any) {
      console.warn("Capture/OCR Error:", e);
      setErrorMsg(e.message || "Network error. Make sure backend is running.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {!permission.granted ? (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.permissionText}>
              We need access to your camera to scan your lottery tickets.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={requestPermission}
            >
              <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            ref={cameraRef}
            facing="back"
          >
            {/* Viewfinder Cutout Overlay */}
            <View style={styles.overlay}>
              <View style={styles.topMask} />
              <View style={styles.middleRow}>
                <View style={styles.sideMask} />
                <View style={styles.finder}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                  <Text style={styles.finderText}>ALIGN TICKET NUMBER HERE</Text>
                </View>
                <View style={styles.sideMask} />
              </View>
              <View style={styles.bottomMask}>
                {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
                {isProcessing ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color={COLORS.white} />
                    <Text style={styles.processingText}>Processing ticket...</Text>
                  </View>
                ) : (
                  <View style={styles.controlsRow}>
                    <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
                      <Ionicons name="close-circle" size={48} color={COLORS.white} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
                      <View style={styles.captureBtnInner} />
                    </TouchableOpacity>

                    <View style={{ width: 48 }} />
                  </View>
                )}
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
    backgroundColor: COLORS.textDark,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.textDark,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  permissionBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  overlay: {
    flex: 1,
  },
  topMask: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  middleRow: {
    height: FINDER_HEIGHT,
    flexDirection: "row",
  },
  sideMask: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  finder: {
    width: FINDER_WIDTH,
    height: FINDER_HEIGHT,
    borderColor: "rgba(255,255,255,0.4)",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  finderText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomMask: {
    flex: 1.5,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  processingContainer: {
    alignItems: "center",
  },
  processingText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "80%",
  },
  closeIconBtn: {
    opacity: 0.8,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
  },
});
