import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

export default function SoporteScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [mensaje, setMensaje] = useState("");

  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);

  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  const handleEnviar = async () => {
    if (!mensaje.trim()) {
      Alert.alert(t("error"), t("nohaymensaje") || "Por favor, escribe un mensaje.");
      return;
    }

    const emailTo = "soporte.proyectoacuaponiaia@gmail.com"; 
    const subject = "Soporte App FishTrace";
    const body = mensaje;

    const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      
      if (supported) {
        await Linking.openURL(mailtoUrl);
        setMensaje(""); 
      } else {
        Alert.alert(t("error"), t("noSeEncontroAppCorreo"));
      }
    } catch (error) {
      Alert.alert(t("error"), t("huboUnProblemaAlAbrirElCorreo"));
      console.error("Error al abrir el correo: ", error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons 
              name="arrow-back" 
              size={24} 
              color={isDark ? "#34D399" : "#007b3e"} 
            />
          </TouchableOpacity>

          <Text style={styles.subHeaderTitle}>{t("soporte")}</Text>
          <View style={{ width: 24 }} /> 
        </View>

        <View style={styles.card}>
          <Text style={styles.description}>
            {t("soporteDescripcion")}
            {"\n\n"}
            {t("soporteDescripcion2")}
          </Text>

          <Text style={styles.subtitle}>
            {t("queremosConocerTuOpinion") || "Dinos qué piensas"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder={t("buscarplaceholder") || "Escribe aquí..."}
            placeholderTextColor={isDark ? "#94A3B8" : "#9CA3AF"}
            multiline
            numberOfLines={5}
            value={mensaje}
            onChangeText={setMensaje}
            blurOnSubmit={true}
          />

          <TouchableOpacity style={styles.button} onPress={handleEnviar}>
            <Text style={styles.buttonText}>{t("confirmar")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.webLink} onPress={() => Linking.openURL("https://www.ucundinamarca.edu.co")}>{t("webSitio")}</Text>
          <Text style={styles.vigilada}>{t("vigiladaMinEducacion")}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
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
  card: {
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    padding: 20,
    borderRadius: 28,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  description: {
    fontSize: 14,
    color: isDark ? "#94A3B8" : "#374151",
    lineHeight: 20,
    textAlign: "justify",
  },
  subtitle: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "700",
    color: isDark ? "#F1F5F9" : "#1E2937",
  },
  input: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: isDark ? "#334155" : "#E5E7EB",
    borderRadius: 12,
    padding: 15,
    textAlignVertical: "top",
    backgroundColor: isDark ? "#0F172A" : "#F9FAFB",
    color: isDark ? "#F1F5F9" : "#1E2937",
    minHeight: 120, 
  },
  button: {
    marginTop: 20,
    backgroundColor: isDark ? "#34D399" : "#007b3e",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: isDark ? "#064E3B" : "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
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