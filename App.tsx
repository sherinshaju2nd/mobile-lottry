import React, { useEffect, useCallback, useRef } from "react";
import { View, Text, Animated, Easing, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Ticket, Search as SearchIcon, Clock, Camera } from "lucide-react-native";
import * as SplashScreen from "expo-splash-screen";
import { Asset } from "expo-asset";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

import HomeScreen from "./src/screens/HomeScreen";
import LotteriesScreen from "./src/screens/LotteriesScreen";
import SearchScreen from "./src/screens/SearchScreen";
import LotteryArchiveScreen from "./src/screens/LotteryArchiveScreen";
import DrawBreakdownScreen from "./src/screens/DrawBreakdownScreen";
import { ScannerProvider, useScanner } from "./src/context/ScannerContext";
import { COLORS } from "./src/constants/colors";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ScanTabButton() {
  return null;
}

function AnimatedScanButton({ onPress }: { onPress: () => void }) {
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
      <Text style={tabStyles.tabLabelText}>Scan</Text>
    </View>
  );
}

function BottomTabNavigator() {
  const { openScanner } = useScanner();

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: string } }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          if (route.name === "HomeTab") {
            return <Home size={size} color={color} />;
          } else if (route.name === "LotteriesTab") {
            return <Ticket size={size} color={color} />;
          } else if (route.name === "SearchTab") {
            return <SearchIcon size={size} color={color} />;
          } else if (route.name === "ArchiveTab") {
            return <Clock size={size} color={color} />;
          }
          return null;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="LotteriesTab"
        component={LotteriesScreen}
        options={{ tabBarLabel: "Lotteries" }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanTabButton}
        options={{
          tabBarLabel: "Scan",
          tabBarButton: () => (
            <AnimatedScanButton onPress={() => openScanner()} />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{ tabBarLabel: "Checker" }}
      />
      <Tab.Screen
        name="ArchiveTab"
        component={LotteryArchiveScreen}
        options={{ tabBarLabel: "Archives" }}
      />
    </Tab.Navigator>
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

export default function App() {
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
    <SafeAreaProvider>
      <ScannerProvider>
        <View style={{ flex: 1 }}>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
              <Stack.Screen name="LotteryArchive" component={LotteryArchiveScreen} />
              <Stack.Screen name="DrawBreakdown" component={DrawBreakdownScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </ScannerProvider>
    </SafeAreaProvider>
  );
}

