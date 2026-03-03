import React, { useState, useContext, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

export default function AyudaScreen() {
  const navigation = useNavigation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);

  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  const preguntas = useMemo(
    () => [
      { pregunta: t("pregunta1"), respuesta: t("respuesta1") },
      { pregunta: t("pregunta2"), respuesta: t("respuesta2") },
      { pregunta: t("pregunta3"), respuesta: t("respuesta3") },
      { pregunta: t("pregunta4"), respuesta: t("respuesta4") },
      { pregunta: t("pregunta5"), respuesta: t("respuesta5") },
      { pregunta: t("pregunta6"), respuesta: t("respuesta6") },
      { pregunta: t("pregunta7"), respuesta: t("respuesta7") },
      { pregunta: t("pregunta8"), respuesta: t("respuesta8") },
      { pregunta: t("pregunta9"), respuesta: t("respuesta9") },
      { pregunta: t("pregunta10"), respuesta: t("respuesta10") },
      { pregunta: t("pregunta11"), respuesta: t("respuesta11") },
      { pregunta: t("pregunta12"), respuesta: t("respuesta12") },
      { pregunta: t("pregunta13"), respuesta: t("respuesta13") },
      { pregunta: t("pregunta14"), respuesta: t("respuesta14") },
      { pregunta: t("pregunta15"), respuesta: t("respuesta15") },
    ],
    [t],
  );

  const toggleItem = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        <Text style={styles.subHeaderTitle}>{t("centroAyuda")}</Text>

        <MaterialIcons
          name="help-outline"
          size={26}
          color={isDark ? "#34D399" : "#007b3e"}
        />
      </View>

      <View style={styles.menuContainer}>
        {preguntas.map((item, index) => (
          <View key={index}>
            <TouchableOpacity
              style={[
                styles.faqItem,
                index === preguntas.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => toggleItem(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.faqText}>{item.pregunta}</Text>
              <MaterialIcons
                name={openIndex === index ? "expand-less" : "expand-more"}
                size={24}
                color={isDark ? "#94A3B8" : "#6B7280"}
              />
            </TouchableOpacity>

            {openIndex === index && (
              <View style={styles.respuestaContainer}>
                <Text style={styles.respuesta}>{item.respuesta}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.webLink}>{t("webSitio")}</Text>
        <Text style={styles.vigilada}>{t("vigiladaMinEducacion")}</Text>
      </View>
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
    faqItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#334155" : "#F3F4F6",
    },
    faqText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#E2E8F0" : "#374151",
      marginRight: 10,
    },
    respuestaContainer: {
      backgroundColor: isDark ? "#0F172A" : "#F9FAFB",
      borderRadius: 12,
      paddingHorizontal: 15,
      marginVertical: 5,
    },
    respuesta: {
      fontSize: 13,
      color: isDark ? "#94A3B8" : "#6B7280",
      lineHeight: 20,
      paddingVertical: 12,
    },
    footer: {
      alignItems: "center",
      paddingVertical: 25,
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
