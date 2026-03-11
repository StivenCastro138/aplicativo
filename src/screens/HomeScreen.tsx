"use client";

import {
  StatusBar,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  Linking
} from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../context/authContext";
import { useAlert } from "../context/AlertContext";
import { truchasService, lechugasService } from "../services/apiService";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuth();
  const { alertasActivas, verificarAlertas } = useAlert();
  const userData = user as any;
  const avatarUrl = `https://ui-avatars.com/api/?name=${userData?.nombre || "U"}+${userData?.apellido || ""}&background=ffffff&color=007b3e&size=512&bold=true`;
  const [dataTruchas, setDataTruchas] = useState<any>(null);
  const [dataLechugas, setDataLechugas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);
  const languageContext = useContext(LanguageContext);
  const { t } = languageContext ?? { t: (key: string) => key };

  const fetchDashboardData = async () => {
    try {
      const [latestTruchas, latestLechugas] = await Promise.all([
        truchasService.getLatestValues(),
        lechugasService.getLatestValues(),
      ]);

      console.log("🐟 Datos Truchas recibidos en Home:", latestTruchas);
      console.log("🥬 Datos Lechugas recibidos en Home:", latestLechugas);

      setDataTruchas(latestTruchas);
      setDataLechugas(latestLechugas);
      await verificarAlertas();
    } catch (error) {
      console.error("❌ Error al sincronizar Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const alertasCriticas = alertasActivas.filter(
    (a) => a.severidad === "critica" || a.severidad === "alta",
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#121212" : "#F0FDF4"}
      />

      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.welcomeText}>
            {t("Hola")}, {user?.nombre || "Usuario"} 👋
          </Text>
          <Text style={styles.dateText}>
            {t("UltimaMedicion")}: {new Date().toLocaleTimeString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate("Perfil")}
        >
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.statusCard,
          {
            backgroundColor:
              alertasCriticas.length > 0
                ? isDark
                  ? "#7F1D1D"
                  : "#FEE2E2"
                : isDark
                  ? "#064E3B"
                  : "#D1FAE5",
            borderColor: alertasCriticas.length > 0 ? "#EF4444" : "#10B981",
          },
        ]}
      >
        <MaterialIcons
          name={alertasCriticas.length > 0 ? "warning" : "check-circle"}
          size={40}
          color={alertasCriticas.length > 0 ? "#DC2626" : "#059669"}
        />
        <View style={styles.statusInfo}>
          <Text
            style={[
              styles.statusTitle,
              {
                color:
                  alertasCriticas.length > 0
                    ? isDark
                      ? "#FECACA"
                      : "#991B1B"
                    : isDark
                      ? "#A7F3D0"
                      : "#065F46",
              },
            ]}
          >
            {alertasCriticas.length > 0
              ? t("AtencionRequerida")
              : t("SistemaOptimo")}
          </Text>
          <Text style={styles.statusSubtitle}>
            {alertasCriticas.length > 0
              ? `${alertasCriticas.length} ${t("anomaliasDetectadas")}`
              : t("ParametrosRangosIdeales")}
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("TemperaturaEnTiempoReal")}</Text>
        {loading && <ActivityIndicator size="small" color="#007b3e" />}
      </View>

      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => navigation.navigate("Cultivos")}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#DCFCE7" }]}>
            <MaterialIcons name="eco" size={22} color="#16A34A" />
          </View>
          <Text style={styles.gridValue}>
            {dataLechugas?.temperatura?.toFixed(1) || "--"}{" "}
            {t("GRADOS_CELSIUS")}
          </Text>
          <Text style={styles.gridLabel}>{t("TemperaturaCultivos")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => navigation.navigate("Tanques")}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#E0F2FE" }]}>
            <FontAwesome5 name="fish" size={18} color="#0284C7" />
          </View>
          <Text style={styles.gridValue}>
            {dataTruchas?.temperaturaC?.toFixed(1) ||
              dataTruchas?.temperatura?.toFixed(1) ||
              "--"}{" "}
            {t("GRADOS_CELSIUS")}
          </Text>
          <Text style={styles.gridLabel}>{t("TemperaturaTanques")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("AlertasDelSistema")}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Alertas")}>
          <Text style={styles.seeMore}>{t("Historial")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.alertsContainer}>
        {alertasActivas.length > 0 ? (
          alertasActivas.slice(0, 3).map((alerta) => (
            <View key={alerta.id} style={styles.alertItem}>
              <View
                style={[
                  styles.alertDot,
                  {
                    backgroundColor:
                      alerta.severidad === "critica" ? "#EF4444" : "#F59E0B",
                  },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>{alerta.mensaje}</Text>
                <Text style={styles.alertTime}>
                  {new Date(alerta.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="verified-user"
              size={30}
              color={isDark ? "#4B5563" : "#D1D5DB"}
            />
            <Text style={styles.emptyAlerts}>{t("SinAlertasPendientes")}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.webLink} onPress={() => Linking.openURL("https://www.ucundinamarca.edu.co")}>{t("webSitio")}</Text>
        <Text style={styles.vigilada}>{t("vigiladaMinEducacion")}</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#121212" : "#F0FDF4" },
    welcomeSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 25,
      paddingTop: 30,
      marginBottom: 25,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: "800",
      color: isDark ? "#FFF" : "#1E2937",
    },
    dateText: {
      fontSize: 13,
      color: isDark ? "#94A3B8" : "#64748B",
      marginTop: 2,
    },
    avatarBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDark ? "#1E1E1E" : "white",
      elevation: 4,
      borderWidth: 2,
      borderColor: "#007b3e",
      overflow: "hidden",
    },
    avatarImage: { width: "100%", height: "100%" },
    statusCard: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      padding: 18,
      borderRadius: 24,
      marginBottom: 30,
      borderWidth: 2,
      elevation: 2,
    },
    statusInfo: { marginLeft: 15, flex: 1 },
    statusTitle: { fontSize: 17, fontWeight: "bold" },
    statusSubtitle: {
      fontSize: 13,
      color: isDark ? "#94A3B8" : "#64748B",
      marginTop: 2,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 25,
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: isDark ? "#94A3B8" : "#334155",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    seeMore: { color: "#10B981", fontWeight: "bold", fontSize: 13 },
    quickGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 35,
    },
    gridCard: {
      backgroundColor: isDark ? "#1E1E1E" : "white",
      width: (width - 60) / 2,
      paddingVertical: 20,
      borderRadius: 22,
      alignItems: "center",
      elevation: 5,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    gridValue: {
      fontSize: 18,
      fontWeight: "800",
      color: isDark ? "#FFF" : "#1E2937",
    },
    gridLabel: {
      fontSize: 11,
      color: isDark ? "#94A3B8" : "#64748B",
      marginTop: 4,
      fontWeight: "600",
    },
    alertsContainer: {
      marginHorizontal: 20,
      backgroundColor: isDark ? "#1E1E1E" : "white",
      borderRadius: 24,
      padding: 10,
      elevation: 4,
      marginBottom: 20,
    },
    alertItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#333" : "#F8FAFC",
    },
    alertDot: { width: 8, height: 8, borderRadius: 4, marginRight: 15 },
    alertTitle: {
      fontSize: 14,
      color: isDark ? "#DDD" : "#334155",
      fontWeight: "600",
    },
    alertTime: {
      fontSize: 11,
      color: isDark ? "#666" : "#94A3B8",
      marginTop: 2,
    },
    emptyState: { alignItems: "center", padding: 30 },
    emptyAlerts: { color: "#94A3B8", fontSize: 13, marginTop: 10 },
    footer: { alignItems: "center", paddingVertical: 25 },
    webLink: { color: "#10B981", fontWeight: "700", fontSize: 14 },
    vigilada: { color: "#666", fontSize: 11, marginTop: 4 },
  });
