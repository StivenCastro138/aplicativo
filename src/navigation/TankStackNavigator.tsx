import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";
import UserHeader from "../components/UserHeader";

import TanquesScreen from "../screens/TankScreen";
import PrediccionesTanquesScreen from "../screens/PredictTankScreen";
import PrediccionMLTanquesScreen from "../screens/PredictTankMLScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

export default function TanquesStackNavigator() {
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route}) => ({
        headerShown: true,

        header: () => {
          const canGoBack =
            route.name !== "TanquesMain" && navigation.canGoBack();

          return (
            <UserHeader
              onBack={canGoBack ? () => navigation.goBack() : undefined}
            />
          );
        },
        contentStyle: { backgroundColor: isDark ? "#121212" : "#F0FDF4" },
      })}
    >
      <Stack.Screen name="TanquesMain" component={TanquesScreen} />

      <Stack.Screen
        name="PrediccionesTanques"
        component={PrediccionesTanquesScreen}
        options={{
          title: t("modelos_prediccion"),
        }}
      />

      <Stack.Screen
        name="PrediccionMLTanques"
        component={PrediccionMLTanquesScreen}
        options={{
          title: t("machine_learning_ia"),
        }}
      />
    </Stack.Navigator>
  );
}
