import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { authService, type Usuario as UsuarioAPI } from "../config/authApi";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

type FilterType = "todos" | "institucional" | "gmail";

interface UsuarioFormateado {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  upa: string;
  activo: boolean;
  esInstitucional: boolean;
}

export default function UsuariosScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);

  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  const [searchText, setSearchText] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FilterType>("todos");
  const [usuarios, setUsuarios] = useState<UsuarioFormateado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);

      const usuariosAPI = await authService.getUsuarios();
      let upas: any[] = [];
      try {
        upas = await authService.getUpas();
      } catch (upaError) {
        console.warn("⚠️ No se pudieron cargar las UPAs:", upaError);
      }

      const usuariosFormateados: UsuarioFormateado[] = usuariosAPI.map(
        (usuario: UsuarioAPI) => {
          const upa = upas.find((u) => u.idUpa === usuario.upaId);
          const nombreUpa = upa ? upa.nombre : "UPA Desconocida";
          const esUdec =
            usuario.correo?.toLowerCase().endsWith("@ucundinamarca.edu.co") ||
            false;

          return {
            id: usuario.idUsuario,
            nombre: usuario.nombre || "",
            apellido: usuario.apellido || "",
            email: usuario.correo || "",
            upa: nombreUpa,
            activo: usuario.estado,
            esInstitucional: esUdec,
          };
        },
      );

      setUsuarios(usuariosFormateados);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    const searchLower = searchText.toLowerCase();

    return usuarios.filter((u) => {
      const cumpleBusqueda =
        u.nombre.toLowerCase().includes(searchLower) ||
        u.apellido.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.upa.toLowerCase().includes(searchLower);

      const cumpleTipo =
        filtroTipo === "todos"
          ? true
          : filtroTipo === "institucional"
            ? u.esInstitucional
            : !u.esInstitucional;

      return cumpleBusqueda && cumpleTipo;
    });
  }, [usuarios, searchText, filtroTipo]);

  const renderUserCard = ({ item: usuario }: { item: UsuarioFormateado }) => (
    <View style={{ paddingHorizontal: 20 }}>
      <View style={styles.userCard}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: isDark
                  ? "#2A2A2A"
                  : usuario.esInstitucional
                    ? "#ECFDF5"
                    : "#F1F5F9",
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                {
                  color: isDark
                    ? "#34D399"
                    : usuario.esInstitucional
                      ? "#059669"
                      : "#64748B",
                },
              ]}
            >
              {(usuario.nombre.charAt(0) || "U") +
                (usuario.apellido.charAt(0) || "")}
            </Text>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: usuario.activo ? "#10B981" : "#EF4444" },
              ]}
            />
          </View>

          <View style={styles.mainInfo}>
            <Text style={styles.userName}>
              {usuario.nombre} {usuario.apellido}
            </Text>
            <Text style={styles.userEmail}>{usuario.email}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.upaTag}>
            <MaterialIcons
              name="location-on"
              size={14}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
            <Text style={styles.upaTagText}>UPA: {usuario.upa}</Text>
          </View>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: usuario.esInstitucional
                  ? isDark
                    ? "#065F46"
                    : "#007b3e"
                  : isDark
                    ? "#075985"
                    : "#0284C7",
              },
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {usuario.esInstitucional ? t("administrador") : t("invitado")}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={isDark ? "#34D399" : "#007b3e"}
        />
        <Text style={styles.loadingText}>{t("sincronizando")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* SUB-HEADER */}
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
        <Text style={styles.subHeaderTitle}>{t("usuariosRegistrados")}</Text>
        <TouchableOpacity onPress={cargarUsuarios}>
          <MaterialIcons
            name="sync"
            size={24}
            color={isDark ? "#34D399" : "#007b3e"}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={usuariosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderUserCard}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* BUSCADOR */}
            <View style={styles.searchBox}>
              <MaterialIcons
                name="search"
                size={20}
                color={isDark ? "#94A3B8" : "#94A3B8"}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={t("buscarPlaceholderUser")}
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {/* TABS DE FILTRO */}
            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <FilterTab
                  label={t("todos")}
                  active={filtroTipo === "todos"}
                  onPress={() => setFiltroTipo("todos")}
                  count={usuarios.length}
                  isDark={isDark}
                  styles={styles}
                />
                <FilterTab
                  label="UDEC"
                  active={filtroTipo === "institucional"}
                  onPress={() => setFiltroTipo("institucional")}
                  count={usuarios.filter((u) => u.esInstitucional).length}
                  isDark={isDark}
                  styles={styles}
                />
                <FilterTab
                  label="Gmail"
                  active={filtroTipo === "gmail"}
                  onPress={() => setFiltroTipo("gmail")}
                  count={usuarios.filter((u) => !u.esInstitucional).length}
                  isDark={isDark}
                  styles={styles}
                />
              </ScrollView>
            </View>

            {/* Mensaje de error si falla la API */}
            {error && (
              <View style={styles.emptyState}>
                <MaterialIcons name="error-outline" size={50} color="#EF4444" />
                <Text style={[styles.emptyText, { color: "#EF4444" }]}>
                  {error}
                </Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="person-search"
                size={60}
                color={isDark ? "#334155" : "#E2E8F0"}
              />
              <Text style={styles.emptyText}>{t("sinResultados")}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const FilterTab = ({ label, active, onPress, count, isDark, styles }: any) => (
  <TouchableOpacity
    style={[
      styles.filterTab,
      active &&
        (isDark
          ? { backgroundColor: "#34D399", borderColor: "#34D399" }
          : { backgroundColor: "#007b3e", borderColor: "#007b3e" }),
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.filterTabText,
        active && (isDark ? { color: "#064E3B" } : { color: "#fff" }),
      ]}
    >
      {label}
    </Text>
    <View
      style={[
        styles.countBadge,
        active && { backgroundColor: "rgba(0,0,0,0.1)" },
      ]}
    >
      <Text
        style={[
          styles.countText,
          active && (isDark ? { color: "#064E3B" } : { color: "#fff" }),
        ]}
      >
        {count}
      </Text>
    </View>
  </TouchableOpacity>
);

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#121212" : "#F0FDF4" },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? "#121212" : "#F0FDF4",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: isDark ? "#34D399" : "#007b3e",
      fontWeight: "600",
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
    backBtn: { padding: 5 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1E1E1E" : "#fff",
      marginHorizontal: 20,
      marginVertical: 10,
      paddingHorizontal: 15,
      height: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "#334155" : "#E2E8F0",
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 14,
      color: isDark ? "#F1F5F9" : "#1E2937",
    },
    filterContainer: {
      flexDirection: "row",
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    filterTab: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1E1E1E" : "#fff",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? "#334155" : "#E2E8F0",
      marginRight: 8,
    },
    filterTabText: {
      fontSize: 12,
      color: isDark ? "#94A3B8" : "#64748B",
      fontWeight: "600",
    },
    countBadge: {
      backgroundColor: isDark ? "#2A2A2A" : "#F1F5F9",
      paddingHorizontal: 6,
      borderRadius: 6,
      marginLeft: 6,
    },
    countText: {
      fontSize: 10,
      color: isDark ? "#94A3B8" : "#64748B",
      fontWeight: "bold",
    },
    listWrapper: { paddingHorizontal: 20 },
    userCard: {
      backgroundColor: isDark ? "#1E1E1E" : "#fff",
      borderRadius: 20,
      padding: 15,
      marginBottom: 12,
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    cardHeader: { flexDirection: "row", alignItems: "center" },
    avatarContainer: {
      width: 45,
      height: 45,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },
    avatarText: {
      fontWeight: "bold",
      fontSize: 16,
      textTransform: "uppercase",
    },
    statusDot: {
      position: "absolute",
      bottom: -2,
      right: -2,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: isDark ? "#1E1E1E" : "#fff",
    },
    mainInfo: { marginLeft: 12, flex: 1 },
    userName: {
      fontSize: 15,
      fontWeight: "bold",
      color: isDark ? "#F1F5F9" : "#1E2937",
    },
    userEmail: {
      fontSize: 12,
      color: isDark ? "#94A3B8" : "#64748B",
      marginTop: 2,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#334155" : "#F1F5F9",
    },
    upaTag: { flexDirection: "row", alignItems: "center" },
    upaTagText: {
      fontSize: 11,
      color: isDark ? "#94A3B8" : "#64748B",
      marginLeft: 4,
      fontWeight: "500",
    },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    typeBadgeText: { fontSize: 9, color: "white", fontWeight: "900" },
    emptyState: { alignItems: "center", marginTop: 50 },
    emptyText: { color: isDark ? "#64748B" : "#94A3B8", marginTop: 10 },
    filterTabActive: {},
    filterTabTextActive: {},
  });
