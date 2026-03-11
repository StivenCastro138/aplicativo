import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

export default function NotificacionesScreen() {
  const navigation = useNavigation();

  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;

  const [sonido, setSonido] = useState(true);
  const [vibracion, setVibracion] = useState(true);
  const [silencio, setSilencio] = useState(false);
  const [actualizaciones, setActualizaciones] = useState(true);

  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await AsyncStorage.getItem("notifications");
      if (data) {
        const parsed = JSON.parse(data);
        setSonido(parsed.sonido ?? true);
        setVibracion(parsed.vibracion ?? true);
        setSilencio(parsed.silencio ?? false);
        setActualizaciones(parsed.actualizaciones ?? true);
      }
    } catch (e) {
      console.error("Error cargando settings", e);
    }
  };

  const saveSettings = async (newState: any) => {
    await AsyncStorage.setItem("notifications", JSON.stringify(newState));
  };

  const sendTestNotification = async () => {
    if (silencio) return;

    // Se reemplazó la notificación push por una alerta nativa interna.
    Alert.alert(
      t("tituloNotificacion") || "Prueba FishTrace",
      t("cuerpoNotificacion") || "Esta es una notificación de prueba (Sistema Interno Operativo)"
    );
  };

  const handleToggle = (key: string, value: boolean) => {
    const newState = {
      sonido,
      vibracion,
      silencio,
      actualizaciones,
      [key]: value,
    };

    if (key === "sonido") setSonido(value);
    if (key === "vibracion") setVibracion(value);
    if (key === "silencio") setSilencio(value);
    if (key === "actualizaciones") setActualizaciones(value);

    saveSettings(newState);
  };

  const styles = getStyles(isDark);

  // Reutilizamos el estilo del Switch para no repetir código
  const switchProps = {
    trackColor: { false: "#D1D5DB", true: isDark ? "#34D399" : "#007b3e" },
    thumbColor: Platform.OS === "ios" ? undefined : "#fff",
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? "#34D399" : "#007b3e"} />
        </TouchableOpacity>
        <Text style={styles.subHeaderTitle}>{t("notificaciones")}</Text>
        <MaterialIcons name="notifications" size={26} color={isDark ? "#34D399" : "#007b3e"} />
      </View>

      <View style={styles.menuContainer}>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t("sonidoNotificaciones")}</Text>
          <Switch
            {...switchProps}
            value={sonido}
            onValueChange={(v) => handleToggle("sonido", v)}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowText}>{t("vibracionNotificaciones")}</Text>
          <Switch
            {...switchProps}
            value={vibracion}
            onValueChange={(v) => handleToggle("vibracion", v)}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowText}>{t("modoSilencio")}</Text>
          <Switch
            {...switchProps}
            value={silencio}
            onValueChange={(v) => handleToggle("silencio", v)}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowText}>{t("actualizacionesAplicacion")}</Text>
          <Switch
            {...switchProps}
            value={actualizaciones}
            onValueChange={(v) => handleToggle("actualizaciones", v)}
          />
        </View>

        <TouchableOpacity 
          style={[styles.testBtn, isDark && { backgroundColor: "#064e3b" }]} 
          onPress={sendTestNotification}
        >
          <Text style={styles.testBtnText}>{t("enviarNotificacionPrueba")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.webLink, isDark && { color: "#34D399" }]} onPress={() => Linking.openURL("https://www.ucundinamarca.edu.co")}>{t("webSitio")}</Text>
        <Text style={styles.vigilada}>{t("vigiladaMinEducacion")}</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (dark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: dark ? "#121212" : "#F0FDF4" },
    subHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 25,
      paddingVertical: 15,
    },
    subHeaderTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: dark ? "#fff" : "#1E2937",
    },
    menuContainer: {
      backgroundColor: dark ? "#1E1E1E" : "#FFFFFF",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 28,
      marginHorizontal: 20,
      marginBottom: 20,
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: dark ? "#333" : "#F3F4F6",
    },
    rowText: {
      fontSize: 14,
      color: dark ? "#fff" : "#374151",
      fontWeight: "500",
    },
    testBtn: {
      marginTop: 20,
      marginBottom: 10,
      backgroundColor: "#007b3e",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    testBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 14,
    },
    footer: { alignItems: "center", paddingVertical: 20 },
    webLink: { color: "#007b3e", fontWeight: "700", fontSize: 13 },
    vigilada: { color: "#9CA3AF", fontSize: 10, marginTop: 4 },
  });