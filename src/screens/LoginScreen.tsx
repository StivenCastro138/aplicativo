import React, { useState, useContext, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  useWindowDimensions,
  ScrollView,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authService } from "../config/authApi";
import { useAuth } from "../context/authContext";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

export default function LoginScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { login } = useAuth();
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);
  const languageContext = useContext(LanguageContext);
  const { t } = languageContext ?? { t: (key: string) => key };
  const scale = useMemo(() => (size: number) => (width / 375) * size, [width]);
  const isTablet = width > 768;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = async () => {
    if (email.trim() === "" || password.trim() === "") {
      Alert.alert(t("error"), t("correoYContrasenaRequeridos"));
      return;
    }

    setLoading(true);

    try {
      const { usuario, actividades } = await authService.login(email, password);
      await login(usuario, actividades);

      Alert.alert(
        `✅ ${t("bienvenido")}`,
        `${t("Hola")} ${usuario.nombre} ${usuario.apellido}\n\n${t("inicioSesionExitoso")}`,
      );
    } catch (error: any) {
      const errorMessage =
        error.message || t("credencialesInvalidasOErrorConexion");
      Alert.alert(t("error"), errorMessage);
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert(
      provider,
      `${t("autenticacionCon")} ${provider} ${t("disponibleProximamente")}`,
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View
        style={[
          styles.backgroundCircle,
          {
            top: -width * 0.2,
            right: -width * 0.2,
            width: width * 0.9,
            height: width * 0.9,
            borderRadius: width * 0.45,
          },
        ]}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                { width: scale(85), height: scale(85) },
              ]}
            >
              <Image
                source={{
                  uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ESCUDO%20BLANCO-lq2HlvrBo4JQUpo2S0PMPOOi8KpuPa.png",
                }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.title, { fontSize: scale(14) }]}>
              {t("APLICATIVO_MÓVIL_PARA_LA")}
              {"\n"}
              {t("GESTIÓN_REMOTA_DE")}
              {"\n"}
              {t("SISTEMAS_ACUAPÓNICOS")}
            </Text>
          </View>

          <View style={[styles.card, { padding: isTablet ? 40 : 24 }]}>
            <Text style={styles.cardTitle}>{t("iniciarSesion")}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("correoElectronico")}</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused === "email" && styles.inputFocused,
                ]}
              >
                <MaterialIcons
                  name="alternate-email"
                  size={20}
                  color={isDark ? "#34D399" : "#10B981"}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="usuario@ucundinamarca.edu.co"
                  placeholderTextColor={isDark ? "#94A3B8" : "#9CA3AF"}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("contrasena")}</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused === "password" && styles.inputFocused,
                ]}
              >
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color={isDark ? "#34D399" : "#10B981"}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? "#94A3B8" : "#9CA3AF"}
                  editable={!loading}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={22}
                    color={isDark ? "#94A3B8" : "#6B7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotText}>
                {t("olvidasteTuContrasena")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator
                  color={isDark ? "#064E3B" : "white"}
                  size="small"
                />
              ) : (
                <Text style={styles.primaryButtonText}>{t("ingresar")}</Text>
              )}
            </TouchableOpacity>
            {/* 
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t("oIngresarCon")}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialGroup}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin("Google")}
                disabled={loading}
              >
                <Image
                  source={{
                    uri: "https://developers.google.com/identity/images/g-logo.png",
                  }}
                  style={styles.socialIcon}
                />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, { marginTop: 12 }]}
                onPress={() => handleSocialLogin("Microsoft")}
                disabled={loading}
              >
                <Image
                  source={{
                    uri: "https://res.cloudinary.com/dst5fbura/image/upload/v1771112961/Microsoft_logo_ltfdt4.png",
                  }}
                  style={styles.socialIcon}
                />
                <Text style={styles.socialButtonText}>Microsoft 365</Text>
              </TouchableOpacity>
            </View>
            */}
          </View>

          <View style={styles.footer}>
            <Text style={styles.webLink} onPress={() => Linking.openURL("https://www.ucundinamarca.edu.co")}>{t("webSitio")}</Text>
            <Text style={styles.vigilada}>{t("vigiladaMinEducacion")}</Text>
          </View>
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121212" : "#F0FDF4",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
    },
    backgroundCircle: {
      position: "absolute",
      backgroundColor: isDark ? "#1E293B" : "#D1FAE5",
      zIndex: -1,
    },
    header: {
      alignItems: "center",
      marginBottom: 30,
    },
    logoContainer: {
      backgroundColor: "#2E7D32",
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
      elevation: 8,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    logo: {
      width: "75%",
      height: "75%",
    },
    title: {
      fontWeight: "700",
      color: isDark ? "#34D399" : "#064E3B",
      textAlign: "center",
      lineHeight: 22,
      marginBottom: -10,
    },
    card: {
      backgroundColor: isDark ? "#1E1E1E" : "white",
      borderRadius: 28,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
      width: "100%",
      maxWidth: 450,
      alignSelf: "center",
    },
    cardTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#F1F5F9" : "#1F2937",
      marginBottom: 25,
      textAlign: "center",
    },
    inputGroup: {
      marginBottom: 18,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#94A3B8" : "#4B5563",
      marginBottom: 8,
      marginLeft: 4,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#0F172A" : "#F9FAFB",
      borderWidth: 1.5,
      borderColor: isDark ? "#334155" : "#E5E7EB",
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 56,
    },
    inputFocused: {
      borderColor: isDark ? "#34D399" : "#10B981",
      backgroundColor: isDark ? "#1E293B" : "white",
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: isDark ? "#F1F5F9" : "#1F2937",
      marginLeft: 10,
    },
    icon: {
      marginRight: 0,
    },
    forgotButton: {
      alignSelf: "flex-end",
      marginBottom: 25,
    },
    forgotText: {
      color: isDark ? "#34D399" : "#10B981",
      fontWeight: "600",
      fontSize: 14,
    },
    primaryButton: {
      backgroundColor: isDark ? "#34D399" : "#2E7D32",
      borderRadius: 16,
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      shadowColor: isDark ? "#34D399" : "#2E7D32",
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      color: isDark ? "#064E3B" : "white",
      fontSize: 17,
      fontWeight: "bold",
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 25,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? "#334155" : "#E5E7EB",
    },
    dividerText: {
      marginHorizontal: 12,
      color: isDark ? "#94A3B8" : "#9CA3AF",
      fontSize: 13,
    },
    socialGroup: {
      width: "100%",
    },
    socialButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
      borderRadius: 16,
      height: 54,
      borderWidth: 1.2,
      borderColor: isDark ? "#334155" : "#E5E7EB",
    },
    socialIcon: {
      width: 22,
      height: 22,
      marginRight: 12,
      resizeMode: "contain",
    },
    socialButtonText: {
      color: isDark ? "#E2E8F0" : "#374151",
      fontWeight: "600",
      fontSize: 15,
    },
    footer: {
      alignItems: "center",
      marginTop: 35,
    },
    webLink: {
      color: isDark ? "#34D399" : "#2E7D32",
      fontWeight: "700",
      fontSize: 14,
    },
    vigilada: {
      color: isDark ? "#94A3B8" : "#9CA3AF",
      fontSize: 11,
      marginTop: 4,
    },
  });
