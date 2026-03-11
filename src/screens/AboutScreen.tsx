import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

export default function AcercaDeScreen() {
  const navigation = useNavigation();
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);

  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.subHeader]}>
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

        <Text style={styles.subHeaderTitle}>{t("acercaDelAplicativo")}</Text>
        <MaterialIcons
          name="info-outline"
          size={26}
          color={isDark ? "#34D399" : "#007b3e"}
        />
      </View>

      <View style={styles.menuContainer}>
        <Text style={[styles.subtitle]}>{t("propositoTitulo")}</Text>

        <Text style={styles.text}>{t("propositoTexto")}</Text>

        <Text style={[styles.subtitle, { marginTop: 25 }]}>
          {t("desarrolladores")}
        </Text>

        <Text style={styles.info}>
          <Text style={styles.bold}>{t("equipo")}</Text>
          <Text style={styles.text}> {t("equipoTexto")}</Text>
        </Text>

        <Text style={styles.info}>
          <Text style={styles.bold}>{t("ano")}</Text>
          <Text style={styles.text}> {new Date().getFullYear()}</Text>
        </Text>

        <Text style={styles.info}>
          <Text style={styles.bold}>{t("contacto")}</Text>{" "}
          <Text
            style={styles.link}
            onPress={() =>
              Linking.openURL("mailto:proyectoacuaponiaia@gmail.com")
            }
          >
            proyectoacuaponiaia@gmail.com
          </Text>
        </Text>

        <Text style={[styles.subtitle, { marginTop: 25 }]}>
          {t("informacionTecnica")}
        </Text>

        <Text style={styles.info}>
          <Text style={styles.bold}>{t("compatibilidad")}</Text>
          <Text style={styles.text}> {t("compatibilidadTexto")}</Text>
        </Text>
        <Text style={styles.info}>
          <Text style={styles.bold}>{t("version")}</Text>
          <Text style={styles.text}> {t("versionTexto")}</Text>
        </Text>
        <Text style={styles.info}>
          <Text style={styles.bold}>{t("ultimaActualizacion")}</Text>
          <Text style={styles.text}> {t("ultimaActualizacionTexto")}</Text>
        </Text>

        <Text style={[styles.subtitle, { marginTop: 25 }]}>
          {t("aspectosLegales")}
        </Text>

        <Text style={styles.text}>{t("aspectosLegalesTexto")}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.webLink} onPress={() => Linking.openURL("https://www.ucundinamarca.edu.co")}>{t("webSitio")}</Text>
        <Text style={styles.vigilada}>{t("vigiladaMinEducacion")}</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? "#121212" : "#F0FDF4",
    },
    bold: {
      fontWeight: "bold",
    },
    link: {
      color: dark ? "#4ea1ff" : "blue",
      textDecorationLine: "underline",
      fontSize: 14,
      lineHeight: 22,
      marginBottom: -5,
    },
    subHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    subHeaderTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: dark ? "#fff" : "#1E2937",
    },
    backBtn: { padding: 5 },
    menuContainer: {
      backgroundColor: dark ? "#1E1E1E" : "#FFFFFF",
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
    subtitle: {
      fontSize: 16,
      fontWeight: "700",
      color: dark ? "#ddd" : "#374151",
      marginBottom: 8,
    },
    text: {
      fontSize: 14,
      color: dark ? "#ccc" : "#6B7280",
      lineHeight: 22,
      marginBottom: 12,
    },
    info: {
      fontSize: 14,
      color: dark ? "#fff" : "#374151",
      marginBottom: 6,
    },
    footer: {
      alignItems: "center",
      paddingVertical: 20,
    },
    webLink: {
      color: dark ? "#5fd77f" : "#007b3e",
      fontWeight: "700",
      fontSize: 13,
    },
    vigilada: {
      color: dark ? "#888" : "#9CA3AF",
      fontSize: 10,
      marginTop: 4,
    },
  });
