import "react-native-gesture-handler";
import "./src/styles/globals.css"
import { NavigationContainer } from "@react-navigation/native"
import { StatusBar } from "expo-status-bar"
import { useRef,  } from "react"
import { View } from "react-native" 
import { LogBox } from "react-native";
LogBox.ignoreLogs(["setLayoutAnimationEnabledExperimental"]);
LogBox.ignoreLogs([
  "setLayoutAnimationEnabledExperimental",
  "SafeAreaView has been deprecated"
]);
import { AuthProvider, useAuth } from "./src/context/authContext"
import { AlertProvider, useAlert } from "./src/context/AlertContext"
import LoginScreen from "./src/screens/LoginScreen"
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen"
import MainDrawer from "./src/navigation/MainDrawer"
import AlertOverlay from "./src/components/AlertOverlay"
import type { NavigationContainerRef } from "@react-navigation/native"
import { ThemeProvider } from "./src/context/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context"
import { LanguageProvider } from "./src/context/LanguageContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createNativeStackNavigator } from "@react-navigation/native-stack"
const Stack = createNativeStackNavigator()

function AppContent() {
  const { user } = useAuth()
  const { alertaActual, marcarComoVista, ignorarAlerta } = useAlert()
  const navigationRef = useRef<NavigationContainerRef<any>>(null)

  const handleNavigateToAlerts = () => {
    if (navigationRef.current) {
      navigationRef.current.navigate("Alertas")
    }
    if (alertaActual) {
      marcarComoVista(alertaActual.id)
    }
  }

  const handleIgnoreAlert = () => {
    if (alertaActual) {
      ignorarAlerta(alertaActual.id)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark"/>
        <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }}>
          {user ? (
            <Stack.Screen name="MainDrawer" component={MainDrawer} />
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {user && alertaActual && (
        <AlertOverlay 
          alerta={alertaActual} 
          onVerAlerta={handleNavigateToAlerts} 
          onIgnorar={handleIgnoreAlert} 
        />
      )}
    </View>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <AlertProvider>
                <AppContent />
              </AlertProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}