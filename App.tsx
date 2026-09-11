import React, { useEffect, useCallback, useRef, useState } from "react";
import { View, Text, Animated, Easing, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Ticket, Search as SearchIcon, Calendar as CalendarIcon, Camera, BarChart3 } from "lucide-react-native";
import * as SplashScreen from "expo-splash-screen";
import { Asset } from "expo-asset";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

import HomeScreen from "./src/screens/HomeScreen";
import LotteriesScreen from "./src/screens/LotteriesScreen";
import SearchScreen from "./src/screens/SearchScreen";
import LotteryArchiveScreen from "./src/screens/LotteryArchiveScreen";
import DrawBreakdownScreen from "./src/screens/DrawBreakdownScreen";
import RemindersScreen from "./src/screens/RemindersScreen";
import ContactScreen from "./src/screens/ContactScreen";
import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import ModernDatePickerModal from "./src/components/ModernDatePickerModal";
import { fetchDrawResultByAnyDate } from "./src/api/lotteryApi";
import { ScannerProvider, useScanner } from "./src/context/ScannerContext";
import { LanguageProvider, useLanguage } from "./src/context/LanguageContext";
import LanguageSelectionModal from "./src/components/LanguageSelectionModal";
import PrivacyConsentModal from "./src/components/PrivacyConsentModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { LogBox } from "react-native";
import { COLORS } from "./src/constants/colors";
import { triggerLightHaptic } from "./src/utils/haptics";
// Suppress benign Expo Go development sandbox notices from terminal output and UI
LogBox.ignoreLogs([
  "Android Push notifications",
  "expo-notifications",
  "`expo-notifications` functionality is not fully supported in Expo Go",
]);

if (__DEV__) {
  const _warn = console.warn;
  console.warn = (...args) => {
    const text = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a) || "")).join(" ");
    if (
      text.includes("expo-notifications") ||
      text.includes("Android Push notifications") ||
      text.includes("Use a development build instead of Expo Go") ||
      text.includes("not fully supported in Expo Go")
    ) {
      return;
    }
    _warn(...args);
  };
}

// Configure foreground notification display
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ScanTabButton() {
  return null;
}

function CalendarTabDummy() {
  return null;
}

function AnimatedScanButton({ onPress }: { onPress: () => void }) {
  const { t } = useLanguage();
  const isAndroid = Platform.OS === "android";
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim]);

  const handlePress = () => {
    triggerLightHaptic();
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.85,
        useNativeDriver: true,
        friction: 4,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.08,
        useNativeDriver: true,
        friction: 3,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onPress();
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.55, 0.25, 0],
  });

  return (
    <View style={tabStyles.tabCell}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={[
          tabStyles.scanButtonContainer,
          isAndroid ? tabStyles.scanButtonContainerAndroid : tabStyles.scanButtonContainerIOS,
        ]}
      >
        <Animated.View
          style={[
            tabStyles.pulseRing,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />

        <Animated.View
          style={[
            tabStyles.scanButtonInner,
            isAndroid ? tabStyles.scanButtonInnerAndroid : tabStyles.scanButtonInnerIOS,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Camera size={23} color={COLORS.white} strokeWidth={2.2} />
        </Animated.View>
      </TouchableOpacity>
      <Text
        style={[
          tabStyles.tabLabelText,
          isAndroid && { fontWeight: "800", fontSize: 10.5 },
        ]}
      >
        {t("tab_scan")}
      </Text>
    </View>
  );
}

function AnimatedTabIcon({
  IconComponent,
  color,
  focused,
  size,
}: {
  IconComponent: any;
  color: string;
  focused: boolean;
  size: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isAndroid = Platform.OS === "android";

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: isAndroid ? 1.08 : 1.2,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [focused, scaleAnim, isAndroid]);

  if (isAndroid) {
    // Material Design 3 Active Pill Container
    return (
      <View
        style={[
          tabStyles.androidIconContainer,
          focused && tabStyles.androidActivePill,
        ]}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <IconComponent
            size={size}
            color={focused ? COLORS.primary : color}
            strokeWidth={focused ? 2.4 : 2}
          />
        </Animated.View>
      </View>
    );
  }

  // iOS Cupertino Style with Micro-Bounce & Subtle Glow
  return (
    <View style={tabStyles.iosIconContainer}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <IconComponent
          size={size}
          color={color}
          strokeWidth={focused ? 2.4 : 1.8}
        />
      </Animated.View>
      {focused && <View style={tabStyles.iosActiveDot} />}
    </View>
  );
}

function BottomTabNavigator({ navigation }: any) {
  const { openScanner } = useScanner();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const handleDateSelected = async (dateStr: string | null) => {
    setIsDatePickerOpen(false);
    if (!dateStr) return;
    try {
      const draw = await fetchDrawResultByAnyDate(dateStr);
      const codeToUse = draw?.lottery_code || "BT";
      navigation.navigate("DrawBreakdown", { code: codeToUse, date: dateStr });
    } catch {
      navigation.navigate("DrawBreakdown", { code: "BT", date: dateStr });
    }
  };

  return (
    <>
      <Tab.Navigator
        screenListeners={{
          tabPress: () => {
            triggerLightHaptic();
          },
        }}
        screenOptions={({ route }: { route: { name: string } }) => {
          const isIOS = Platform.OS === "ios";
          return {
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: isIOS ? "#8E8E93" : "#64748B",
            tabBarStyle: isIOS
              ? {
                  backgroundColor: "rgba(255, 255, 255, 0.94)",
                  borderTopColor: "rgba(0, 0, 0, 0.08)",
                  borderTopWidth: 0.5,
                  height: (language === "ml" ? 54 : 58) + (insets.bottom > 0 ? insets.bottom : 20),
                  paddingBottom: (language === "ml" ? 4 : 6) + (insets.bottom > 0 ? insets.bottom - 4 : 12),
                  paddingTop: language === "ml" ? 4 : 6,
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: -3 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                }
              : {
                  backgroundColor: "#FFFFFF",
                  borderTopColor: "#E2E8F0",
                  borderTopWidth: 1,
                  height: (language === "ml" ? 60 : 66) + (insets.bottom > 0 ? insets.bottom : 6),
                  paddingBottom: (language === "ml" ? 4 : 6) + (insets.bottom > 0 ? insets.bottom : 6),
                  paddingTop: language === "ml" ? 5 : 7,
                  elevation: 12,
                },
            tabBarLabelStyle: {
              fontSize: language === "ml" ? (isIOS ? 9 : 9.5) : (isIOS ? 10 : 10.5),
              fontWeight: isIOS ? "600" : "800",
              letterSpacing: isIOS ? -0.1 : 0.2,
              marginTop: isIOS ? 1 : 2,
            },
            tabBarItemStyle: {
              paddingVertical: 2,
            },
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => {
              const iconSize = language === "ml" ? (isIOS ? 18 : 19) : (isIOS ? 21 : 22);
              let IconComp: any = Home;
              if (route.name === "HomeTab") IconComp = Home;
              else if (route.name === "LotteriesTab") IconComp = Ticket;
              else if (route.name === "AnalyticsTab") IconComp = BarChart3;
              else if (route.name === "DateTab") IconComp = CalendarIcon;

              return (
                <AnimatedTabIcon
                  IconComponent={IconComp}
                  color={color}
                  focused={focused}
                  size={iconSize}
                />
              );
            },
          };
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{ tabBarLabel: t("tab_home") }}
        />
        <Tab.Screen
          name="LotteriesTab"
          component={LotteriesScreen}
          options={{ tabBarLabel: t("tab_lotteries") }}
        />
        <Tab.Screen
          name="ScanTab"
          component={ScanTabButton}
          options={{
            tabBarLabel: t("tab_scan"),
            tabBarButton: () => (
              <AnimatedScanButton onPress={() => openScanner()} />
            ),
          }}
        />
        <Tab.Screen
          name="AnalyticsTab"
          component={AnalyticsScreen}
          options={{ tabBarLabel: t("tab_analytics") }}
        />
        <Tab.Screen
          name="DateTab"
          component={CalendarTabDummy}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setIsDatePickerOpen(true);
            },
          }}
          options={{ tabBarLabel: t("tab_date") }}
        />
      </Tab.Navigator>

      <ModernDatePickerModal
        visible={isDatePickerOpen}
        selectedDate={null}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={handleDateSelected}
      />
    </>
  );
}

const tabStyles = StyleSheet.create({
  tabCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
    width: 54,
    height: 54,
  },
  scanButtonContainerIOS: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  scanButtonContainerAndroid: {
    elevation: 8,
  },
  pulseRing: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
  },
  scanButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButtonInnerIOS: {
    borderWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  scanButtonInnerAndroid: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 6,
  },
  tabLabelText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 2,
  },
  androidIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
  },
  androidActivePill: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
  },
  iosIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iosActiveDot: {
    position: "absolute",
    bottom: -5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});

import InAppNotificationToast from "./src/components/InAppNotificationToast";

function AppContent() {
  const [isPrivacyAccepted, setIsPrivacyAccepted] = useState<boolean | null>(null);
  const [inAppNotif, setInAppNotif] = useState<{
    visible: boolean;
    title: string;
    body: string;
  }>({ visible: false, title: "", body: "" });
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    let responseSub: any = null;
    let receiveSub: any = null;

    try {
      // Request notification permission early
      Notifications.requestPermissionsAsync().catch(() => {});

      // Setup Android Notification Channel (Required for Android 8.0+)
      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "Lottery Draw Alerts",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#0B3C5D",
          sound: "default",
        }).catch(() => {});
      }

      // Handle tapping a notification from system tray → go to Reminders
      responseSub = Notifications.addNotificationResponseReceivedListener(() => {
        navigationRef.current?.navigate("Reminders");
      });

      // Handle foreground notification receipt → show sleek in-app toast
      receiveSub = Notifications.addNotificationReceivedListener((notification) => {
        setInAppNotif({
          visible: true,
          title: notification.request.content.title || "🎰 Kerala Lottery Update",
          body: notification.request.content.body || "New draw alert!",
        });
      });
    } catch {}

    async function loadAssetsAndCheckPrivacy() {
      try {
        await Asset.loadAsync([
          require("./assets/icon.png"),
          require("./assets/adaptive-icon.png"),
        ]);
        const accepted = await AsyncStorage.getItem("privacy_consent_accepted");
        setIsPrivacyAccepted(accepted === "true");
      } catch (e) {
        console.warn("Asset caching/privacy load error:", e);
        setIsPrivacyAccepted(false);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    loadAssetsAndCheckPrivacy();

    return () => {
      responseSub?.remove?.();
      receiveSub?.remove?.();
    };
  }, []);

  const handleAcceptPrivacy = async () => {
    try {
      await AsyncStorage.setItem("privacy_consent_accepted", "true");
      setIsPrivacyAccepted(true);
    } catch (e) {
      console.warn("Error setting privacy consent:", e);
      setIsPrivacyAccepted(true);
    }
  };

  if (isPrivacyAccepted === null) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <InAppNotificationToast
        visible={inAppNotif.visible}
        title={inAppNotif.title}
        body={inAppNotif.body}
        onPress={() => navigationRef.current?.navigate("Reminders")}
        onDismiss={() => setInAppNotif((prev) => ({ ...prev, visible: false }))}
      />
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          <Stack.Screen name="LotteryArchive" component={LotteryArchiveScreen} />
          <Stack.Screen name="DrawBreakdown" component={DrawBreakdownScreen} />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Checker" component={SearchScreen} />
          <Stack.Screen name="Contact" component={ContactScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      {isPrivacyAccepted ? (
        <LanguageSelectionModal />
      ) : (
        <PrivacyConsentModal onAccept={handleAcceptPrivacy} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ScannerProvider>
          <AppContent />
        </ScannerProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
