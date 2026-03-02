import React, { useContext, useMemo } from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  BackHandler,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/authContext";
import { useAlert } from "../context/AlertContext";
import { ThemeContext } from "../context/ThemeContext";
import UserHeader from "../components/UserHeader";
import { LanguageContext } from "../context/LanguageContext";
import { SafeAreaView } from "react-native-safe-area-context";

import MainTabNavigator from "./MainTabNavigator";
import PerfilScreen from "../screens/ProfileScreen";
import AlertasScreen from "../screens/AlertScreen";
import UsuariosScreen from "../screens/UserScreen";
import ReportesScreen from "../screens/ReportScreen";
import AcercaDeScreen from "../screens/AboutScreen";
import AyudaScreen from "../screens/HelpScreen";
import PoliticasScreen from "../screens/PoliciesScreen";
import ConfiguracionScreen from "../screens/SettingScreen";
import NotificacionesScreen from "../screens/NotificationScreen";
import SoporteScreen from "../screens/SupportScreen";
import PrediccionesScreen from "../screens/PredictCropScreen";
import PrediccionesEstanquesScreen from "../screens/PredictTankScreen";
import PrediccionTruchasSARIMAScreen from "../screens/PredictTankSScreen";
import PrediccionLechugasSARIMAScreen from "../screens/PredictCropSScreen";
import PrediccionTruchasAvanzadaScreen from "../screens/PredictTankRMScreen";
import PrediccionLechugasAvanzadaScreen from "../screens/PredictCropRMScreen";

const Drawer = createDrawerNavigator();

const ScreenWrapper = ({ children }: { children: React.ReactNode }) => {
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#F0FDF4" }}>
      <UserHeader />
      {children}
    </View>
  );
};

const WrappedPerfil = () => (
  <ScreenWrapper>
    <PerfilScreen />
  </ScreenWrapper>
);
const WrappedAlertas = () => (
  <ScreenWrapper>
    <AlertasScreen />
  </ScreenWrapper>
);
const WrappedUsuarios = () => (
  <ScreenWrapper>
    <UsuariosScreen />
  </ScreenWrapper>
);
const WrappedReportes = () => (
  <ScreenWrapper>
    <ReportesScreen />
  </ScreenWrapper>
);
const WrappedAcercaDe = () => (
  <ScreenWrapper>
    <AcercaDeScreen />
  </ScreenWrapper>
);
const WrappedAyuda = () => (
  <ScreenWrapper>
    <AyudaScreen />
  </ScreenWrapper>
);
const WrappedPoliticas = () => (
  <ScreenWrapper>
    <PoliticasScreen />
  </ScreenWrapper>
);
const WrappedConfiguracion = () => (
  <ScreenWrapper>
    <ConfiguracionScreen />
  </ScreenWrapper>
);
const WrappedNotificaciones = () => (
  <ScreenWrapper>
    <NotificacionesScreen />
  </ScreenWrapper>
);
const WrappedSoporte = () => (
  <ScreenWrapper>
    <SoporteScreen />
  </ScreenWrapper>
);
const WrappedPredicciones = () => (
  <ScreenWrapper>
    <PrediccionesScreen />
  </ScreenWrapper>
);
const WrappedPrediccionEstanques = () => (
  <ScreenWrapper>
    <PrediccionesEstanquesScreen />
  </ScreenWrapper>
);
const WrappedPrediccionTruchasSARIMA = () => (
  <ScreenWrapper>
    <PrediccionTruchasSARIMAScreen />
  </ScreenWrapper>
);
const WrappedPrediccionLechugasSARIMA = () => (
  <ScreenWrapper>
    <PrediccionLechugasSARIMAScreen />
  </ScreenWrapper>
);
const WrappedPrediccionTruchasAvanzada = () => (
  <ScreenWrapper>
    <PrediccionTruchasAvanzadaScreen />
  </ScreenWrapper>
);
const WrappedPrediccionLechugasAvanzada = () => (
  <ScreenWrapper>
    <PrediccionLechugasAvanzadaScreen />
  </ScreenWrapper>
);

function CustomDrawerContent(props: any) {
  const { user, logout } = useAuth();
  const { alertasActivas } = useAlert();
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  const styles = useMemo(() => getUserStyles(isDark), [isDark]);

  const userData = user || {
    nombre: "Usuario",
    apellido: "",
    correo: "usuario@ucundinamarca.edu.co",
    rol: "institucional",
  };

  const isUcundinamarcaUser =
    userData.correo?.endsWith("@ucundinamarca.edu.co") || false;
  const isGmailUser = userData.correo?.endsWith("@gmail.com") || false;

  const alertasCriticas = alertasActivas.filter(
    (a) => a.severidad === "critica" || a.severidad === "alta",
  ).length;

  const safeName = encodeURIComponent(
    `${userData.nombre} ${userData.apellido}`.trim(),
  );
  const avatarUrl = `https://ui-avatars.com/api/?name=${safeName}&background=fff&color=007b3e&size=512&bold=true`;

  const handleNavigation = (
    route: string,
    restrictTo: "institucional" | "gmail" | "all",
  ) => {
    if (restrictTo === "institucional" && !isUcundinamarcaUser) {
      Alert.alert(
        t("error"),
        t(
          "Solo usuarios institucionales (@ucundinamarca.edu.co) tienen acceso.",
        ),
      );
      return;
    }
    if (restrictTo === "gmail" && !isUcundinamarcaUser && !isGmailUser) {
      Alert.alert(t("error"), t("Requiere correo institucional o @gmail.com"));
      return;
    }
    props.navigation.navigate(route);
  };

  const handleCerrarSesion = () => {
    Alert.alert(t("cerrarSesionTitulo"), t("cerrarSesionMensaje"), [
      { text: t("cancelar"), style: "cancel" },
      {
        text: t("cerrarSesion"),
        style: "destructive",
        onPress: async () => {
          await logout();
          if (Platform.OS === "android") BackHandler.exitApp();
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    label,
    danger = false,
    onPress,
    badge = null,
    disabled = false,
  }: any) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        danger && styles.dangerItem,
        disabled && styles.disabledItem,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.menuIconContainer}>
        <MaterialIcons
          name={icon}
          size={24}
          color={danger ? "#DC2626" : disabled ? "#9CA3AF" : "#0B7A3E"}
        />
        {badge !== null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.menuText,
          danger && { color: "#DC2626" },
          disabled && { color: "#9CA3AF" },
        ]}
      >
        {label}
      </Text>
      <MaterialIcons
        name="chevron-right"
        size={22}
        color={disabled ? "#D1D5DB" : "#9CA3AF"}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#064e3b" : "#007b3e" }}
    >
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.userHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => props.navigation.closeDrawer()}
          >
            <MaterialIcons name="close" size={32} color="white" />
          </TouchableOpacity>
          <Image source={{ uri: avatarUrl }} style={styles.menuAvatar} />
          <Text style={styles.name}>
            {userData.nombre} {userData.apellido}
          </Text>
          <Text style={styles.email}>{userData.correo}</Text>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>{t("MICUENTA")}</Text>
          <MenuItem
            icon="person"
            label={t("miPerfil")}
            onPress={() => handleNavigation("Perfil", "all")}
          />

          <Text style={styles.sectionTitle}>{t("SISTEMA")}</Text>
          {isUcundinamarcaUser && (
            <MenuItem
              icon="people"
              label={t("usuariosRegistrados")}
              onPress={() => handleNavigation("Usuarios", "institucional")}
            />
          )}
          <MenuItem
            icon="notifications-active"
            label={t("alertasDelSistema")}
            badge={alertasCriticas}
            disabled={!isUcundinamarcaUser && !isGmailUser}
            onPress={() => handleNavigation("Alertas", "gmail")}
          />
          {isUcundinamarcaUser && (
            <MenuItem
              icon="assessment"
              label={t("generarReporte")}
              onPress={() => handleNavigation("Reportes", "institucional")}
            />
          )}

          <Text style={styles.sectionTitle}>{t("INFORMACIÓN")}</Text>
          <MenuItem
            icon="info-outline"
            label={t("acercaDelAplicativo")}
            onPress={() => handleNavigation("AcercaDe", "all")}
          />
          <MenuItem
            icon="help-outline"
            label={t("ayuda")}
            onPress={() => handleNavigation("Ayuda", "all")}
          />
          <MenuItem
            icon="description"
            label={t("politicasDeUso")}
            onPress={() => handleNavigation("Politicas", "all")}
          />

          <Text style={styles.sectionTitle}>{t("CONFIGURACIÓN")}</Text>
          <MenuItem
            icon="settings"
            label={t("configuracion")}
            onPress={() => handleNavigation("Configuracion", "all")}
          />
          <MenuItem
            icon="support-agent"
            label={t("soporte")}
            onPress={() => handleNavigation("Soporte", "all")}
          />

          <View style={{ height: 20 }} />
          <MenuItem
            icon="logout"
            label={t("cerrarSesion")}
            danger
            onPress={handleCerrarSesion}
          />
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

export default function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: "right",
      }}
    >
      <Drawer.Screen name="Dashboard" component={MainTabNavigator} />
      <Drawer.Screen name="Perfil" component={WrappedPerfil} />
      <Drawer.Screen name="Alertas" component={WrappedAlertas} />
      <Drawer.Screen name="Usuarios" component={WrappedUsuarios} />
      <Drawer.Screen name="Reportes" component={WrappedReportes} />
      <Drawer.Screen name="AcercaDe" component={WrappedAcercaDe} />
      <Drawer.Screen name="Ayuda" component={WrappedAyuda} />
      <Drawer.Screen name="Politicas" component={WrappedPoliticas} />
      <Drawer.Screen name="Configuracion" component={WrappedConfiguracion} />
      <Drawer.Screen name="Notificaciones" component={WrappedNotificaciones} />
      <Drawer.Screen name="Soporte" component={WrappedSoporte} />
      <Drawer.Screen name="Predicciones" component={WrappedPredicciones} />
      <Drawer.Screen
        name="PrediccionEstanques"
        component={WrappedPrediccionEstanques}
      />
      <Drawer.Screen
        name="PrediccionTruchasSARIMA"
        component={WrappedPrediccionTruchasSARIMA}
      />
      <Drawer.Screen
        name="PrediccionLechugasSARIMA"
        component={WrappedPrediccionLechugasSARIMA}
      />
      <Drawer.Screen
        name="PrediccionTruchasAvanzada"
        component={WrappedPrediccionTruchasAvanzada}
      />
      <Drawer.Screen
        name="PrediccionLechugasAvanzada"
        component={WrappedPrediccionLechugasAvanzada}
      />
    </Drawer.Navigator>
  );
}

const getUserStyles = (dark: boolean) =>
  StyleSheet.create({
    userHeader: {
      backgroundColor: dark ? "#064e3b" : "#007b3e",
      paddingTop: 15,
      paddingBottom: 30,
      paddingHorizontal: 20,
      alignItems: "center",
    },
    closeButton: {
      position: "absolute",
      top: 15,
      left: 15,
      zIndex: 10,
    },
    name: {
      color: dark ? "#fff" : "white",
      fontSize: 20,
      fontWeight: "800",
      marginTop: 10,
    },
    email: {
      color: dark ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.9)",
      fontSize: 14,
      marginTop: 3,
    },
    menuContainer: {
      backgroundColor: dark ? "#1E1E1E" : "#F4F6F8",
      paddingHorizontal: 15,
      paddingTop: 20,
      borderWidth: 2,
      borderColor: dark ? "#333" : "#E5E7EB",
      borderRadius: 15,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      marginHorizontal: 10,
      marginBottom: 10,
      marginTop: -10,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "900",
      color: dark ? "#888" : "#6B7280",
      letterSpacing: 1,
      marginTop: 20,
      marginBottom: 12,
      marginLeft: 5,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: dark ? "#2A2A2A" : "white",
      paddingVertical: 18,
      paddingHorizontal: 18,
      borderRadius: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
    },
    menuIconContainer: {
      position: "relative",
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    menuText: {
      flex: 1,
      marginLeft: 15,
      fontSize: 16,
      color: dark ? "#fff" : "#374151",
      fontWeight: "500",
    },
    dangerItem: {
      borderWidth: 1,
      borderColor: "#FCA5A5",
    },
    disabledItem: {
      opacity: 0.5,
      backgroundColor: dark ? "#333" : "#F9FAFB",
    },
    menuAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: dark
        ? "rgba(255, 255, 255, 0.2)"
        : "rgba(255, 255, 255, 0.4)",
      marginTop: 10,
      marginBottom: 5,
    },
    badge: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: "#DC2626",
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: dark ? "#1E1E1E" : "white",
    },
    badgeText: {
      color: "white",
      fontSize: 10,
      fontWeight: "bold",
      paddingHorizontal: 4,
    },
    alertFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: dark ? "#744E00" : "#FEF3C7",
      marginHorizontal: 10,
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      gap: 8,
    },
    alertFooterText: {
      color: dark ? "#FFD580" : "#92400E",
      fontSize: 13,
      fontWeight: "600",
    },
  });
