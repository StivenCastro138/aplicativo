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
import { prediccionAvanzadaTruchasService } from "../services/prediccionService"
import { useNavigation } from "@react-navigation/native"

const screenWidth = Dimensions.get("window").width

interface ResultadoPrediccionAvanzada {
  diasPrediccion: number
  longitudActual: number
  longitudPrediccionLineal: number
  crecimientoEsperadoLineal: number
  r2Lineal: number
  longitudPrediccionVB: number
  crecimientoEsperadoVB: number
  r2VB: number
  L_infinito: number
  totalRegistros: number
  edadEstimadaMeses: number
}

export default function PrediccionTruchasAvanzadaScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  
  const themeContext = useContext(ThemeContext)
  const isDark = themeContext?.isDark ?? false
  const styles = getStyles(isDark)

  const languageContext = useContext(LanguageContext)
  const { t } = languageContext ?? { t: (key: string) => key }

  const [diasPrediccion, setDiasPrediccion] = useState("5")
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoPrediccionAvanzada | null>(null)
  const [datosParaGrafico, setDatosParaGrafico] = useState<number[]>([])
  const [progreso, setProgreso] = useState("")

  const realizarPrediccion = async () => {
    Keyboard.dismiss() 

    try {
      const dias = Number.parseInt(diasPrediccion)
      if (isNaN(dias) || dias <= 0 || dias > 100) {
        Alert.alert(t("error"), t("valido100"))
        return
      }

      setCargando(true)
      setProgreso(t("obtenidendoDatosHistoricos"))

      const resultado = await prediccionAvanzadaTruchasService.realizarPrediccion(dias)

      setProgreso(t("procesandografico"))
      try {
        const datosHistoricos = await prediccionAvanzadaTruchasService.obtenerDatosHistoricos()
        const longitudesParaGrafico = datosHistoricos.datos.slice(-10).map((d: any) => d.valorObservado)
        setDatosParaGrafico(longitudesParaGrafico.length > 0 ? longitudesParaGrafico : [0])
      } catch (error) {
        console.error("Error obteniendo datos para gráfico:", error)
        setDatosParaGrafico([0])
      }

      setResultado(resultado)
      setProgreso("")
    } catch (error) {
      console.error("Error en predicción:", error)
      setProgreso("")
      Alert.alert(
        t("error"),
        `${t("prediccionfallida")}:\n\n${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      setCargando(false)
    }
  }

  const getCalidadModelo = (r2: number) => {
    if (r2 >= 0.9) return { texto: t("calidadExcelente"), color: "#4CAF50", emoji: "🟢" }
    if (r2 >= 0.75) return { texto: t("calidadBueno"), color: "#8BC34A", emoji: "🟡" }
    if (r2 >= 0.5) return { texto: t("calidadAceptable"), color: "#FF9800", emoji: "🟠" }
    return { texto: t("calidadPobre"), color: "#F44336", emoji: "🔴" }
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
        <Text style={styles.subHeaderTitle}>{t("modeloAvanzadoTruchas")}</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <MaterialIcons name="auto-awesome" size={24} color={isDark ? "#60A5FA" : "#2196F3"} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t("modelosBiologicosAvanzados")}</Text>
            <Text style={styles.infoText}>
              {t("descripcionModeloBiologico")}
            </Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>{t("diasPrediccionAvanzada")}</Text>
          <TextInput
            style={styles.input}
            value={diasPrediccion}
            onChangeText={setDiasPrediccion}
            keyboardType="numeric"
            placeholder={t("placeholderDiasAvanzada")}
            placeholderTextColor={isDark ? "#9CA3AF" : "#999"}
            maxLength={4}
          />
          <TouchableOpacity
            style={[styles.predictButton, cargando && styles.predictButtonDisabled]}
            onPress={realizarPrediccion}
            disabled={cargando}
          >
            <MaterialIcons name="auto-awesome" size={20} color="white" />
            <Text style={styles.predictButtonText}>
              {cargando ? t("analizandoModelos") : t("realizarPrediccionAvanzada")}
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
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{t("resultadosTruchas")}</Text>

            <Text style={styles.topicTitle}>{t("estadoActual")}</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("longitudActual")}</Text>
              <Text style={styles.resultValue}>{resultado.longitudActual.toFixed(2)} cm</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("edadEstimada")}</Text>
              <Text style={styles.resultValue}>{resultado.edadEstimadaMeses.toFixed(1)} {t("meses")}</Text>
            </View>

            <Text style={[styles.topicTitle, { marginTop: 15 }]}>{t("regresionLineal")}</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("Prediccion")} ({resultado.diasPrediccion} {t("DIAS")}):</Text>
              <Text style={styles.resultValue}>{resultado.longitudPrediccionLineal.toFixed(2)} cm</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("CrecimientoEsperado")}</Text>
              <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                +{resultado.crecimientoEsperadoLineal.toFixed(2)} cm
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("Precision")}</Text>
              <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.r2Lineal).color }]}>
                {(resultado.r2Lineal * 100).toFixed(1)}% {getCalidadModelo(resultado.r2Lineal).emoji}
              </Text>
            </View>

            <Text style={[styles.topicTitle, { marginTop: 15 }]}>{t("modeloVonBertalanffy") || "Modelo Biológico (Von Bertalanffy)"}</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("Prediccion")} ({resultado.diasPrediccion} {t("DIAS")}):</Text>
              <Text style={styles.resultValue}>{resultado.longitudPrediccionVB.toFixed(2)} cm</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("CrecimientoEsperado")}</Text>
              <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                +{resultado.crecimientoEsperadoVB.toFixed(2)} cm
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("longitudAsintotica") || "Longitud Máx. Estimada (L∞)"}:</Text>
              <Text style={styles.resultValue}>{resultado.L_infinito.toFixed(2)} cm</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("Precision")}</Text>
              <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.r2VB).color }]}>
                {(resultado.r2VB * 100).toFixed(1)}% {getCalidadModelo(resultado.r2VB).emoji}
              </Text>
            </View>

            <View style={[styles.resultRow, { marginTop: 20 }]}>
              <Text style={styles.resultLabel}>{t("diasAnalizados")}</Text>
              <Text style={styles.resultValue}>{resultado.totalRegistros}</Text>
            </View>

            <View style={styles.qualityIndicator}>
              <Text style={styles.qualityText}>{t("modelosBiologicosAvanzados")}</Text>
              <Text style={styles.qualitySubtext}>{t("calidadSubtext1")}</Text>
              <Text style={styles.qualitySubtext}>{t("calidadSubtext2")}</Text>
              <Text style={styles.qualitySubtext}>{t("calidadSubtext3")}</Text>
            </View>
          </View>
        )}

        {datosParaGrafico.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{t("historicoLongitud")}</Text>
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
            <Text style={styles.chartSubtitle}>{t("ultimosDiasAnalizados")}</Text>
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
    topicTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: isDark ? "#60A5FA" : "#2196F3",
      marginBottom: 10,
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