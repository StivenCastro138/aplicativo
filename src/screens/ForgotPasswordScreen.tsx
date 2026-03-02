"use client";

import { useState, useMemo, useContext } from "react";
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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { recuperacionService } from "../services/recuperacionService";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

interface ForgotPasswordScreenProps {
  navigation: any;
}

type Step = "email" | "code" | "password";

export default function ForgotPasswordScreen({
  navigation,
}: ForgotPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = useMemo(() => (size: number) => (width / 375) * size, [width]);
  const isTablet = width > 768;

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);
  const languageContext = useContext(LanguageContext);
  const { t } = languageContext ?? { t: (key: string) => key };

  const handleSendCode = async () => {
    const emailLimpio = email.trim().toLowerCase();

    if (!emailLimpio.endsWith("@ucundinamarca.edu.co")) {
      Alert.alert(t("error"), t("soloUsuariosInstitucionales"));
      return;
    }

    setLoading(true);
    try {
      const response =
        await recuperacionService.solicitarRecuperacion(emailLimpio);
      if (!response.success) {
        Alert.alert(t("error"), response.message);
        return;
      }

      setSuccessMessage(t("codigoEnviadoCorrectamente"));
      setShowSuccessMessage(true);
      setStep("code");

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert(t("error"), t("codigoDebeTener6Digitos"));
      return;
    }
    setLoading(true);
    try {
      const response = await recuperacionService.verificarCodigo(
        email,
        verificationCode,
      );
      if (response.success && response.usuarioId) {
        setRecoveryToken(response.token ?? "");
        setStep("password");
      } else {
        Alert.alert(t("codigoIncorrecto"), response.message);
      }
    } catch (error: any) {
      Alert.alert(t("error"), t("noSePudoVerificarCodigo"));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert(t("error"), t("contrasenaDemasiadoCorta"));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t("error"), t("contrasenasNoCoinciden"));
      return;
    }
    setLoading(true);
    try {
      const response = await recuperacionService.cambiarContrasena(
        recoveryToken,
        newPassword,
      );
      if (response.success) {
        Alert.alert(t("registrado"), t("contrasenaActualizadaCorrectamente"), [
          { text: t("irAlLogin"), onPress: () => navigation.navigate("Login") },
        ]);
      }
    } catch (error: any) {
      Alert.alert(t("error"), t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (step === "password") setStep("code");
    else if (step === "code") setStep("email");
    else navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View
        style={[
          styles.backgroundCircle,
          {
            width: width * 1.1,
            height: width * 1.1,
            top: -width * 0.4,
            right: -width * 0.2,
          },
        ]}
      />

      <TouchableOpacity
        style={[styles.backButtonFixed, { top: insets.top + 10 }]}
        onPress={handleGoBack}
        disabled={loading}
      >
        <MaterialIcons
          name="arrow-back"
          size={24}
          color={isDark ? "#34D399" : "#064E3B"}
        />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
            <Text style={[styles.appName, { fontSize: scale(18) }]}>
              {step === "email"
                ? t("volver")
                : step === "code"
                  ? t("verificarCodigotitulo")
                  : t("nuevaContrasenatitulo")}
            </Text>
          </View>

          <View style={[styles.card, { padding: isTablet ? 40 : 24 }]}>
            {step !== "password" && (
              <Text style={styles.descriptionText}>
                {step === "email"
                  ? t("soloUsuariosInstitucionales")
                  : `${t("verificarCodigotexto")}: ${email}`}
              </Text>
            )}

            {showSuccessMessage && (
              <View style={styles.successMessageContainer}>
                <MaterialIcons name="check-circle" size={20} color="#10B981" />
                <Text style={styles.successMessageText}>{successMessage}</Text>
              </View>
            )}

            {step === "email" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("correoElectronico")}</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="alternate-email"
                    size={20}
                    color={isDark ? "#34D399" : "#10B981"}
                  />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="usuario@ucundinamarca.edu.co"
                    placeholderTextColor={isDark ? "#94A3B8" : "#9CA3AF"}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("enviarCodigo")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === "code" && (
              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="lock-clock"
                    size={20}
                    color={isDark ? "#34D399" : "#10B981"}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { textAlign: "center", letterSpacing: 5, fontSize: 20 },
                    ]}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="numeric"
                    maxLength={6}
                    textContentType="oneTimeCode"
                    placeholder="000000"
                    placeholderTextColor={isDark ? "#94A3B8" : "#9CA3AF"}
                    editable={!loading}
                  />
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("verificarboton")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === "password" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("nuevaContrasena")}</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="lock-outline"
                    size={20}
                    color={isDark ? "#34D399" : "#10B981"}
                  />
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    placeholder={t("nuevaContrasenaplaceholder")}
                    placeholderTextColor={isDark ? "#94A3B8" : "#9CA3AF"}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <MaterialIcons
                      name={showNewPassword ? "visibility" : "visibility-off"}
                      size={22}
                      color={isDark ? "#94A3B8" : "#6B7280"}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>
                  {t("confirmarNuevaContrasena")}
                </Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="lock-outline"
                    size={20}
                    color={isDark ? "#34D399" : "#10B981"}
                  />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholder={t("confirmarNuevaContrasenaplaceholder")}
                    placeholderTextColor={isDark ? "#94A3B8" : "#9CA3AF"}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <MaterialIcons
                      name={
                        showConfirmPassword ? "visibility" : "visibility-off"
                      }
                      size={22}
                      color={isDark ? "#94A3B8" : "#6B7280"}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("actualizarcontrasena")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.webLink}>{t("webSitio")}</Text>
            <Text style={styles.vigilada}>{t("vigiladaMinEducacion")}</Text>
          </View>
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
      borderRadius: 999,
    },
    backButtonFixed: {
      position: "absolute",
      left: 20,
      zIndex: 10,
      backgroundColor: isDark ? "#1E293B" : "rgba(255,255,255,0.7)",
      padding: 8,
      borderRadius: 12,
    },
    header: { alignItems: "center", marginBottom: 30 },
    logoContainer: {
      backgroundColor: "#2E7D32",
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
      elevation: 8,
    },
    logo: { width: "75%", height: "75%" },
    appName: {
      fontWeight: "800",
      color: isDark ? "#34D399" : "#064E3B",
      textAlign: "center",
    },
    card: {
      backgroundColor: isDark ? "#1E1E1E" : "white",
      borderRadius: 28,
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 20,
      paddingVertical: 30,
    },
    descriptionText: {
      fontSize: 14,
      color: isDark ? "#94A3B8" : "#6B7280",
      textAlign: "center",
      marginBottom: 20,
      paddingHorizontal: 10,
    },
    inputGroup: { marginBottom: 15 },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#E2E8F0" : "#4B5563",
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
      marginBottom: 20,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: isDark ? "#F1F5F9" : "#1F2937",
      marginLeft: 10,
    },
    primaryButton: {
      backgroundColor: isDark ? "#34D399" : "#2E7D32",
      borderRadius: 16,
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
    },
    primaryButtonText: {
      color: isDark ? "#064E3B" : "white",
      fontSize: 17,
      fontWeight: "bold",
    },
    footer: { alignItems: "center", marginTop: 35 },
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
    successMessageContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#065F46" : "#DCFCE7",
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
    },
    successMessageText: {
      color: "#10B981",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 8,
    },
  });
