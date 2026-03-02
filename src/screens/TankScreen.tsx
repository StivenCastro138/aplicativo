"use client"

import { useState, useEffect, useContext} from "react"
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from "react-native"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { truchasService } from "../services/apiService"
import { MaterialIcons } from "@expo/vector-icons"
import { useAuth } from "../context/authContext"
import { Picker } from "@react-native-picker/picker"
import { ThemeContext } from "../context/ThemeContext"
import { LanguageContext } from "../context/LanguageContext"
import { useSafeAreaInsets } from "react-native-safe-area-context" 

const screenWidth = Dimensions.get("window").width

interface TruchaDisplayData {
  longitud: number
  peso: number
  temperatura: number
  conductividad: number
  ph: number
  oxigeno: number
  turbidez: number
}

interface HistoryData {
  temperatura: number[]
  conductividad: number[]
  ph: number[]
  oxigeno: number[]     
  turbidez: number[]  
}

interface TanquesScreenProps {
  navigation?: any
}

type PezType = "trucha-arcoiris" | "tilapia" | "cachama" | "carpa" | "salmon"

export default function TanquesScreen({ navigation }: TanquesScreenProps = {}) {
  const { user } = useAuth()
  const insets = useSafeAreaInsets() 

  const [pezSeleccionado, setPezSeleccionado] = useState<PezType>("trucha-arcoiris")
  
  const [data, setData] = useState<TruchaDisplayData>({
    longitud: 0,
    peso: 0,
    temperatura: 0,
    conductividad: 0,
    ph: 0,
    oxigeno: 0,
    turbidez: 0
  })
  
  const [refreshing, setRefreshing] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [history, setHistory] = useState<HistoryData>({
    temperatura: [],
    conductividad: [],
    ph: [],
    oxigeno: [],      
    turbidez: [],
  })
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [ultimaMedicion, setUltimaMedicion] = useState<string | null>(null)
  
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);
  
  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  const isUcundinamarcaUser = user?.correo?.endsWith("@ucundinamarca.edu.co") || false
  const isGmailUser = user?.correo?.endsWith("@gmail.com") || false
  const hasModelAccess = isUcundinamarcaUser

  const fetchData = async () => {
    try {
      const latestData = await truchasService.getLatestValues()

      const newData = {
        longitud: Number(latestData.longitudCm) || 0,
        peso: Number(latestData.pesoG) || 0,
        temperatura: Number(latestData.temperaturaC) || 0,
        conductividad: Number(latestData.conductividadUsCm) || 0,
        ph: Number(latestData.pH) || 0,
        oxigeno: Number(latestData.oxigenoMgL) || 0,
        turbidez: Number(latestData.turbidezNtu) || 0,
      }

      setData(newData)
      setIsConnected(true)
      
      const now = new Date()
      const timeDiff = lastUpdate ? now.getTime() - lastUpdate.getTime() : Infinity;

      if (timeDiff >= 1500000 || !lastUpdate) {
        setHistory((prev) => ({
          temperatura:   [...prev.temperatura.slice(-9),   newData.temperatura],
          conductividad: [...prev.conductividad.slice(-9), newData.conductividad],
          ph:            [...prev.ph.slice(-9),            newData.ph],
          oxigeno:       [...prev.oxigeno.slice(-9),       newData.oxigeno],
          turbidez:      [...prev.turbidez.slice(-9),      newData.turbidez],
        }))
      }
      setLastUpdate(now)

    } catch (error) {
      setIsConnected(false)
      const errorMessage = error instanceof Error ? error.message : String(error)
      Alert.alert(t("errorConexion"), `${t("errorConexionDetalles")}\n\n${errorMessage}`)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch("https://keitha-groveless-tari.ngrok-free.dev/api/stats")
      const json = await res.json()
      if (json.success) {
        setUltimaMedicion(json.data.ultima_medicion) 
      }
    } catch (_) {}
  }

  useEffect(() => {
    if (pezSeleccionado === "trucha-arcoiris") {
      fetchStats()          
      fetchData()
      const interval = setInterval(fetchData, 1800000)
      return () => clearInterval(interval)
    } else {
      setData({ longitud: 0, peso: 0, temperatura: 0, conductividad: 0, ph: 0, oxigeno: 0, turbidez: 0 })
      setHistory({ temperatura: [], conductividad: [], ph: [], oxigeno: [], turbidez: [] })
      setIsConnected(null)
      setLastUpdate(null)
      setUltimaMedicion(null)
    }
  }, [pezSeleccionado])

  const onRefresh = async () => {
    setRefreshing(true)
    if (pezSeleccionado === "trucha-arcoiris") {
      await fetchData()
    }
    setRefreshing(false)
  }

  const handlePredecirCrecimiento = () => {
    if (!hasModelAccess) {
      Alert.alert(
        t("accesoRestringido"),
        t("accesoModelosPrediccionTanques"),
      )
      return
    }
    navigation?.navigate("PrediccionesTanques")
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

  const conductividadChartConfig = {
    ...temperaturaChartConfig,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#F59E0B" },
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

  const getPezNombre = () => {
    const nombres = {
      "trucha-arcoiris": "Trucha Arcoíris",
      "tilapia": "Tilapia",
      "cachama": "Cachama",
      "carpa": "Carpa",
      "salmon": "Salmón",
    }
    return nombres[pezSeleccionado]
  }

  const renderContenido = () => {
    if (pezSeleccionado !== "trucha-arcoiris") {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="waves" size={80} color={isDark ? "#475569" : "#CBD5E1"} />
          <Text style={styles.emptyText}>{t("datosDe")} {getPezNombre()}</Text>
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
          <View style={[styles.metricCard, { backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF', borderLeftColor: '#3B82F6' }]}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="straighten" size={20} color={isDark ? "#93C5FD" : "#3B82F6"} />
              <Text style={styles.metricLabel}>{t("LONGITUD")}</Text>
            </View>
            <Text style={[styles.metricValue, { color: isDark ? '#BFDBFE' : '#3B82F6' }]}>
              {data.longitud.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>{t("CENTIMETROS") || "cm"}</Text>
            {ultimaMedicion && (
            <View style={styles.timestampContainer}>
              <MaterialIcons name="event" size={10} color="#94A3B8" />
              <Text style={styles.timestampText}>
                {t("ultimamedición")}  {ultimaMedicion}
              </Text>
            </View>
            )}
          </View>

          <View style={[styles.metricCard, { backgroundColor: isDark ? '#164E63' : '#ECFEFF', borderLeftColor: '#0891B2' }]}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="fitness-center" size={20} color={isDark ? "#67E8F9" : "#0891B2"} />
              <Text style={styles.metricLabel}>{t("PESO") || "PESO"}</Text>
            </View>
            <Text style={[styles.metricValue, { color: isDark ? '#A5F3FC' : '#0891B2' }]}>
              {data.peso.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>{t("GRAMOS") || "g"}</Text>
            {ultimaMedicion && (
            <View style={styles.timestampContainer}>
              <MaterialIcons name="event" size={10} color="#94A3B8" />
              <Text style={styles.timestampText}>
                {t("ultimamedición")} {ultimaMedicion}
              </Text>
            </View>
          )}
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

          <View style={[styles.metricCard, { backgroundColor: isDark ? '#78350F' : '#FFFBEB', borderLeftColor: '#F59E0B' }]}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="electrical-services" size={20} color={isDark ? "#FCD34D" : "#F59E0B"} />
              <Text style={styles.metricLabel}>{t("CONDUCTIVIDAD")}</Text>
            </View>
            <Text style={[styles.metricValue, { color: isDark ? '#FDE68A' : '#F59E0B' }]}>
              {data.conductividad.toFixed(0)}
            </Text>
            <Text style={styles.metricUnit}>{t("MICROSIEMENS")}</Text>
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

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: isDark ? '#4C1D95' : '#FAF5FF', borderLeftColor: '#A855F7' }]}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="science" size={20} color={isDark ? "#D8B4FE" : "#A855F7"} />
              <Text style={styles.metricLabel}>{t("PH")}</Text>
            </View>
            <Text style={[styles.metricValue, { color: isDark ? '#E9D5FF' : '#A855F7' }]}>
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

          <View style={[styles.metricCard, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderLeftColor: '#10B981' }]}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="bubble-chart" size={20} color={isDark ? "#6EE7B7" : "#10B981"} />
              <Text style={styles.metricLabel}>{t("OXIGENO") || "OXÍGENO"}</Text>
            </View>
            <Text style={[styles.metricValue, { color: isDark ? '#A7F3D0' : '#10B981' }]}>
              {data.oxigeno.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>{t("MG_L") || "mg/L"}</Text>
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
        
        <View style={styles.fullMetricCard}>
          <View style={styles.metricHeader}>
            <MaterialIcons name="lens-blur" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
            <Text style={[styles.metricLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {t("TURBIDEZ") || "TURBIDEZ DEL AGUA"}
            </Text>
          </View>
          <Text style={[styles.fullMetricValue, { color: isDark ? '#CBD5E1' : '#475569' }]}>
            {data.turbidez.toFixed(1)} <Text style={{fontSize: 20, fontWeight: "600"}}>NTU</Text>
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
                <Text style={styles.chartTitle}>{t("TEMPERATURA_AGUA")}</Text>
                <Text style={styles.chartRange}>{t("RANGO_OPTIMO_TEMPERATURA_AGUA")}</Text>
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

        {history.conductividad.length > 0 && (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeaderRow}>
              <View style={styles.chartHeaderLeft}>
                <Text style={styles.chartTitle}>{t("Conductividad")}</Text>
                <Text style={styles.chartRange}>{t("RANGO_OPTIMO_CONDUCTIVIDAD")}</Text>
              </View>
              <View style={styles.chartCurrentValue}>
                <Text style={[styles.currentValueText, { color: '#F59E0B' }]}>
                  {data.conductividad.toFixed(0)} {t("MICROSIEMENS")}
                </Text>
              </View>
            </View>
            
            <View style={styles.chartWrapper}>
              <View style={styles.yAxisLabel}>
                <Text style={styles.yAxisText}>{t("MICROSIEMENS")}</Text>
              </View>
              <LineChart
                data={{
                  labels: history.conductividad.length === 1 ? ["1", "2"] : history.conductividad.map((_, i) => `${i + 1}`),
                  datasets: [{ 
                    data: history.conductividad.length === 1 ? [history.conductividad[0], history.conductividad[0]] : history.conductividad 
                  }],
                }}
                width={screenWidth - 100}
                height={220}
                chartConfig={conductividadChartConfig}
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
                <Text style={styles.chartRange}>{t("RANGO_OPTIMO_PH")}</Text>
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

        {history.oxigeno.length > 0 && (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeaderRow}>
              <View style={styles.chartHeaderLeft}>
                <Text style={styles.chartTitle}>{t("OXIGENO_DISUELTO") || "OXÍGENO DISUELTO"}</Text>
                <Text style={styles.chartRange}>{t("RANGO_OPTIMO_OXIGENO_DISUELTO") || "Óptimo: 6 - 10 mg/L"}</Text>
              </View>
              <View style={styles.chartCurrentValue}>
                <Text style={[styles.currentValueText, { color: '#10B981' }]}>
                  {data.oxigeno.toFixed(1)} {t("MG_L") || "mg/L"}
                </Text>
              </View>
            </View>

            <View style={styles.chartWrapper}>
              <View style={styles.yAxisLabel}>
                <Text style={styles.yAxisText}>{t("MG_L") || "mg/L"}</Text>
              </View>
              <LineChart
                data={{
                  labels: history.oxigeno.length === 1 ? ["1", "2"] : history.oxigeno.map((_, i) => `${i + 1}`),
                  datasets: [{ 
                    data: history.oxigeno.length === 1 ? [history.oxigeno[0], history.oxigeno[0]] : history.oxigeno 
                  }],
                }}
                width={screenWidth - 100}
                height={220}
                chartConfig={{
                  backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                  backgroundGradientFrom: isDark ? "#1E293B" : "#FFFFFF",
                  backgroundGradientTo: isDark ? "#1E293B" : "#FFFFFF",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#10B981" },
                  propsForBackgroundLines: { stroke: isDark ? "#334155" : "#E2E8F0", strokeWidth: 1 },
                  strokeWidth: 3,
                }}
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

        {history.turbidez.length > 0 && (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeaderRow}>
              <View style={styles.chartHeaderLeft}>
                <Text style={styles.chartTitle}>{t("Turbidez") || "TURBIDEZ DEL AGUA"}</Text>
                <Text style={styles.chartRange}>{t("RANGO_OPTIMO_TURBIDEZ") || "Óptimo: 0 - 25 NTU"}</Text>
              </View>
              <View style={styles.chartCurrentValue}>
                <Text style={[styles.currentValueText, { color: '#64748B' }]}>
                  {data.turbidez.toFixed(1)} NTU
                </Text>
              </View>
            </View>

            <View style={styles.chartWrapper}>
              <View style={styles.yAxisLabel}>
                <Text style={styles.yAxisText}>NTU</Text>
              </View>
              <LineChart
                data={{
                  labels: history.turbidez.length === 1 ? ["1", "2"] : history.turbidez.map((_, i) => `${i + 1}`),
                  datasets: [{ 
                    data: history.turbidez.length === 1 ? [history.turbidez[0], history.turbidez[0]] : history.turbidez 
                  }],
                }}
                width={screenWidth - 100}
                height={220}
                chartConfig={{
                  backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                  backgroundGradientFrom: isDark ? "#1E293B" : "#FFFFFF",
                  backgroundGradientTo: isDark ? "#1E293B" : "#FFFFFF",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#64748B" },
                  propsForBackgroundLines: { stroke: isDark ? "#334155" : "#E2E8F0", strokeWidth: 1 },
                  strokeWidth: 3,
                }}
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
        <Text style={styles.title}>{t("MONITOREO_DE_TANQUES")}</Text>
        <Text style={styles.subtitle}>{t("DATOS_EN_TIEMPO_REAL")}</Text>
      </View>

      <View style={styles.pickerContainer}>
        <MaterialIcons name="pool" size={20} color="#1565C0" />
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={pezSeleccionado}
            onValueChange={(itemValue) => setPezSeleccionado(itemValue)}
            style={styles.picker}
            dropdownIconColor="#1565C0"
          >
            <Picker.Item label={`🐟 ${t("pecesTruchas")}`} value="trucha-arcoiris" />
            <Picker.Item label={`🐠 ${t("pecesTilapia")}`} value="tilapia" />
            <Picker.Item label={`🐡 ${t("pecesCachama")}`} value="cachama" />
            <Picker.Item label={`🎏 ${t("pecesCarpa")}`} value="carpa" />
            <Picker.Item label={`🐟 ${t("pecesSalmon")}`} value="salmon" />
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
  });