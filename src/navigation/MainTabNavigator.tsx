import React, { useContext, useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

import { useAuth } from "../context/authContext";
import { ThemeContext } from "../context/ThemeContext";

import HomeScreen from "../screens/HomeScreen";
import UserHeader from "../components/UserHeader";
import CultivosStackNavigator from "./CropStackNavigator";
import TanquesStackNavigator from "./TankStackNavigator";

const Tab = createBottomTabNavigator();

const HomeWithHeader = ({ navigation }: any) => {
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#F0FDF4" }}>
      <UserHeader />
      <HomeScreen navigation={navigation} />
    </View>
  );
};

export default function MainTabNavigator() {
  const { hasActivity } = useAuth();
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;

  const styles = useMemo(() => getTabStyles(isDark), [isDark]);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: isDark ? "#4ADE80" : "#FFFFFF",
        tabBarInactiveTintColor: isDark
          ? "rgba(255,255,255,0.4)"
          : "rgba(255,255,255,0.6)",
        tabBarShowLabel: false,
      }}
    >
      {hasActivity("Monitoreo Modulo Cultivos") && (
        <Tab.Screen
          name="Cultivos"
          component={CultivosStackNavigator}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="eco" size={32} color={color} />
            ),
          }}
        />
      )}

      <Tab.Screen
        name="Home"
        component={HomeWithHeader}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={35} color={color} />
          ),
        }}
      />

      {hasActivity("Monitoreo Modulo Tanques") && (
        <Tab.Screen
          name="Tanques"
          component={TanquesStackNavigator}
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="fish" size={28} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

const getTabStyles = (isDark: boolean) =>
  StyleSheet.create({
    tabBar: {
      backgroundColor: isDark ? "#064e3b" : "#007b3e",
      height: 75,
      paddingBottom: 15,
      paddingTop: 10,
      borderTopWidth: isDark ? 1 : 0,
      borderColor: "#333",
      elevation: 25,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
    },
  });
