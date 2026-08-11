import React, { useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

import HomeScreen from "./src/screens/HomeScreen";
import LotteriesScreen from "./src/screens/LotteriesScreen";
import SearchScreen from "./src/screens/SearchScreen";
import LotteryArchiveScreen from "./src/screens/LotteryArchiveScreen";
import DrawBreakdownScreen from "./src/screens/DrawBreakdownScreen";
import { COLORS } from "./src/constants/colors";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: string } }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "HomeTab") {
            iconName = "home";
          } else if (route.name === "LotteriesTab") {
            iconName = "ticket";
          } else if (route.name === "SearchTab") {
            iconName = "search";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="LotteriesTab" component={LotteriesScreen} options={{ tabBarLabel: "Lotteries" }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ tabBarLabel: "Checker" }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const onReady = useCallback(async () => {
    // Hide splash screen after Navigation is ready
    await SplashScreen.hideAsync();
  }, []);

  return (
    <NavigationContainer onReady={onReady}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen name="LotteryArchive" component={LotteryArchiveScreen} />
        <Stack.Screen name="DrawBreakdown" component={DrawBreakdownScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
