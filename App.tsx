import React, { useEffect, useCallback, useRef, useState } from "react";
import { View, Text, Animated, Easing, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Ticket, Search as SearchIcon, Calendar as CalendarIcon, Camera } from "lucide-react-native";
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
import ModernDatePickerModal from "./src/components/ModernDatePickerModal";
import { fetchDrawResultByAnyDate } from "./src/api/lotteryApi";
import { ScannerProvider, useScanner } from "./src/context/ScannerContext";
import { LanguageProvider, useLanguage } from "./src/context/LanguageContext";
import LanguageSelectionModal from "./src/components/LanguageSelectionModal";
import PrivacyConsentModal from "./src/components/PrivacyConsentModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { COLORS } from "./src/constants/colors";

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
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.84,
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
        style={tabStyles.scanButtonContainer}
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
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Camera size={24} color={COLORS.white} />
        </Animated.View>
      </TouchableOpacity>
      <Text style={tabStyles.tabLabelText}>{t("tab_scan")}</Text>
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

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.25,
          duration: 130,
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
  }, [focused, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <IconComponent size={size} color={color} />
    </Animated.View>
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
        screenOptions={({ route }: { route: { name: string } }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopColor: COLORS.border,
            height: (language === "ml" ? 52 : 58) + (insets.bottom > 0 ? insets.bottom - 4 : 0),
            paddingBottom: (language === "ml" ? 3 : 6) + (insets.bottom > 0 ? insets.bottom - 6 : 0),
            paddingTop: language === "ml" ? 3 : 5,
          },
          tabBarLabelStyle: {
            fontSize: language === "ml" ? 9.5 : 11,
            fontWeight: "700",
          },
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => {
            const iconSize = language === "ml" ? 18 : 22;
            let IconComp: any = Home;
            if (route.name === "HomeTab") IconComp = Home;
            else if (route.name === "LotteriesTab") IconComp = Ticket;
            else if (route.name === "SearchTab") IconComp = SearchIcon;
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
        })}
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
          name="SearchTab"
          component={SearchScreen}
          options={{ tabBarLabel: t("tab_checker") }}
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
    marginTop: -18,
    width: 52,
    height: 52,
  },
  pulseRing: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
  },
  scanButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 2,
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
