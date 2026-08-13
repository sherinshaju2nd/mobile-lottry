import React, { useEffect, useCallback, useRef } from "react";
import { View, Text, Animated, Easing, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Ticket, Search as SearchIcon, Calendar as CalendarIcon, Camera } from "lucide-react-native";
import * as SplashScreen from "expo-splash-screen";
import { Asset } from "expo-asset";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

import HomeScreen from "./src/screens/HomeScreen";
import LotteriesScreen from "./src/screens/LotteriesScreen";
import SearchScreen from "./src/screens/SearchScreen";
import LotteryArchiveScreen from "./src/screens/LotteryArchiveScreen";
import DrawBreakdownScreen from "./src/screens/DrawBreakdownScreen";
import ModernDatePickerModal from "./src/components/ModernDatePickerModal";
import { fetchDrawResultByAnyDate } from "./src/api/lotteryApi";
import { ScannerProvider, useScanner } from "./src/context/ScannerContext";
import { LanguageProvider, useLanguage } from "./src/context/LanguageContext";
import LanguageSelectionModal from "./src/components/LanguageSelectionModal";
import { COLORS } from "./src/constants/colors";

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

function BottomTabNavigator({ navigation }: any) {
  const { openScanner } = useScanner();
  const { t, language } = useLanguage();
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
            height: language === "ml" ? 50 : 58,
            paddingBottom: language === "ml" ? 3 : 6,
            paddingTop: language === "ml" ? 3 : 5,
          },
          tabBarLabelStyle: {
            fontSize: language === "ml" ? 9.5 : 11,
            fontWeight: "700",
          },
          tabBarIcon: ({ color }: { color: string }) => {
            const iconSize = language === "ml" ? 18 : 22;
            if (route.name === "HomeTab") {
              return <Home size={iconSize} color={color} />;
            } else if (route.name === "LotteriesTab") {
              return <Ticket size={iconSize} color={color} />;
            } else if (route.name === "SearchTab") {
              return <SearchIcon size={iconSize} color={color} />;
            } else if (route.name === "DateTab") {
              return <CalendarIcon size={iconSize} color={color} />;
            }
            return null;
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

function AppContent() {
  useEffect(() => {
    async function loadAssets() {
      try {
        await Asset.loadAsync([
          require("./assets/icon.png"),
          require("./assets/adaptive-icon.png"),
        ]);
      } catch (e) {
        console.warn("Asset caching error:", e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    loadAssets();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          <Stack.Screen name="LotteryArchive" component={LotteryArchiveScreen} />
          <Stack.Screen name="DrawBreakdown" component={DrawBreakdownScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <LanguageSelectionModal />
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
