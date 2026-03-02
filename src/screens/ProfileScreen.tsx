import React, { useMemo, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/authContext";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

interface InfoItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  isRole?: boolean;
}

export default function PerfilScreen() {
  const { user } = useAuth();
  const userData = user as any;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = useMemo(() => (size: number) => (width / 375) * size, [width]);

  const nombreCompleto = `${userData?.nombre || "Usuario"} ${userData?.apellido || ""}`.trim();
  const safeName = encodeURIComponent(nombreCompleto);
  const avatarUrl = `https://ui-avatars.com/api/?name=${safeName}&background=007b3e&color=fff&size=512&bold=true`;

  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);

  const languageContext = useContext(LanguageContext);
  const { t } = languageContext || { t: (key: string) => key };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ height: insets.top + 20 }} />

      <View style={styles.menuContainer}>
        {/* BOTÓN REGRESAR */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="arrow-back"
            size={scale(24)}
            color={isDark ? "#34D399" : "#007b3e"}
          />
        </TouchableOpacity>

        {/* HEADER PERFIL */}
        <View style={styles.profileHeader}>
          <View
            style={[
              styles.avatarWrapper,
              { width: scale(140), height: scale(140) },
            ]}
          >
            <Image
              source={{ uri: avatarUrl }}
              style={[styles.profileImage, { borderRadius: scale(70) }]}
            />
          </View>

          <Text style={[styles.title, { fontSize: scale(22) }]}>
            {t("miCuenta")}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* INFO USUARIO */}
        <View style={styles.infoSection}>
          <InfoItem
            icon="person-outline"
            label={t("usuario")}
            value={nombreCompleto}
          />

          <InfoItem
            icon="mail-outline"
            label={t("correoElectronico")}
            value={userData?.correo || "No disponible"}
          />

          <InfoItem
            icon="admin-panel-settings"
            label={t("rolAcceso")}
            value={
              userData?.rol === "institucional"
                ? t("administrador")
                : t("invitado")
            }
            isRole
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.webLink}>{t("webSitio")}</Text>
        <Text style={styles.vigilada}>{t("vigiladaMinEducacion")}</Text>
      </View>
    </ScrollView>
  );
}

function InfoItem({ icon, label, value, isRole = false }: InfoItemProps) {
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);

  return (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <MaterialIcons
          name={icon}
          size={22}
          color={isDark ? "#34D399" : "#007b3e"}
        />
      </View>

      <View style={styles.textGroup}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, isRole && styles.roleText]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const getStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? "#121212" : "#F0FDF4",
    },

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

    backButton: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },

    profileHeader: {
      alignItems: "center",
      marginBottom: 25,
    },

    avatarWrapper: {
      elevation: 10,
      shadowColor: dark ? "#000" : "#007b3e",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      marginBottom: 15,
    },

    profileImage: {
      width: "100%",
      height: "100%",
      borderWidth: 4,
      borderColor: dark ? "#065F46" : "#D1FAE5",
    },

    title: {
      fontWeight: "800",
      color: dark ? "#F1F5F9" : "#1F2937",
    },

    divider: {
      height: 1.5,
      backgroundColor: dark ? "#34D399" : "#007b3e",
      marginBottom: 25,
    },

    infoSection: {
      paddingHorizontal: 5,
    },

    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },

    iconBox: {
      width: 44,
      height: 44,
      backgroundColor: dark ? "#0F172A" : "#F0FDF4",
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },

    textGroup: {
      marginLeft: 15,
      flex: 1,
    },

    label: {
      fontSize: 11,
      color: dark ? "#94A3B8" : "#9CA3AF",
      textTransform: "uppercase",
      fontWeight: "700",
      letterSpacing: 0.5,
    },

    value: {
      fontSize: 15,
      color: dark ? "#E2E8F0" : "#374151",
      fontWeight: "600",
      marginTop: 2,
    },

    roleText: {
      color: dark ? "#34D399" : "#007b3e",
    },

    footer: {
      alignItems: "center",
      paddingVertical: 20,
    },

    webLink: {
      color: dark ? "#34D399" : "#007b3e",
      fontWeight: "700",
      fontSize: 13,
    },

    vigilada: {
      color: dark ? "#94A3B8" : "#9CA3AF",
      fontSize: 10,
      marginTop: 4,
    },
  });