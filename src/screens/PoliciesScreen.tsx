import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

export default function PoliticasScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);

  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.subHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? "#34D399" : "#007b3e"}
          />
        </TouchableOpacity>

        <Text style={styles.subHeaderTitle}>{t("politicasDeUso")}</Text>
        <MaterialIcons
          name="description"
          size={26}
          color={isDark ? "#34D399" : "#007b3e"}
        />
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.mainTitle}>{t("tituloPoliticas")}</Text>

        <Text style={styles.text}>{t("bienvenidoPoliticas")}</Text>

        <Text style={styles.sectionTitle}>{t("descripcionServicio")}</Text>

        <Text style={styles.text}>{t("descripcionServicioTexto")}</Text>

        <Text style={styles.highlight}>{t("importante")}</Text>

        <Text style={styles.text}>{t("aspectosLegalesTexto")}</Text>

        <Text style={styles.sectionTitle}>{t("propiedadIntelectual")}</Text>

        <Text style={styles.text}>{t("propiedadIntelectualTexto")}</Text>

        <Text style={styles.sectionTitle}>{t("leyAplicableJurisdiccion")}</Text>

        <Text style={styles.text}>{t("leyAplicableJurisdiccionTexto")}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.webLink} onPress={() => Linking.openURL("https://www.ucundinamarca.edu.co")}>{t("webSitio")}</Text>
        <Text style={styles.vigilada}>{t("vigiladaMinEducacion")}</Text>
      </View>

      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121212" : "#F0FDF4",
    },
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
      color: isDark ? "#F1F5F9" : "#1E2937",
    },
    backBtn: {
      padding: 5,
    },
    menuContainer: {
      backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
      paddingHorizontal: 20,
      paddingVertical: 25,
      borderRadius: 28,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    mainTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: isDark ? "#E2E8F0" : "#1F2937",
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#F1F5F9" : "#374151",
      marginTop: 20,
      marginBottom: 8,
    },
    text: {
      fontSize: 14,
      color: isDark ? "#94A3B8" : "#6B7280",
      lineHeight: 22,
      marginBottom: 10,
      textAlign: "justify",
    },
    highlight: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#34D399" : "#007b3e",
      marginTop: 10,
      marginBottom: 5,
    },
    footer: {
      alignItems: "center",
      paddingVertical: 10,
    },
    webLink: {
      color: isDark ? "#34D399" : "#007b3e",
      fontWeight: "700",
      fontSize: 13,
    },
    vigilada: {
      color: isDark ? "#94A3B8" : "#9CA3AF",
      fontSize: 10,
      marginTop: 4,
    },
  });
