"use client"

import { useState, useContext } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  StatusBar,
  Keyboard 
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ThemeContext } from "../context/ThemeContext"
import { LanguageContext } from "../context/LanguageContext"
import { sarimaTruchasService } from "../services/sarimaService"
import { useNavigation } from "@react-navigation/native"

const screenWidth = Dimensions.get("window").width

interface ResultadoPrediccionSARIMA {
  diasPrediccion: number
  longitudActual: number
  longitudPrediccion: number
  crecimientoEsperado: number
  prediccionesDiarias: number[]
  confianzaModelo: number
  modeloInfo: {
    p: number; d: number; q: number
    P: number; D: number; Q: number
    seasonalPeriod: number
    dataPoints: number
    seasonalStrength: number
    isStationary: boolean
  }
  totalRegistros: number
  variablesAmbientales: {
    temperatura: number
    conductividad: number
    ph: number
  }
  metadata: any
}

export default function PrediccionTruchasSARIMAScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  

  const themeContext = useContext(ThemeContext)
  const isDark = themeContext?.isDark ?? false
  const styles = getStyles(isDark)

  const languageContext = useContext(LanguageContext)
  const { t } = languageContext ?? { t: (key: string) => key }

  const [diasPrediccion, setDiasPrediccion] = useState("7")
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoPrediccionSARIMA | null>(null)
  const [datosParaGrafico, setDatosParaGrafico] = useState<number[]>([])
  const [progreso, setProgreso] = useState("")

  const validarNumero = (valor: any, defaultValue = 0): number => {
    const num = Number(valor)
    if (isNaN(num) || !isFinite(num)) return defaultValue
    return num
  }

  const formatearNumero = (valor: number, decimales = 2): string => {
    const numeroValido = validarNumero(valor, 0)
    return numeroValido.toFixed(decimales)
  }

  const realizarPrediccion = async () => {
    Keyboard.dismiss() 
    
    const dias = validarNumero(diasPrediccion, 0)
    if (dias <= 0 || dias > 100) {
      Alert.alert(t("error"), t("valido100"))
      return
    }

    setCargando(true)
    setProgreso(t("iniciandoSARIMA"))

    try {
      const resultado = await sarimaTruchasService.realizarPrediccionSARIMA(dias)

      setProgreso(t("procesandoSeries"))
      const { datos: datosHistoricos } = await sarimaTruchasService.obtenerDatosHistoricos()
      setDatosParaGrafico(datosHistoricos.slice(-20).map((d: { longitud: number }) => validarNumero(d.longitud, 0)))

      setResultado(resultado)
      setProgreso("")
    } catch (error) {
      console.error("❌ Error en predicción SARIMA:", error)
      setProgreso("")
      Alert.alert(
        t("error"),
        `${t("prediccionSARIMAFallida")}:\n\n${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      setCargando(false)
    }
  }

  const getCalidadModelo = (confianza: number) => {
    const confianzaValida = validarNumero(confianza, 0)
    if (confianzaValida >= 0.9) return { texto: t("calidadExcelente"), color: "#4CAF50", emoji: "🟢" }
    if (confianzaValida >= 0.75) return { texto: t("calidadBueno"), color: "#8BC34A", emoji: "🟡" }
    if (confianzaValida >= 0.6) return { texto: t("calidadAceptable"), color: "#FF9800", emoji: "🟠" }
    return { texto: t("calidadPobre"), color: "#F44336", emoji: "🔴" }
  }

  const getEstacionalidad = (fuerza: number) => {
    const fuerzaValida = validarNumero(fuerza, 0)
    if (fuerzaValida >= 0.7) return { texto: t("Fuerte"), color: "#4CAF50" }
    if (fuerzaValida >= 0.3) return { texto: t("Moderada"), color: "#FF9800" }
    return { texto: t("Debil"), color: isDark ? "#94A3B8" : "#666" }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <MaterialIcons 
            name="arrow-back" 
            size={24} 
            color={isDark ? "#34D399" : "#007b3e"} 
          />
        </TouchableOpacity>
        <Text style={styles.subHeaderTitle}>{t("sarimaTruchasTitulo")}</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" 
      >
        <View style={styles.infoCard}>
          <MaterialIcons name="timeline" size={24} color={isDark ? "#60A5FA" : "#2196F3"} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t("modeloSARIMATitulo")}</Text>
            <Text style={styles.infoText}>{t("textoModeloSARIMATruchas")}</Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>{t("diasPrediccion")}</Text>
          <TextInput
            style={styles.input}
            value={diasPrediccion}
            onChangeText={setDiasPrediccion}
            keyboardType="numeric"
            placeholder={t("placeholderDias")}
            placeholderTextColor={isDark ? "#9CA3AF" : "#999"}
            maxLength={4}
          />
          <TouchableOpacity
            style={[styles.predictButton, cargando && styles.predictButtonDisabled]}
            onPress={realizarPrediccion}
            disabled={cargando}
          >
            <MaterialIcons name="timeline" size={20} color="white" />
            <Text style={styles.predictButtonText}>
              {cargando ? t("analizandoSeries") : t("realizarPrediccionSARIMA")}
            </Text>
          </TouchableOpacity>

          {progreso ? (
            <View style={styles.progressContainer}>
              <MaterialIcons name="hourglass-empty" size={16} color={isDark ? "#60A5FA" : "#2196F3"} />
              <Text style={styles.progressText}>{progreso}</Text>
            </View>
          ) : null}
        </View>

        {resultado && (
          <>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{t("resultadosSARIMA")}</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("longitudActualSARIMA")}</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.longitudActual)} cm</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("longitudPredichaLabel")} ({resultado.diasPrediccion} {t("DIAS")}):</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.longitudPrediccion)} cm</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("crecimientoEsperadoSARIMA")}</Text>
                <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                  +{formatearNumero(resultado.crecimientoEsperado)} cm
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("confianzaModeloLabel")}</Text>
                <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.confianzaModelo).color }]}>
                  {formatearNumero(resultado.confianzaModelo * 100, 1)}% {getCalidadModelo(resultado.confianzaModelo).emoji}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("diasAnalizados")}</Text>
                <Text style={styles.resultValue}>{resultado.totalRegistros}</Text>
              </View>

              <View style={styles.qualityIndicator}>
                <Text style={styles.qualityText}>{t("usandoTodosDatos")}</Text>
                <Text style={styles.qualitySubtext}>{t("valoresActualesAPI")}</Text>
              </View>
            </View>

            <View style={styles.modelInfoCard}>
              <Text style={styles.modelInfoTitle}>{t("parametrosSARIMATruchas")}</Text>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("Modelo")}:</Text>
                <Text style={styles.parameterValue}>
                  SARIMA({resultado.modeloInfo.p},{resultado.modeloInfo.d},{resultado.modeloInfo.q})(
                  {resultado.modeloInfo.P},{resultado.modeloInfo.D},{resultado.modeloInfo.Q})[
                  {resultado.modeloInfo.seasonalPeriod}]
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("periodicidadEstacional")}</Text>
                <Text style={styles.parameterValue}>{resultado.modeloInfo.seasonalPeriod} {t("DIAS")}</Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("fuerzaEstacional")}</Text>
                <Text style={[styles.parameterValue, { color: getEstacionalidad(resultado.modeloInfo.seasonalStrength).color }]}>
                  {formatearNumero(resultado.modeloInfo.seasonalStrength * 100, 1)}% ({getEstacionalidad(resultado.modeloInfo.seasonalStrength).texto})
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("serieEstacionaria")}</Text>
                <Text style={[styles.parameterValue, { color: resultado.modeloInfo.isStationary ? "#4CAF50" : "#FF9800" }]}>
                  {resultado.modeloInfo.isStationary ? t("si") : t("no")}
                </Text>
              </View>
            </View>

            <View style={styles.variablesCard}>
              <Text style={styles.variablesTitle}>{t("variablesAmbientales")}</Text>

              <View style={styles.variableRow}>
                <MaterialIcons name="thermostat" size={20} color="#F44336" />
                <Text style={styles.variableLabel}>{t("temperatura")}</Text>
                <Text style={styles.variableValue}>{formatearNumero(resultado.variablesAmbientales.temperatura, 1)}°C</Text>
              </View>

              <View style={styles.variableRow}>
                <MaterialIcons name="electrical-services" size={20} color="#FF9800" />
                <Text style={styles.variableLabel}>{t("conductividadLabel")}</Text>
                <Text style={styles.variableValue}>{formatearNumero(resultado.variablesAmbientales.conductividad, 0)} µS/cm</Text>
              </View>

              <View style={styles.variableRow}>
                <MaterialIcons name="science" size={20} color="#9C27B0" />
                <Text style={styles.variableLabel}>{t("ph")}</Text>
                <Text style={styles.variableValue}>{formatearNumero(resultado.variablesAmbientales.ph, 2)}</Text>
              </View>
            </View>

            {resultado.metadata && (
              <View style={styles.metadataCard}>
                <Text style={styles.metadataTitle}>{t("informacionDatos")}</Text>
                <Text style={styles.metadataText}>
                  • {resultado.metadata.descripcion}
                  {"\n"}• {t("frecuenciaOriginal")} {resultado.metadata.frecuenciaOriginal}
                  {"\n"}• {t("totalDiasDisponibles")} {resultado.metadata.totalDias}
                  {"\n"}• {t("registrosPorDia")} {resultado.metadata.registrosPorDia?.toLocaleString()}
                  {"\n"}{t("TODOSLOSDATOS")}
                </Text>
              </View>
            )}
          </>
        )}

        {datosParaGrafico.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{t("serieTemporalLongitud")}</Text>
            <LineChart
              data={{
                labels: datosParaGrafico.length === 1 ? ["1", "2"] : datosParaGrafico.map((_, i) => `D${i + 1}`),
                datasets: [{ 
                  data: datosParaGrafico.length === 1 ? [datosParaGrafico[0], datosParaGrafico[0]] : datosParaGrafico 
                }],
              }}
              width={screenWidth - 80}
              height={220}
              chartConfig={{
                backgroundColor: isDark ? "#1E1E1E" : "#2196F3",
                backgroundGradientFrom: isDark ? "#1E293B" : "#42A5F5",
                backgroundGradientTo: isDark ? "#0F172A" : "#2196F3",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: { borderRadius: 16 },
              }}
              bezier
              style={styles.chart}
            />
            <Text style={styles.chartSubtitle}>{t("ultimos20DiasTruchas")}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121212" : "#F8F9FA",
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
    infoCard: {
      backgroundColor: isDark ? "#1E1E1E" : "white",
      borderRadius: 15,
      padding: 20,
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 20,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    infoContent: {
      flex: 1,
      marginLeft: 15,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: isDark ? "#F1F5F9" : "#333",
      marginBottom: 8,
    },
    infoText: {
      fontSize: 13,
      color: isDark ? "#94A3B8" : "#666",
      lineHeight: 22,
    },
    inputCard: {
      backgroundColor: isDark ? "#1E1E1E" : "white",
      borderRadius: 15,
      padding: 25,
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
      marginBottom: 12,
    },
    input: {
      borderWidth: 1.5,
      borderColor: isDark ? "#334155" : "#E0E0E0",
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      marginBottom: 20,
      textAlign: "center",
      backgroundColor: isDark ? "#0F172A" : "#F8F9FA",
      color: isDark ? "#F1F5F9" : "#1E2937",
    },
    predictButton: {
      backgroundColor: "#2196F3",
      borderRadius: 12,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    predictButtonDisabled: {
      backgroundColor: isDark ? "#334155" : "#B0BEC5",
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
      backgroundColor: isDark ? "rgba(33, 150, 243, 0.1)" : "#E3F2FD",
      borderRadius: 10,
    },
    progressText: {
      color: isDark ? "#60A5FA" : "#2196F3",
      fontSize: 14,
      marginLeft: 8,
      fontWeight: "500",
    },
    resultCard: {
      backgroundColor: isDark ? "#1E1E1E" : "white",
      borderRadius: 15,
      padding: 25,
      marginBottom: 20,
      elevation: 4,
    },
    resultTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDark ? "#F1F5F9" : "#333",
      marginBottom: 20,
    },
    resultRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    resultLabel: {
      fontSize: 14,
      color: isDark ? "#94A3B8" : "#666",
      flex: 1,
    },
    resultValue: {
      fontSize: 15,
      fontWeight: "bold",
      color: isDark ? "#E2E8F0" : "#333",
    },
    qualityIndicator: {
      backgroundColor: isDark ? "rgba(33, 150, 243, 0.1)" : "#E3F2FD",
      borderRadius: 10,
      padding: 12,
      marginTop: 15,
      alignItems: "center",
    },
    qualityText: {
      fontSize: 14,
      fontWeight: "bold",
      color: isDark ? "#60A5FA" : "#2196F3",
      textAlign: "center",
      marginBottom: 4,
    },
    qualitySubtext: {
      fontSize: 12,
      color: isDark ? "#60A5FA" : "#2196F3",
      textAlign: "center",
      marginBottom: 2,
    },
    modelInfoCard: {
      backgroundColor: isDark ? "#1E1E1E" : "white",
      borderRadius: 15,
      padding: 25,
      marginBottom: 20,
      elevation: 4,
    },
    modelInfoTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: isDark ? "#F1F5F9" : "#333",
      marginBottom: 15,
    },
    parameterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    parameterLabel: {
      fontSize: 13,
      color: isDark ? "#94A3B8" : "#666",
      flex: 1,
      marginRight: 10,
    },
    parameterValue: {
      fontSize: 13,
      fontWeight: "bold",
      color: isDark ? "#E2E8F0" : "#333",
      flex: 1,
      textAlign: "right",
    },
    variablesCard: {
      backgroundColor: isDark ? "#1E1E1E" : "white",
      borderRadius: 15,
      padding: 25,
      marginBottom: 20,
      elevation: 4,
    },
    variablesTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: isDark ? "#F1F5F9" : "#333",
      marginBottom: 15,
    },
    variableRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    variableLabel: {
      fontSize: 14,
      color: isDark ? "#94A3B8" : "#666",
      marginLeft: 12,
      flex: 1,
    },
    variableValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: isDark ? "#E2E8F0" : "#333",
    },
    metadataCard: {
      backgroundColor: isDark ? "#1E293B" : "#F8F9FA",
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: "#2196F3",
    },
    metadataTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: isDark ? "#F1F5F9" : "#333",
      marginBottom: 12,
    },
    metadataText: {
      fontSize: 12,
      color: isDark ? "#94A3B8" : "#666",
      lineHeight: 20,
    },
    chartContainer: {
      backgroundColor: isDark ? "#1E1E1E" : "white",
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
      elevation: 4,
      alignItems: "center",
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
      color: isDark ? "#94A3B8" : "#666",
      textAlign: "center",
      marginTop: 12,
      fontStyle: "italic",
    },
  })