import React, { useContext } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../context/authContext";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";
import UserHeader from "../components/UserHeader";

import CultivosScreen from "../screens/CropScreen";
import PrediccionesScreen from "../screens/PredictCropScreen";
import PredictCropMLScreen from "../screens/PredictCropMLScreen";

const Stack = createStackNavigator();

export default function CultivosStackNavigator() {
  const theme = useContext(ThemeContext);
  const isDark = theme?.isDark ?? false;
  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerShown: true,

        header: () => {
          const canGoBack =
            route.name !== "CultivosMain" && navigation.canGoBack();

          return (
            <UserHeader
              onBack={canGoBack ? () => navigation.goBack() : undefined}
            />
          );
        },
        cardStyle: { backgroundColor: isDark ? "#121212" : "#F0FDF4" },
      })}
    >
      <Stack.Screen name="CultivosMain" component={CultivosScreen} />

      <Stack.Screen
        name="Predicciones"
        component={PrediccionesScreen}
        options={{
          title: t("modelos_prediccion"),
        }}
      />

      <Stack.Screen
        name="PrediccionML"
        component={PredictCropMLScreen}
        options={{
          title: t("machine_learning_ia"),
        }}
      />
    </Stack.Navigator>
  );
}
