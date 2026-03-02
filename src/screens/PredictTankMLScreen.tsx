"use client"

import React, { useState, useContext, useEffect } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  TextInput,
  Alert,
  Keyboard
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ThemeContext } from "../context/ThemeContext"
import { LanguageContext } from "../context/LanguageContext"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { mlTruchasService } from "../services/prediccionService" 
import { useNavigation } from "@react-navigation/native"

const screenWidth = Dimensions.get("window").width

const CICLO_VIDA_MAXIMO_DIAS = 250 

interface DatosActualesML {
  fechaActual: string
  ultimaMedicionFisica: string 
  longitudActual: number
  pesoActual: number
  edadEstimadaDias: number 
  temperatura: number
  conductividad: number
  ph: number
  oxigeno: number
  turbidez: number
}

interface ResultadoML {
  diasPrediccion: number
  longitudFinal: number
  pesoFinal: number
  precisionModelo: number
  curvaCrecimientoLongitud: number[] 
  curvaCrecimientoPeso: number[]
}

interface PrediccionMLScreenProps {
  navigation?: any
}

export default function PredictTankMLScreen({ navigation }: PrediccionMLScreenProps = {}) {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  
  const themeContext = useContext(ThemeContext)
  const isDark = themeContext?.isDark ?? false
  const styles = getStyles(isDark)
  
  const languageContext = useContext(LanguageContext)
  const { t } = languageContext ?? { t: (key: string) => key }

  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [cargandoPrediccion, setCargandoPrediccion] = useState(false)
  const [progreso, setProgreso] = useState("")
  
  const [datosActuales, setDatosActuales] = useState<DatosActualesML | null>(null)
  const [diasPrediccion, setDiasPrediccion] = useState("") 
  const [resultado, setResultado] = useState<ResultadoML | null>(null)

  useEffect(() => {
    cargarDatosContexto()
  }, [])

  const cargarDatosContexto = async () => {
    try {
      const datos = await mlTruchasService.obtenerContextoActual()
      setDatosActuales(datos)
    } catch (error) {
      Alert.alert(t("error"), t("errorObtenerDatos") || "Error obteniendo datos del sensor.")
    } finally {
      setCargandoInicial(false)
    }
  }

  const limiteDiasPrediccion = datosActuales 
    ? Math.max(0, CICLO_VIDA_MAXIMO_DIAS - datosActuales.edadEstimadaDias) 
    : 100

  const realizarPrediccion = async () => {
    Keyboard.dismiss()

    if (!datosActuales) return

    const dias = Number.parseInt(diasPrediccion)
    if (isNaN(dias) || dias <= 0) {
      Alert.alert(t("error"), t("ingresaDiasValidos") || "Ingresa una cantidad de días válida.")
      return
    }

    if (dias > limiteDiasPrediccion) {
      Alert.alert(
        t("limiteBiológico"), 
        `${t("edadEstimada")} ${datosActuales.edadEstimadaDias} ${t("ciclo")} ${CICLO_VIDA_MAXIMO_DIAS} ${t("días. Solo puedes predecir hasta")} ${limiteDiasPrediccion} ${t("días a futuro.")}`
      )
      return
    }

    setCargandoPrediccion(true)
    setProgreso(t("alimentandoRedNeuronal") || "Alimentando Red Neuronal...")

    try {
      const resultadoML = await mlTruchasService.predecirConML({
        diasAPredecir: dias,
        contexto: datosActuales
      })

      setProgreso(t("generandoGraficas") || "Generando proyección...")
      setResultado(resultadoML)
      setProgreso("")
    } catch (error) {
      setProgreso("")
      Alert.alert(t("error"), `${t("prediccionfallida")}:\n\n${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setCargandoPrediccion(false)
    }
  }

  if (cargandoInicial) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <MaterialIcons name="memory" size={60} color={isDark ? "#818CF8" : "#4F46E5"} />
        <Text style={{ color: isDark ? "#CBD5E1" : "#475569", marginTop: 16 }}>{t("recopilandoVariablesAmbientales")}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? "#1E1E1E" : "#4F46E5"} />

      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <MaterialIcons 
            name="arrow-back" 
            size={24} 
            color={isDark ? "#34D399" : "#007b3e"} 
          />
        </TouchableOpacity>

        <Text style={styles.subHeaderTitle}>{t("machine_learning_ia") || "IA Predictiva"}</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {datosActuales && (
          <View style={styles.contextCard}>
            <View style={styles.contextHeader}>
              <MaterialIcons name="data-object" size={20} color={isDark ? "#818CF8" : "#4F46E5"} />
              <Text style={styles.contextTitle}>{t("inputIA")}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("fechaActual")}</Text>
              <Text style={styles.infoValue}>{datosActuales.fechaActual}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("ultimaMedicionFisica")}</Text>
              <Text style={styles.infoValue}>{datosActuales.ultimaMedicionFisica}</Text>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{datosActuales.longitudActual.toFixed(1)} cm</Text>
                <Text style={styles.metricLab}>{t("longitud")}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{datosActuales.pesoActual.toFixed(0)} g</Text>
                <Text style={styles.metricLab}>{t("peso")}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: "#F59E0B" }]}>{datosActuales.edadEstimadaDias}</Text>
                <Text style={styles.metricLab}>{t("diasEdadEstimada")}</Text>
              </View>
            </View>

            <View style={styles.ambientGrid}>
              <Text style={styles.ambientPill}>🌡️ {datosActuales.temperatura}{t("gradosCelsius")}</Text>
              <Text style={styles.ambientPill}>⚡ {datosActuales.conductividad} {t("microSiemens")}</Text>
              <Text style={styles.ambientPill}>🧪 pH {datosActuales.ph}</Text>
              <Text style={styles.ambientPill}>🫧 O2 {datosActuales.oxigeno} {t("miligramosPorLitro")}</Text>
              <Text style={styles.ambientPill}>🌫️ {datosActuales.turbidez} {t("ntu")}</Text>
            </View>
          </View>
        )}

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>{t("cuantosDiasAFuturoDeseasProyectar")}</Text>
          <Text style={styles.inputHelper}>
            {t("limiteBiologicoSugerido")} {limiteDiasPrediccion} {t("diasRestantes")}.
          </Text>
          <TextInput
            style={styles.input}
            value={diasPrediccion}
            onChangeText={setDiasPrediccion}
            keyboardType="numeric"
            placeholder={`(Máx: ${limiteDiasPrediccion})`}
            placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
            maxLength={3}
          />
          <TouchableOpacity
            style={[styles.predictButton, cargandoPrediccion && styles.predictButtonDisabled]}
            onPress={realizarPrediccion}
            disabled={cargandoPrediccion}
          >
            <MaterialIcons name="online-prediction" size={22} color="white" />
            <Text style={styles.predictButtonText}>
              {cargandoPrediccion ? t("procesando") || t  ("procesandoModelo") : t("ejecutarModeloML")}
            </Text>
          </TouchableOpacity>

          {progreso ? (
            <View style={styles.progressContainer}>
              <MaterialIcons name="memory" size={16} color={isDark ? "#818CF8" : "#4F46E5"} />
              <Text style={styles.progressText}>{progreso}</Text>
            </View>
          ) : null}
        </View>

        {resultado && (
          <>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{t("proyeccionRedNeuronal")}</Text>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("longitudEsperada")}</Text>
                <Text style={styles.resultValue}>{resultado.longitudFinal.toFixed(2)} cm</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("pesoEsperado")}</Text>
                <Text style={styles.resultValue}>{resultado.pesoFinal.toFixed(1)} g</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("confianzaModelo")}</Text>
                <Text style={[styles.resultValue, { color: "#10B981" }]}>
                  {(resultado.precisionModelo * 100).toFixed(1)}% 🟢
                </Text>
              </View>
            </View>

            {resultado.curvaCrecimientoLongitud?.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{t("curvaProyectadaLongitud")}</Text>
                <LineChart
                  data={{
                    labels: resultado.curvaCrecimientoLongitud.length === 1 ? ["Hoy", "Futuro"] : resultado.curvaCrecimientoLongitud.map((_, i) => i === 0 ? "Hoy" : `+${i}`),
                    datasets: [{ 
                      data: resultado.curvaCrecimientoLongitud.length === 1 
                        ? [resultado.curvaCrecimientoLongitud[0], resultado.curvaCrecimientoLongitud[0]] 
                        : resultado.curvaCrecimientoLongitud 
                    }],
                  }}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={{
                    backgroundColor: isDark ? "#1E1E1E" : "#4F46E5",
                    backgroundGradientFrom: isDark ? "#1E293B" : "#6366F1",
                    backgroundGradientTo: isDark ? "#0F172A" : "#4F46E5",
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 16 },
                  }}
                  bezier
                  style={styles.chart}
                />
                <Text style={styles.chartSubtitle}>{t("punto0EsLaUltimaMedicionConfirmada")}</Text>
              </View>
            )}

            {resultado.curvaCrecimientoPeso?.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{t("curvaProyectadaPeso")}</Text>
                <LineChart
                  data={{
                    labels: resultado.curvaCrecimientoPeso.length === 1 ? ["Hoy", "Futuro"] : resultado.curvaCrecimientoPeso.map((_, i) => i === 0 ? "Hoy" : `+${i}`),
                    datasets: [{ 
                      data: resultado.curvaCrecimientoPeso.length === 1 
                        ? [resultado.curvaCrecimientoPeso[0], resultado.curvaCrecimientoPeso[0]] 
                        : resultado.curvaCrecimientoPeso 
                    }],
                  }}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={{
                    backgroundColor: isDark ? "#1E1E1E" : "#F59E0B",
                    backgroundGradientFrom: isDark ? "#1E293B" : "#FBBF24",
                    backgroundGradientTo: isDark ? "#0F172A" : "#D97706",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 16 },
                  }}
                  bezier
                  style={styles.chart}
                />
                <Text style={styles.chartSubtitle}>Proyección de ganancia de biomasa</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? "#121212" : "#F8FAFC",
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
  contextCard: {
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: isDark ? "#334155" : "#E2E8F0",
    elevation: 2,
  },
  contextHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: isDark ? "#818CF8" : "#4F46E5",
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: isDark ? "#94A3B8" : "#64748B",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: isDark ? "#E2E8F0" : "#334155",
  },
  divider: {
    height: 1,
    backgroundColor: isDark ? "#334155" : "#E2E8F0",
    marginVertical: 15,
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  metricItem: {
    alignItems: "center",
  },
  metricVal: {
    fontSize: 18,
    fontWeight: "900",
    color: isDark ? "#F8FAFC" : "#0F172A",
  },
  metricLab: {
    fontSize: 11,
    color: isDark ? "#94A3B8" : "#64748B",
    marginTop: 2,
  },
  ambientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  ambientPill: {
    backgroundColor: isDark ? "#334155" : "#F1F5F9",
    color: isDark ? "#CBD5E1" : "#475569",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: "600",
  },
  inputCard: {
    backgroundColor: isDark ? "#1E1E1E" : "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: isDark ? "#E2E8F0" : "#333",
    marginBottom: 4,
  },
  inputHelper: {
    fontSize: 12,
    color: isDark ? "#F87171" : "#DC2626",
    marginBottom: 15,
    fontStyle: "italic"
  },
  input: {
    borderWidth: 1.5,
    borderColor: isDark ? "#334155" : "#E0E0E0",
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
    color: isDark ? "#F1F5F9" : "#1E2937",
  },
  predictButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  predictButtonDisabled: {
    backgroundColor: isDark ? "#334155" : "#94A3B8",
  },
  predictButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    padding: 12,
    backgroundColor: isDark ? "rgba(79, 70, 229, 0.1)" : "#EEF2FF",
    borderRadius: 10,
  },
  progressText: {
    color: isDark ? "#818CF8" : "#4F46E5",
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: isDark ? "#1E1E1E" : "white",
    borderRadius: 16,
    padding: 25,
    marginBottom: 20,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: isDark ? "#818CF8" : "#4F46E5",
    marginBottom: 20,
    textAlign: "center"
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#334155" : "#F1F5F9"
  },
  resultLabel: {
    fontSize: 14,
    color: isDark ? "#94A3B8" : "#64748B",
    fontWeight: "500",
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "900",
    color: isDark ? "#E2E8F0" : "#1E293B",
  },
  chartContainer: {
    backgroundColor: isDark ? "#1E1E1E" : "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    color: isDark ? "#F1F5F9" : "#333",
  },
  chart: {
    borderRadius: 16,
  },
  chartSubtitle: {
    fontSize: 12,
    color: isDark ? "#94A3B8" : "#94A3B8",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  }
})