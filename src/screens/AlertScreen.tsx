import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  Alert,
  FlatList,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAlert, Alerta } from "../context/AlertContext";
import { useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

type ModuloType = "tanques" | "cultivos" | null;
type SeveridadType = "critica" | null;

export default function AlertasScreen() {
  const navigation = useNavigation<any>();
  const { alertas, limpiarAlertas, marcarComoVista } = useAlert();
  const [searchText, setSearchText] = useState("");
  const [filtroModulo, setFiltroModulo] = useState<ModuloType>(null);
  const [filtroSeveridad, setFiltroSeveridad] = useState<SeveridadType>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alerta | null>(null);
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);
  const languageContext = useContext(LanguageContext);
  const { t } = languageContext ?? { t: (key: string) => key };
  const alertasFiltradas = alertas.filter((a) => {
    const coincideTexto =
      searchText === "" ||
      a.tipo.toLowerCase().includes(searchText.toLowerCase()) ||
      (a.mensaje && a.mensaje.toLowerCase().includes(searchText.toLowerCase()));

    if (!coincideTexto) return false;

    if (filtroSeveridad === "critica" && filtroModulo) {
      return a.severidad === "critica" && a.modulo === filtroModulo;
    }
    if (filtroSeveridad) return a.severidad === "critica";
    if (filtroModulo) return a.modulo === filtroModulo;

    return true;
  });

  const getSeverityColor = (s: string) => {
    switch (s) {
      case "critica":
        return "#EF4444";
      case "alta":
        return "#F59E0B";
      case "media":
        return "#3B82F6";
      case "baja":
        return "#10B981";
      default:
        return "#94A3B8";
    }
  };

  const renderAlerta = ({ item: alerta }: { item: Alerta }) => (
    <View style={{ paddingHorizontal: 20 }}>
      <TouchableOpacity
        style={styles.alertCard}
        onPress={() => setSelectedAlert(alerta)}
      >
        <View
          style={[
            styles.cardIndicator,
            { backgroundColor: getSeverityColor(alerta.severidad) },
          ]}
        />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text
              style={[
                styles.moduleLabel,
                { color: alerta.modulo === "cultivos" ? "#059669" : "#0284C7" },
              ]}
            >
              {alerta.modulo === "tanques"
                ? `🐟 ${t("tanques")}`
                : `🥬 ${t("cultivos")}`}
            </Text>
            <Text style={styles.timeLabel}>
              {new Date(alerta.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <Text style={styles.alertTitle}>
            {alerta.tipo.charAt(0).toUpperCase() + alerta.tipo.slice(1)}:{" "}
            {alerta.valor}
          </Text>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: getSeverityColor(alerta.severidad) },
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {alerta.severidad.toUpperCase()}
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007b3e" />

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
        <Text style={styles.subHeaderTitle}>{t("alertas")}</Text>
        <TouchableOpacity
          onPress={() => {
            if (alertas.length === 0) return;
            Alert.alert(
              t("confirmarEliminacion"),
              t("seguroEliminarAlertas"),
              [
                { text: t("cancelar"), style: "cancel" },
                {
                  text: t("eliminar"),
                  style: "destructive",
                  onPress: () => limpiarAlertas(),
                },
              ],
              { cancelable: true },
            );
          }}
        >
          <MaterialIcons name="delete-sweep" size={26} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={alertasFiltradas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAlerta}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color="#94A3B8" />
              <TextInput
                placeholder={t("buscarPlaceholder")}
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContainer}
              >
                <FilterTab
                  label={t("todos")}
                  active={!filtroModulo && !filtroSeveridad}
                  onPress={() => {
                    setFiltroModulo(null);
                    setFiltroSeveridad(null);
                  }}
                  count={alertas.length}
                  dark={isDark}
                />

                <FilterTab
                  label={t("tanques")}
                  active={filtroModulo === "tanques"}
                  onPress={() =>
                    setFiltroModulo(
                      filtroModulo === "tanques" ? null : "tanques",
                    )
                  }
                  count={alertas.filter((a) => a.modulo === "tanques").length}
                  dark={isDark}
                />

                <FilterTab
                  label={t("cultivos")}
                  active={filtroModulo === "cultivos"}
                  onPress={() =>
                    setFiltroModulo(
                      filtroModulo === "cultivos" ? null : "cultivos",
                    )
                  }
                  count={alertas.filter((a) => a.modulo === "cultivos").length}
                  dark={isDark}
                />

                <FilterTab
                  label={t("criticas")}
                  active={filtroSeveridad === "critica"}
                  onPress={() =>
                    setFiltroSeveridad(
                      filtroSeveridad === "critica" ? null : "critica",
                    )
                  }
                  count={
                    alertas.filter((a) => a.severidad === "critica").length
                  }
                  dark={isDark}
                />
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="check-circle" size={60} color="#E2E8F0" />
            <Text style={styles.emptyText}>{t("sinRegistros")}</Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedAlert}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedAlert(null)}
          />

          {selectedAlert && (
            <View style={styles.modalContent}>
              <View
                style={[
                  styles.modalHeader,
                  {
                    backgroundColor: getSeverityColor(selectedAlert.severidad),
                  },
                ]}
              >
                <MaterialIcons name="report-problem" size={28} color="white" />
                <Text style={styles.modalTitle}>{t("fichaIncidencia")}</Text>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="access-time" size={18} color="#94A3B8" />
                  <Text style={styles.detailText}>
                    {t("registrado")}{" "}
                    <Text style={styles.boldText}>
                      {new Date(selectedAlert.timestamp).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        },
                      )}
                    </Text>
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="layers" size={18} color="#94A3B8" />
                  <Text style={styles.detailText}>
                    {t("modulo")}:{" "}
                    <Text style={styles.boldText}>
                      {selectedAlert.modulo === "tanques"
                        ? t("pecesTruchas")
                        : t("cultivosLechugas")}
                    </Text>
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="assessment" size={18} color="#94A3B8" />
                  <Text style={styles.detailText}>
                    {t("variable")}:{" "}
                    <Text style={styles.boldText}>
                      {selectedAlert.tipo.charAt(0).toUpperCase() +
                        selectedAlert.tipo.slice(1)}
                    </Text>
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.valuesGrid}>
                  <View style={styles.valueItem}>
                    <Text style={styles.modalLabel}>{t("valorActual")}</Text>
                    <Text
                      style={[
                        styles.modalValueLarge,
                        { color: getSeverityColor(selectedAlert.severidad) },
                      ]}
                    >
                      {selectedAlert.valor}
                    </Text>
                  </View>
                  <View style={styles.valueItem}>
                    <Text style={styles.modalLabel}>{t("rangoOptimo")}</Text>
                    <Text style={styles.modalValueSmall}>
                      {selectedAlert.limite.min} - {selectedAlert.limite.max}
                    </Text>
                  </View>
                </View>

                <View style={styles.recommendationBox}>
                  <Text style={styles.recommendationTitle}>
                    ⚠️ {t("recomendacionTecnica")}
                  </Text>
                  <Text style={styles.modalDescText}>
                    {selectedAlert.mensaje}
                  </Text>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.readBtn}
                  onPress={() => {
                    const idAEliminar = selectedAlert.id;
                    setSelectedAlert(null);
                    setTimeout(() => {
                      marcarComoVista(idAEliminar);
                    }, 100);
                  }}
                >
                  <MaterialIcons
                    name="check-circle"
                    size={22}
                    color="#059669"
                  />
                  <Text style={styles.readBtnText}>
                    {t("marcarComoRevisada")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedAlert(null)}
                >
                  <Text style={styles.closeBtnText}>{t("cerrar")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const FilterTab = ({ label, active, onPress, count, dark }: any) => {
  const styles = getStyles(dark);

  return (
    <TouchableOpacity
      style={[styles.filterTab, active && styles.filterTabActive]}
      onPress={onPress}
    >
      <Text
        style={[styles.filterTabText, active && styles.filterTabTextActive]}
      >
        {label}
      </Text>
      <View style={[styles.countBadge, active && styles.countBadgeActive]}>
        <Text style={[styles.countText, active && styles.countTextActive]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (dark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: dark ? "#121212" : "#F0FDF4" },
    subHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: dark ? "#121212" : "#F0FDF4",
      marginBottom: -15,
    },
    subHeaderTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: dark ? "#fff" : "#1E2937",
    },
    backBtn: { padding: 5 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: dark ? "#1E1E1E" : "#fff",
      margin: 20,
      paddingHorizontal: 15,
      height: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: dark ? "#333" : "#E2E8F0",
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 14,
      color: dark ? "#fff" : "#1E2937",
    },
    filterContainer: {
      backgroundColor: dark ? "#121212" : "#F0FDF4",
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingBottom: 15,
      gap: 10,
    },
    filterTab: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: dark ? "#1E1E1E" : "#fff",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: dark ? "#333" : "#E2E8F0",
    },
    filterTabActive: {
      backgroundColor: dark ? "#064e3b" : "#007b3e",
      borderColor: "#007b3e",
    },
    filterTabText: {
      fontSize: 12,
      color: dark ? "#ccc" : "#64748B",
      fontWeight: "600",
    },
    filterTabTextActive: { color: "#fff" },
    countBadge: {
      backgroundColor: dark ? "#333" : "#F1F5F9",
      paddingHorizontal: 6,
      borderRadius: 6,
      marginLeft: 6,
    },
    countBadgeActive: { backgroundColor: "rgba(255,255,255,0.2)" },
    countText: {
      fontSize: 10,
      color: dark ? "#ccc" : "#64748B",
      fontWeight: "bold",
    },
    countTextActive: { color: "#fff" },
    listWrapper: { paddingHorizontal: 20, paddingBottom: 30 },
    alertCard: {
      backgroundColor: dark ? "#1E1E1E" : "#fff",
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderRadius: 22,
      marginBottom: 12,
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.05,
    },
    cardIndicator: { width: 5, height: 45, borderRadius: 10, marginRight: 15 },
    cardContent: { flex: 1 },
    cardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    moduleLabel: {
      fontSize: 10,
      fontWeight: "900",
      color: dark ? "#fff" : undefined,
    },
    timeLabel: { fontSize: 10, color: dark ? "#888" : "#94A3B8" },
    alertTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: dark ? "#fff" : "#1E2937",
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      alignSelf: "flex-start",
      marginTop: 5,
    },
    typeBadgeText: { fontSize: 8, color: "white", fontWeight: "900" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      justifyContent: "center",
      padding: 20,
    },
    modalContent: {
      backgroundColor: dark ? "#1E1E1E" : "#fff",
      borderRadius: 28,
      overflow: "hidden",
      elevation: 10,
    },
    modalHeader: {
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    modalTitle: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "900",
      marginLeft: 10,
      letterSpacing: 1,
    },
    modalBody: { padding: 25 },
    detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    detailText: {
      fontSize: 13,
      color: dark ? "#ccc" : "#64748B",
      marginLeft: 10,
    },
    boldText: { fontWeight: "700", color: dark ? "#fff" : "#1E2937" },
    divider: {
      height: 1,
      backgroundColor: dark ? "#333" : "#F1F5F9",
      marginVertical: 15,
    },
    valuesGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    valueItem: { flex: 1 },
    modalLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: dark ? "#888" : "#94A3B8",
      marginBottom: 5,
    },
    modalDescText: {
      fontSize: 13,
      color: dark ? "#ccc" : "#475569",
      lineHeight: 18,
    },
    modalFooter: {
      borderTopWidth: 1,
      borderTopColor: dark ? "#333" : "#F1F5F9",
    },
    readBtnText: {
      color: dark ? "#5fd77f" : "#059669",
      fontWeight: "800",
      marginLeft: 8,
    },
    closeBtn: {
      padding: 18,
      alignItems: "center",
      backgroundColor: dark ? "#1E1E1E" : "#fff",
    },
    closeBtnText: { color: dark ? "#888" : "#94A3B8", fontWeight: "700" },
    emptyState: { alignItems: "center", marginTop: 50 },
    emptyText: { color: dark ? "#888" : "#94A3B8", marginTop: 10 },
    recommendationBox: {
      backgroundColor: dark ? "#1E1E1E" : "#F8FAFC",
      padding: 15,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: dark ? "#333" : "#E2E8F0",
      marginTop: 10,
    },
    recommendationTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: dark ? "#fff" : "#1E2937",
      marginBottom: 4,
    },
    modalValueLarge: {
      fontSize: 36,
      fontWeight: "900",
      letterSpacing: -1,
      color: dark ? "#fff" : undefined,
    },
    modalValueSmall: {
      fontSize: 16,
      fontWeight: "700",
      color: dark ? "#ccc" : "#334155",
      marginTop: 5,
    },
    readBtn: {
      padding: 20,
      backgroundColor: dark ? "#064e3b" : "#ECFDF5",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderBottomWidth: 1,
      borderBottomColor: dark ? "#065f46" : "#D1FAE5",
    },
  });
