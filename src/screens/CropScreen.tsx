"use client"

import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from "react-native"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { lechugasService } from "../services/apiService" 
import { MaterialIcons } from "@expo/vector-icons"
import { useAuth } from "../context/authContext"
import { Picker } from "@react-native-picker/picker"
import { ThemeContext } from "../context/ThemeContext"
import { LanguageContext } from "../context/LanguageContext"
import { useSafeAreaInsets } from "react-native-safe-area-context" 

const screenWidth = Dimensions.get("window").width

interface LechugaDisplayData {
  altura: number
  areaFoliar: number
  temperatura: number
  humedad: number
  ph: number
}

interface HistoryData {
  temperatura: number[]
  humedad: number[]
  ph: number[]
}

interface CultivosScreenProps {
  navigation?: any
}

type CultivoType = "lechugas" | "cebollines" | "albahaca" | "calendula" | "cilantro"

export default function CultivosScreen({ navigation }: CultivosScreenProps = {}) {
  const { user } = useAuth()
  const insets = useSafeAreaInsets() 
  const [cultivoSeleccionado, setCultivoSeleccionado] = useState<CultivoType>("cebollines")

  const [data, setData] = useState<LechugaDisplayData>({
    altura: 0,
    areaFoliar: 0,
    temperatura: 0,
    humedad: 0,
    ph: 0,
  })

  const [refreshing, setRefreshing] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [history, setHistory] = useState<HistoryData>({
    temperatura: [],
    humedad: [],
    ph: [],
  })
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark)
  
  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  const isUcundinamarcaUser = user?.correo?.endsWith("@ucundinamarca.edu.co") || false
  const isGmailUser = user?.correo?.endsWith("@gmail.com") || false
  const hasModelAccess = isUcundinamarcaUser

  const fetchData = async () => {
    try {
      const latestData = await lechugasService.getLatestValues()
      const rawData = latestData as any

      const newData = {
        altura: Number(rawData.alturaCm) || Number(rawData.altura) || 0,
        areaFoliar: Number(rawData.areaFoliarCm2) || Number(rawData.areaFoliar) || 0,
        temperatura: Number(rawData.temperaturaC) || Number(rawData.temperatura) || 0,
        humedad: Number(rawData.humedadPorcentaje) || Number(rawData.humedad) || 0,
        ph: Number(rawData.pH) || Number(rawData.ph) || 0,
      }

      setData(newData)
      setIsConnected(true)
      setLastUpdate(new Date())
      const now = new Date()

      const timeDiff = lastUpdate ? now.getTime() - lastUpdate.getTime() : Infinity;
    
    if (timeDiff >= 1500000 || !lastUpdate) {
      setHistory((prev) => ({
        temperatura: [...prev.temperatura.slice(-9), newData.temperatura],
        humedad: [...prev.humedad.slice(-9), newData.humedad],
        ph: [...prev.ph.slice(-9), newData.ph],
      }))
    }

    setLastUpdate(now)
    } catch (error) {
      setIsConnected(false)
      const errorMessage = error instanceof Error ? error.message : String(error)
      Alert.alert(t("errorConexion"), `${t("errorConexionDetalles")}\n\n${errorMessage}`)
    }
  }

  useEffect(() => {
    if (cultivoSeleccionado === "cebollines") {
      fetchData()
      const interval = setInterval(fetchData, 1800000)
      return () => clearInterval(interval)
    } else {
      setData({ altura: 0, areaFoliar: 0, temperatura: 0, humedad: 0, ph: 0 })
      setHistory({ temperatura: [], humedad: [], ph: [] })
      setIsConnected(null)
      setLastUpdate(null)
    }
  }, [cultivoSeleccionado])

  const onRefresh = async () => {
    setRefreshing(true)
    if (cultivoSeleccionado === "cebollines") {
      await fetchData()
    }
    setRefreshing(false)
  }

  const handlePredecirCrecimiento = () => {
    if (!hasModelAccess) {
      Alert.alert(t("accesoRestringido"), t("accesoModelosPrediccion"))
      return
    }
    navigation?.navigate("Predicciones")
  }

  const temperaturaChartConfig = {
    backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
    backgroundGradientFrom: isDark ? "#1E293B" : "#FFFFFF",
    backgroundGradientTo: isDark ? "#1E293B" : "#FFFFFF",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#EF4444" },
    propsForBackgroundLines: { stroke: isDark ? "#334155" : "#E2E8F0", strokeWidth: 1 },
    strokeWidth: 3,
  }

  const humedadChartConfig = {
    ...temperaturaChartConfig,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#3B82F6" },
  }

  const phChartConfig = {
    ...temperaturaChartConfig,
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#A855F7" },
  }

  const getConnectionStatus = () => {
    if (isConnected === null) return { color: "#FFA726", icon: "sync", text: t("conectando") }
    if (isConnected) return { color: "#4CAF50", icon: "wifi", text: t("conectado") }
    return { color: "#F44336", icon: "wifi-off", text: t("sinConexion") }
  }

  const status = getConnectionStatus()

  const getCultivoNombre = () => {
    const nombres = {
      lechugas: "Lechugas",
      cebollines: "Cebollines",
      albahaca: "Albahaca",
      calendula: "Caléndula",
      cilantro: "Cilantro",
    }
    return nombres[cultivoSeleccionado]
  }

  const renderContenido = () => {
    if (cultivoSeleccionado !== "cebollines") {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="agriculture" size={80} color={isDark ? "#475569" : "#CBD5E1"} />
          <Text style={styles.emptyText}>{t("datosDe")} {getCultivoNombre()}</Text>
          <Text style={styles.emptySubtext}>{t("proximamenteDisponible")}</Text>
        </View>
      )
    }

    return (
      <>
        {hasModelAccess && (
          <TouchableOpacity style={styles.predecirButton} onPress={handlePredecirCrecimiento}>
            <MaterialIcons name="insights" size={24} color="white" />
            <Text style={styles.predecirButtonText}>{t("predecirCrecimiento")}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: isDark ? '#064E3B' : '#F0FDF4', borderLeftColor: '#22C55E' }]}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="height" size={20} color={isDark ? "#86EFAC" : "#22C55E"} />
              <Text style={styles.metricLabel}>{t("ALTURA")}</Text>
            </View>
            <Text style={[styles.metricValue, { color: isDark ? '#BBF7D0' : '#22C55E' }]}>
              {data.altura.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>{t("CENTIMETROS")}</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: isDark ? '#3F6212' : '#F7FEE7', borderLeftColor: '#84CC16' }]}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="eco" size={20} color={isDark ? "#D9F99D" : "#84CC16"} />
              <Text style={styles.metricLabel}>{t("AREA_FOLIAR")}</Text>
            </View>
            <Text style={[styles.metricValue, { color: isDark ? '#D9F99D' : '#84CC16' }]}>
              {data.areaFoliar.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>{t("CENTIMETROS_CUADRADOS")}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2', borderLeftColor: '#EF4444' }]}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="thermostat" size={20} color={isDark ? "#FCA5A5" : "#EF4444"} />
              <Text style={styles.metricLabel}>{t("TEMPERATURA")}</Text>
            </View>
            <Text style={[styles.metricValue, { color: isDark ? '#FECACA' : '#EF4444' }]}>
              {data.temperatura.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>{t("GRADOS_CELSIUS")}</Text>
            {lastUpdate && (
              <View style={styles.timestampContainer}>
                <MaterialIcons name="schedule" size={10} color="#94A3B8" />
                <Text style={styles.timestampText}>
                  {lastUpdate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} • {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.metricCard, { backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF', borderLeftColor: '#3B82F6' }]}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="water-drop" size={20} color={isDark ? "#93C5FD" : "#3B82F6"} />
              <Text style={styles.metricLabel}>{t("HUMEDAD")}</Text>
            </View>
            <Text style={[styles.metricValue, { color: isDark ? '#BFDBFE' : '#3B82F6' }]}>
              {data.humedad.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>{t("PORCENTAJE")}</Text>
            {lastUpdate && (
              <View style={styles.timestampContainer}>
                <MaterialIcons name="schedule" size={10} color="#94A3B8" />
                <Text style={styles.timestampText}>
                  {lastUpdate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} • {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.fullMetricCard, { backgroundColor: isDark ? '#2E1065' : '#FAF5FF', borderLeftColor: '#A855F7' }]}>
          <View style={styles.metricHeader}>
            <MaterialIcons name="science" size={20} color={isDark ? "#D8B4FE" : "#A855F7"} />
            <Text style={[styles.metricLabel, { color: isDark ? '#D8B4FE' : '#A855F7' }]}>pH</Text>
          </View>
          <Text style={[styles.fullMetricValue, { color: isDark ? '#E9D5FF' : '#A855F7' }]}>
            {data.ph.toFixed(2)}
          </Text>
          {lastUpdate && (
            <View style={styles.timestampContainer}>
              <MaterialIcons name="schedule" size={10} color="#94A3B8" />
              <Text style={styles.timestampText}>
                {lastUpdate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} • {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        </View>

        {history.temperatura.length > 0 && (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeaderRow}>
              <View style={styles.chartHeaderLeft}>
                <Text style={styles.chartTitle}>{t("TEMPERATURA_AIRE") || "Temperatura"}</Text>
                <Text style={styles.chartRange}>{t("RANGO_OPTIMO_TEMPERATURA") || "Óptimo: 15 - 24 °C"}</Text>
              </View>
              <View style={styles.chartCurrentValue}>
                <Text style={[styles.currentValueText, { color: '#EF4444' }]}>
                  {data.temperatura.toFixed(1)}{t("GRADOS_CELSIUS")}
                </Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <View style={styles.yAxisLabel}>
                <Text style={styles.yAxisText}>{t("GRADOS_CELSIUS")}</Text>
              </View>
              <LineChart
                data={{
                  labels: history.temperatura.length === 1 ? ["1", "2"] : history.temperatura.map((_, i) => `${i + 1}`),
                  datasets: [{ 
                    data: history.temperatura.length === 1 ? [history.temperatura[0], history.temperatura[0]] : history.temperatura 
                  }],
                }}
                width={screenWidth - 100}
                height={220}
                chartConfig={temperaturaChartConfig}
                bezier
                style={styles.chart}
                withShadow={false}
                withDots={true}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
                fromZero={false}
                segments={4}
              />
            </View>
            <Text style={styles.xAxisLabel}>{t("TIEMPO_ULTIMAS_10_MEDICIONES")}</Text>
          </View>
        )}

        {history.humedad.length > 0 && (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeaderRow}>
              <View style={styles.chartHeaderLeft}>
                <Text style={styles.chartTitle}>{t("Humedad") || "Humedad"}</Text>
                <Text style={styles.chartRange}>{t("RANGO_OPTIMO_HUMEDAD") || "Óptimo: 50 - 80 %"}</Text>
              </View>
              <View style={styles.chartCurrentValue}>
                <Text style={[styles.currentValueText, { color: '#3B82F6' }]}>
                  {data.humedad.toFixed(1)}%
                </Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <View style={styles.yAxisLabel}>
                <Text style={styles.yAxisText}>{t("PORCENTAJE")}</Text>
              </View>
              <LineChart
                data={{
                  labels: history.humedad.length === 1 ? ["1", "2"] : history.humedad.map((_, i) => `${i + 1}`),
                  datasets: [{ 
                    data: history.humedad.length === 1 ? [history.humedad[0], history.humedad[0]] : history.humedad 
                  }],
                }}
                width={screenWidth - 100}
                height={220}
                chartConfig={humedadChartConfig}
                bezier
                style={styles.chart}
                withShadow={false}
                withDots={true}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
                fromZero={false}
                segments={4}
              />
            </View>
            <Text style={styles.xAxisLabel}>{t("TIEMPO_ULTIMAS_10_MEDICIONES")}</Text>
          </View>
        )}

        {history.ph.length > 0 && (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeaderRow}>
              <View style={styles.chartHeaderLeft}>
                <Text style={styles.chartTitle}>{t("PH")}</Text>
                <Text style={styles.chartRange}>{t("RANGO_OPTIMO_PH") || "Óptimo: 5.5 - 6.5"}</Text>
              </View>
              <View style={styles.chartCurrentValue}>
                <Text style={[styles.currentValueText, { color: '#A855F7' }]}>
                  {data.ph.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <View style={styles.yAxisLabel}>
                <Text style={styles.yAxisText}>{t("PH")}</Text>
              </View>
              <LineChart
                data={{
                  labels: history.ph.length === 1 ? ["1", "2"] : history.ph.map((_, i) => `${i + 1}`),
                  datasets: [{ 
                    data: history.ph.length === 1 ? [history.ph[0], history.ph[0]] : history.ph 
                  }],
                }}
                width={screenWidth - 100}
                height={220}
                chartConfig={phChartConfig}
                bezier
                style={styles.chart}
                withShadow={false}
                withDots={true}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
                fromZero={false}
                segments={4}
              />
            </View>
            <Text style={styles.xAxisLabel}>{t("TIEMPO_ULTIMAS_10_MEDICIONES")}</Text>
          </View>
        )}

        {!hasModelAccess && (isGmailUser || !isUcundinamarcaUser) && (
          <View style={styles.restrictedContainer}>
            <MaterialIcons name={isGmailUser ? "visibility" : "lock"} size={24} color="#94A3B8" />
            <Text style={styles.restrictedText}>
              {isGmailUser
                ? t("ACCESO_UNICO_GRAFICAS_ALERTAS")
                : t("MODELOS_ESTADISTICOS_REQUIEREN_CORREO_INSTITUCIONAL")}
            </Text>
          </View>
        )}
      </>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.statusBar}>
        <View style={[styles.statusIndicator, { backgroundColor: status.color }]}>
          <MaterialIcons name={status.icon as any} size={14} color="white" />
          <Text style={styles.statusText}>{status.text}</Text>
        </View>
        {lastUpdate && (
          <Text style={styles.lastUpdateText}>
            {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{t("MONITOREO_DE_CULTIVOS")}</Text>
        <Text style={styles.subtitle}>{t("DATOS_EN_TIEMPO_REAL")}</Text>
      </View>

      <View style={styles.pickerContainer}>
        <MaterialIcons name="grass" size={20} color="#059669" />
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={cultivoSeleccionado}
            onValueChange={(itemValue) => setCultivoSeleccionado(itemValue)}
            style={styles.picker}
            dropdownIconColor="#059669"
          >
            <Picker.Item label={`🧅 ${t("CEBOLLINES")}`} value="cebollines" />
            <Picker.Item label={`🥬 ${t("LECHUGAS")}`} value="lechugas" />
            <Picker.Item label={`🌿 ${t("ALBAHACA")}`} value="albahaca" />
            <Picker.Item label={`🌼 ${t("CALENDULA")}`} value="calendula" />
            <Picker.Item label={`🌱 ${t("CILANTRO")}`} value="cilantro" />
          </Picker>
        </View>
      </View>

      {renderContenido()}
    </ScrollView>
  )
}

const getStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? "#121212" : "#F0FDF4",
    },
    statusBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: dark ? "#111827" : "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: dark ? "#1F2937" : "#F1F5F9",
    },
    statusIndicator: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: "white",
      fontSize: 11,
      fontWeight: "bold",
      marginLeft: 5,
    },
    lastUpdateText: {
      fontSize: 11,
      color: dark ? "#9CA3AF" : "#94A3B8",
      fontWeight: "500",
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: "900",
      color: dark ? "#34D399" : "#065F46",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      color: dark ? "#9CA3AF" : "#64748B",
      marginTop: 4,
      fontWeight: "400",
    },
    pickerContainer: {
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: dark ? "#1E293B" : "#F8FAFC",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      paddingHorizontal: 15,
      paddingVertical: 5,
      flexDirection: "row",
      alignItems: "center",
    },
    pickerWrapper: { flex: 1, marginLeft: 10 },
    picker: {
      height: 50,
      color: dark ? "#F1F5F9" : "#1E293B",
    },
    predecirButton: {
      backgroundColor: "#F59E0B",
      marginHorizontal: 20,
      marginBottom: 20,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 25,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    predecirButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 10,
      letterSpacing: 0.3,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: "700",
      color: dark ? "#CBD5E1" : "#64748B",
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: dark ? "#94A3B8" : "#94A3B8",
      marginTop: 8,
    },
    metricsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 15,
    },
    metricCard: {
      flex: 0.48,
      padding: 16,
      borderRadius: 16,
      borderLeftWidth: 4,
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    metricHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    metricLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: dark ? "#9CA3AF" : "#64748B",
      letterSpacing: 0.5,
      marginLeft: 6,
    },
    metricValue: {
      fontSize: 32,
      fontWeight: "900",
      letterSpacing: -1,
      color: dark ? "#F1F5F9" : "#111827",
    },
    metricUnit: {
      fontSize: 12,
      color: dark ? "#94A3B8" : "#94A3B8",
      fontWeight: "600",
      marginTop: 2,
    },
    timestampContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: dark ? "#334155" : "#F1F5F9",
    },
    timestampText: {
      fontSize: 9,
      color: dark ? "#94A3B8" : "#94A3B8",
      marginLeft: 4,
    },
    fullMetricCard: {
      marginHorizontal: 20,
      padding: 20,
      backgroundColor: dark ? "#1E293B" : "#F8FAFC",
      borderRadius: 16,
      alignItems: "center",
      marginBottom: 25,
      borderLeftWidth: 4,
      borderLeftColor: dark ? "#64748B" : "#94A3B8",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    fullMetricValue: {
      fontSize: 48,
      fontWeight: "900",
      color: dark ? "#CBD5E1" : "#475569",
      letterSpacing: -1,
    },
    chartContainer: {
      marginHorizontal: 20,
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      padding: 20,
      borderRadius: 20,
      marginBottom: 20,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#F1F5F9",
    },
    chartTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: dark ? "#F1F5F9" : "#1E293B",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    chartRange: {
      fontSize: 11,
      color: dark ? "#9CA3AF" : "#64748B",
      fontWeight: "500",
    },
    chartCurrentValue: {
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    currentValueText: {
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: -0.5,
      color: dark ? "#F1F5F9" : "#111827",
    },
    yAxisText: {
      fontSize: 11,
      fontWeight: "700",
      color: dark ? "#9CA3AF" : "#64748B",
      transform: [{ rotate: "-90deg" }],
    },
    xAxisLabel: {
      fontSize: 10,
      color: dark ? "#94A3B8" : "#94A3B8",
      textAlign: "center",
      marginTop: 8,
      fontWeight: "500",
    },
    restrictedContainer: {
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 30,
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: dark ? "#1E293B" : "#F8FAFC",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
    },
    restrictedText: {
      color: dark ? "#CBD5E1" : "#64748B",
      fontSize: 13,
      textAlign: "center",
      marginTop: 12,
      lineHeight: 20,
      fontWeight: "500",
    },
    chartHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 15,
    },
    chartHeaderLeft: {
      flex: 1,
    },
    chartWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    yAxisLabel: {
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
      width: 30,
    },
    chart: {
      borderRadius: 12,
      marginVertical: 8,
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
    },
  })