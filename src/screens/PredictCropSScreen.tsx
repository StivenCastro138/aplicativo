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
import { sarimaLechugasService } from "../services/sarimaService"
import { LanguageContext } from "../context/LanguageContext"
import { useNavigation } from "@react-navigation/native"

const screenWidth = Dimensions.get("window").width

interface PrediccionLechugasSARIMAScreenProps {
  navigation: any
}

interface ResultadoPrediccionSARIMA {
  diasPrediccion: number
  alturaActual: number
  areaFoliarActual: number
  alturaPrediccion: number
  areaFoliarPrediccion: number
  crecimientoAlturaEsperado: number
  crecimientoAreaEsperado: number
  prediccionesAlturasDiarias: number[]
  prediccionesAreasDiarias: number[]
  confianzaModeloAltura: number
  confianzaModeloArea: number
  modeloInfoAltura: {
    p: number; d: number; q: number
    P: number; D: number; Q: number
    seasonalPeriod: number
    dataPoints: number
    seasonalStrength: number
    isStationary: boolean
  }
  modeloInfoArea: {
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
    humedad: number
    ph: number
  }
  metadata: any
}

export default function PrediccionLechugasSARIMAScreen() {  
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
  const [datosParaGrafico, setDatosParaGrafico] = useState<{ alturas: number[]; areas: number[] }>({
    alturas: [],
    areas: [],
  })
  const [progreso, setProgreso] = useState("")

  const validarNumero = (valor: any, defaultValue = 0): number => {
    if (valor === null || valor === undefined || valor === "" || valor === "null" || valor === "undefined") {
      return defaultValue
    }
    const num = Number(valor)
    if (isNaN(num) || !isFinite(num)) {
      return defaultValue
    }
    return num
  }

  const formatearNumero = (valor: number, decimales = 2): string => {
    try {
      const numeroValido = validarNumero(valor, 0)
      return numeroValido.toFixed(decimales)
    } catch (error) {
      return "0.00"
    }
  }

  const realizarPrediccion = async () => {
    Keyboard.dismiss() 

    try {
      const dias = validarNumero(diasPrediccion, 0)
      if (dias <= 0 || dias > 100) {
        Alert.alert(t("Error"), t("valido100"))
        return
      }

      setCargando(true)
      setProgreso(t("iniciandoSARIMA"))

      const resultado = await sarimaLechugasService.realizarPrediccionSARIMA(dias)

      setProgreso(t("procesandoSeries"))
      try {
        const { datos: datosHistoricos } = await sarimaLechugasService.obtenerDatosHistoricos()
        const alturasParaGrafico = datosHistoricos.slice(-20).map((d: { altura: number }) => validarNumero(d.altura, 0))
        const areasParaGrafico = datosHistoricos.slice(-20).map((d: { areaFoliar: number }) => validarNumero(d.areaFoliar, 0))

        setDatosParaGrafico({
          alturas: alturasParaGrafico.length > 0 ? alturasParaGrafico : [0],
          areas: areasParaGrafico.length > 0 ? areasParaGrafico : [0],
        })
      } catch (error) {
        setDatosParaGrafico({ alturas: [0], areas: [0] })
      }

      setResultado(resultado)
      setProgreso("")
    } catch (error) {
      setProgreso("")
      Alert.alert(
      t("Error"),
      `${t("prediccionSARIMAFallida")}:\n\n${
        error instanceof Error ? error.message : String(error)
      }`
    )
    } finally {
      setCargando(false)
    }
  }

  const getCalidadModelo = (confianza: number) => {
    const confianzaValida = validarNumero(confianza, 0)
    if (confianzaValida >= 0.9) return { texto: "Excelente", color: "#4CAF50", emoji: "🟢" }
    if (confianzaValida >= 0.75) return { texto: "Bueno", color: "#8BC34A", emoji: "🟡" }
    if (confianzaValida >= 0.6) return { texto: "Aceptable", color: "#FF9800", emoji: "🟠" }
    return { texto: "Pobre", color: "#F44336", emoji: "🔴" }
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
        
        <Text style={styles.subHeaderTitle}>{t("modeloSARIMA")}</Text>
        
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* Información del modelo */}
        <View style={styles.infoCard}>
          <MaterialIcons name="timeline" size={24} color="#4CAF50" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t("modeloSARIMATitulo")}</Text>
            <Text style={styles.infoText}>{t("textoModeloSARIMA")}</Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>{t("diasPrediccion")}</Text>
          <TextInput
            style={styles.input}
            value={diasPrediccion}
            onChangeText={setDiasPrediccion}
            keyboardType="numeric"
            placeholder="Ej: 7, 30, 100"
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
              <MaterialIcons name="hourglass-empty" size={16} color="#4CAF50" />
              <Text style={styles.progressText}>{progreso}</Text>
            </View>
          ) : null}
        </View>

        {resultado && (
          <>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{t("resultadosSARIMA")}</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("AlturaActual")}</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.alturaActual)} {t("CENTIMETROS")}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("areaActual")}</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.areaFoliarActual)} {t("CENTIMETROS_CUADRADOS")}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("alturaPredicha")} ({resultado.diasPrediccion} {t("DIAS")}):</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.alturaPrediccion)} {t("CENTIMETROS")}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("areaPredicha")} ({resultado.diasPrediccion} {t("DIAS")}):</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.areaFoliarPrediccion)} {t("CENTIMETROS_CUADRADOS")}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("crecimientoAltura")}</Text>
                <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                  +{formatearNumero(resultado.crecimientoAlturaEsperado)} {t("CENTIMETROS")}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("crecimientoArea")}</Text>
                <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                  +{formatearNumero(resultado.crecimientoAreaEsperado)} {t("CENTIMETROS_CUADRADOS")}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("confianzaAltura")}</Text>
                <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.confianzaModeloAltura).color }]}>
                  {formatearNumero(resultado.confianzaModeloAltura * 100, 1)}{t("PORCENTAJE")} {getCalidadModelo(resultado.confianzaModeloAltura).emoji}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t("confianzaArea")}</Text>
                <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.confianzaModeloArea).color }]}>
                  {formatearNumero(resultado.confianzaModeloArea * 100, 1)}{t("PORCENTAJE")} {getCalidadModelo(resultado.confianzaModeloArea).emoji}
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
              <Text style={styles.modelInfoTitle}>{t("parametrosSARIMAAltura")}</Text>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("Modelo")}</Text>
                <Text style={styles.parameterValue}>
                  SARIMA({resultado.modeloInfoAltura.p},{resultado.modeloInfoAltura.d},{resultado.modeloInfoAltura.q})(
                  {resultado.modeloInfoAltura.P},{resultado.modeloInfoAltura.D},{resultado.modeloInfoAltura.Q})[
                  {resultado.modeloInfoAltura.seasonalPeriod}]
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("periodicidadEstacional")}</Text>
                <Text style={styles.parameterValue}>{resultado.modeloInfoAltura.seasonalPeriod} {t("DIAS")}</Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("fuerzaEstacional")}</Text>
                <Text style={[styles.parameterValue, { color: getEstacionalidad(resultado.modeloInfoAltura.seasonalStrength).color }]}>
                  {formatearNumero(resultado.modeloInfoAltura.seasonalStrength * 100, 1)}{t("PORCENTAJE")} ({getEstacionalidad(resultado.modeloInfoAltura.seasonalStrength).texto})
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("serieEstacionaria")}</Text>
                <Text style={[styles.parameterValue, { color: resultado.modeloInfoAltura.isStationary ? "#4CAF50" : "#FF9800" }]}>
                  {resultado.modeloInfoAltura.isStationary ? t("si") : t("no")}
                </Text>
              </View>
            </View>

            <View style={styles.modelInfoCard}>
              <Text style={styles.modelInfoTitle}>{t("parametrosSARIMAArea")}</Text>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("Modelo")}</Text>
                <Text style={styles.parameterValue}>
                  SARIMA({resultado.modeloInfoArea.p},{resultado.modeloInfoArea.d},{resultado.modeloInfoArea.q})(
                  {resultado.modeloInfoArea.P},{resultado.modeloInfoArea.D},{resultado.modeloInfoArea.Q})[
                  {resultado.modeloInfoArea.seasonalPeriod}]
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("periodicidadEstacional")}</Text>
                <Text style={styles.parameterValue}>{resultado.modeloInfoArea.seasonalPeriod} {t("DIAS")}</Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("fuerzaEstacional")}</Text>
                <Text style={[styles.parameterValue, { color: getEstacionalidad(resultado.modeloInfoArea.seasonalStrength).color }]}>
                  {formatearNumero(resultado.modeloInfoArea.seasonalStrength * 100, 1)}% ({getEstacionalidad(resultado.modeloInfoArea.seasonalStrength).texto})
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>{t("serieEstacionaria")}</Text>
                <Text style={[styles.parameterValue, { color: resultado.modeloInfoArea.isStationary ? "#4CAF50" : "#FF9800" }]}>
                  {resultado.modeloInfoArea.isStationary ? "Sí" : "No"}
                </Text>
              </View>
            </View>

            <View style={styles.variablesCard}>
              <Text style={styles.variablesTitle}>{t("variablesAmbientales")}</Text>

              <View style={styles.variableRow}>
                <MaterialIcons name="thermostat" size={20} color="#F44336" />
                <Text style={styles.variableLabel}>{t("TEMPERATURA")}:</Text>
                <Text style={styles.variableValue}>{formatearNumero(resultado.variablesAmbientales.temperatura, 1)}{t("GRADOS_CELSIUS")}</Text>
              </View>

              <View style={styles.variableRow}>
                <MaterialIcons name="water-drop" size={20} color="#2196F3" />
                <Text style={styles.variableLabel}>{t("HUMEDAD")}:</Text>
                <Text style={styles.variableValue}>{formatearNumero(resultado.variablesAmbientales.humedad, 1)}{t("PORCENTAJE")}</Text>
              </View>

              <View style={styles.variableRow}>
                <MaterialIcons name="science" size={20} color="#9C27B0" />
                <Text style={styles.variableLabel}>{t("PH")}:</Text>
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

        {datosParaGrafico.alturas.length > 0 && (
          <>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>{t("serieTemporalAltura")}</Text>
              <LineChart
                data={{
                  labels: datosParaGrafico.alturas.length === 1 ? ["1", "2"] : datosParaGrafico.alturas.map((_, i) => `D${i + 1}`),
                  datasets: [{ 
                    data: datosParaGrafico.alturas.length === 1 ? [datosParaGrafico.alturas[0], datosParaGrafico.alturas[0]] : datosParaGrafico.alturas 
                  }],
                }}
                width={screenWidth - 80}
                height={220}
                chartConfig={{
                  backgroundColor: isDark ? "#1E1E1E" : "#4CAF50",
                  backgroundGradientFrom: isDark ? "#1E293B" : "#66BB6A",
                  backgroundGradientTo: isDark ? "#0F172A" : "#4CAF50",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: { borderRadius: 16 },
                }}
                bezier
                style={styles.chart}
              />
              <Text style={styles.chartSubtitle}>{t("ultimos20Dias")}</Text>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>{t("serieTemporalArea")}</Text>
              <LineChart
                data={{
                  labels: datosParaGrafico.areas.length === 1 ? ["1", "2"] : datosParaGrafico.areas.map((_, i) => `D${i + 1}`),
                  datasets: [{ 
                    data: datosParaGrafico.areas.length === 1 ? [datosParaGrafico.areas[0], datosParaGrafico.areas[0]] : datosParaGrafico.areas 
                  }],
                }}
                width={screenWidth - 80}
                height={220}
                chartConfig={{
                  backgroundColor: isDark ? "#1E1E1E" : "#8BC34A",
                  backgroundGradientFrom: isDark ? "#334155" : "#9CCC65",
                  backgroundGradientTo: isDark ? "#1E293B" : "#8BC34A",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: { borderRadius: 16 },
                }}
                bezier
                style={styles.chart}
              />
              <Text style={styles.chartSubtitle}>{t("ultimos20Dias")}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const getStyles = (isDark: boolean) => StyleSheet.create({
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
    backgroundColor: "#4CAF50",
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
    backgroundColor: isDark ? "rgba(76, 175, 80, 0.1)" : "#E8F5E8",
    borderRadius: 10,
  },
  progressText: {
    color: "#4CAF50",
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
    backgroundColor: isDark ? "rgba(76, 175, 80, 0.1)" : "#E8F5E8",
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
    alignItems: "center",
  },
  qualityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 4,
  },
  qualitySubtext: {
    fontSize: 12,
    color: "#4CAF50",
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
    textAlign: 'right',
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
    borderLeftColor: "#4CAF50",
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
    color: isDark ? "#94A3B8" : "#666",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
})