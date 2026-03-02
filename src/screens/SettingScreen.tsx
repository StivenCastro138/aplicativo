import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

type RootStackParamList = {
  Notificaciones: undefined;
  [key: string]: any;
};

export default function ConfiguracionScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const themeContext = useContext(ThemeContext);
  const { isDark, toggleTheme } = themeContext!;

  const languageContext = useContext(LanguageContext);
  const { language, setLanguage } = languageContext!;

  const t = languageContext?.t || ((key: string) => key);

  const styles = getStyles(isDark);

  const changeLanguage = () => {
    Alert.alert(
      t("seleccionarIdioma"),
      t("eligeIdioma"),
      [
        { text: t("cancelar"), style: "cancel" },
        { text: t("espanol"), onPress: () => setLanguage("es") },
        { text: t("ingles"), onPress: () => setLanguage("en") },
      ],
      { cancelable: true },
    );
  };

  const resetSettings = () => {
    Alert.alert(
      t("restablecerConfirmacionTitulo"),
      t("restablecerConfirmacionMensaje"),
      [
        { text: t("cancelar"), style: "cancel" },
        { text: t("confirmar"), onPress: () => setLanguage("es") },
      ],
    );
  };

  const rateApp = async () => {
    const url =
      "https://play.google.com/store/apps/details?id=com.tuapp.aquaponia";
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(t("error"), t("noAbrirTienda"));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? "#34D399" : "#007b3e"}
          />
        </TouchableOpacity>

        <Text style={styles.subHeaderTitle}>{t("configuracion")}</Text>

        <MaterialIcons
          name="settings"
          size={26}
          color={isDark ? "#34D399" : "#007b3e"}
        />
      </View>

      <View style={styles.menuContainer}>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t("modoOscuro")}</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{
              false: "#D1D5DB",
              true: isDark ? "#34D399" : "#007b3e",
            }}
            thumbColor={isDark ? "#fff" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity style={styles.row} onPress={changeLanguage}>
          <Text style={styles.rowText}>{t("idioma")}</Text>
          <Text style={styles.secondaryText}>
            {language === "es" ? t("espanol") : t("ingles")}
          </Text>
        </TouchableOpacity>
        {/*
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("Notificaciones")}
        >
          <Text style={styles.rowText}>{t("notificaciones")}</Text>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={isDark ? "#94A3B8" : "#6B7280"}
          />
        </TouchableOpacity>
        */}
        <TouchableOpacity style={styles.row} onPress={resetSettings}>
          <Text style={styles.rowText}>{t("restablecerConfiguraciones")}</Text>
        </TouchableOpacity>
        {/*
        <TouchableOpacity
          style={[styles.row, { borderBottomWidth: 0 }]}
          onPress={rateApp}
        >

          <Text style={styles.rowText}>{t("calificarAplicacion")}</Text>
          <MaterialIcons
            name="star-outline"
            size={20}
            color={isDark ? "#94A3B8" : "#6B7280"}
          />
        </TouchableOpacity>
        */}
        
      </View>
      <View style={styles.footer}>
        <Text style={styles.webLink}>{t("webSitio")}</Text>
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
      color: dark ? "#F1F5F9" : "#1E2937",
    },
    menuContainer: {
      backgroundColor: dark ? "#1E1E1E" : "#FFFFFF",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 28,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: dark ? "#334155" : "#F3F4F6",
    },
    rowText: {
      fontSize: 14,
      color: dark ? "#F1F5F9" : "#374151",
      fontWeight: "500",
    },
    secondaryText: {
      fontSize: 14,
      color: dark ? "#94A3B8" : "#6B7280",
    },
    footer: { alignItems: "center", paddingVertical: 25 },
    webLink: { color: "#10B981", fontWeight: "700", fontSize: 14 },
    vigilada: { color: "#666", fontSize: 11, marginTop: 4 },
  });
