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
import { useNavigation } from "@react-navigation/native"
import { ThemeContext } from "../context/ThemeContext"
import { prediccionLechugasService } from "../services/prediccionService"
import { LanguageContext } from "../context/LanguageContext"

const screenWidth = Dimensions.get("window").width

interface PrediccionLechugasAvanzadaScreenProps {
  navigation: any
}

interface ResultadoPrediccionAvanzada {
  diasPrediccion: number
  alturaActual: number
  areaFoliarActual: number
  alturaPrediccion: number
  areaFoliarPrediccion: number
  crecimientoAlturaEsperado: number
  crecimientoAreaEsperado: number
  r2Altura: number
  r2Area: number
  totalRegistros: number
}

export default function PrediccionLechugasAvanzadaScreen() {
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
    Keyboard.dismiss(); 

    try {
      const dias = validarNumero(diasPrediccion, 0)
      if (dias <= 0 || dias > 100) {
        Alert.alert(t("Error"), t("valido100") || "Por favor, introduce un número de días válido.")
        return
      }

      setCargando(true)
      setProgreso(t("cargandoregresión"))

      const resultado = await prediccionLechugasService.realizarPrediccion(dias)

      setProgreso(t("procesandografico"))
      try {
        const datosHistoricos = await prediccionLechugasService.obtenerDatosHistoricos()
        const alturasParaGrafico = datosHistoricos.alturas.slice(-10)
        const areasParaGrafico = datosHistoricos.areas.slice(-10)

        setDatosParaGrafico({
          alturas: alturasParaGrafico.length > 0 ? alturasParaGrafico : [0],
          areas: areasParaGrafico.length > 0 ? areasParaGrafico : [0],
        })
      } catch (error) {
        console.error("Error obteniendo datos para gráfico:", error)
        setDatosParaGrafico({ alturas: [0], areas: [0] })
      }

      setResultado(resultado)
      setProgreso("")
    } catch (error) {
      setProgreso("")
      Alert.alert(
        t("Error"),
          `${t("prediccionfallida")}:\n\n${
        error instanceof Error ? error.message : String(error)
      }`
    ,
      )
    } finally {
      setCargando(false)
    }
  }

  const getCalidadModelo = (r2: number) => {
    const r2Valido = validarNumero(r2, 0)
    if (r2Valido >= 0.9) return { texto: "Excelente", color: "#4CAF50", emoji: "🟢" }
    if (r2Valido >= 0.75) return { texto: "Bueno", color: "#8BC34A", emoji: "🟡" }
    if (r2Valido >= 0.5) return { texto: "Aceptable", color: "#FF9800", emoji: "🟠" }
    return { texto: "Pobre", color: "#F44336", emoji: "🔴" }
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
        
        <Text style={styles.subHeaderTitle}>{t("modeloregresion")}</Text>
        
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" 
      >
        
        <View style={styles.infoCard}>
          <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t("ModeloRegresiónLineal")}</Text>
            <Text style={styles.infoText}>
              {t("textoModeloRegresiónLineal") || "Estima el crecimiento futuro basado en el historial de mediciones."}
            </Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>{t("Diasprediccion")}</Text>
          <TextInput
            style={styles.input}
            value={diasPrediccion}
            onChangeText={setDiasPrediccion}
            keyboardType="numeric"

            placeholder="Ej: 5, 30, 100"
            placeholderTextColor={isDark ? "#9CA3AF" : "#999"}
            maxLength={4}
          />
          <TouchableOpacity
            style={[styles.predictButton, cargando && styles.predictButtonDisabled]}
            onPress={realizarPrediccion}
            disabled={cargando}
          >
            <MaterialIcons name="trending-up" size={20} color="white" />
            <Text style={styles.predictButtonText}>
              {cargando ? t("analizando"): t("RealizarPrediccion")}
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
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{t("ResultadoModelo")}</Text>

            <Text style={styles.topicTitle}>🌱 {t("ALTURA")}</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("AlturaActual")}</Text>
              <Text style={styles.resultValue}>{formatearNumero(resultado.alturaActual)} {t("CENTIMETROS")}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("Prediccion")} ({resultado.diasPrediccion} {t("DIAS")}):</Text>
              <Text style={styles.resultValue}>{formatearNumero(resultado.alturaPrediccion)} {t("CENTIMETROS")}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("CrecimientoEsperado")}</Text>
              <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                +{formatearNumero(resultado.crecimientoAlturaEsperado)} {t("CENTIMETROS")}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("Precision")}</Text>
              <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.r2Altura).color }]}>
                {formatearNumero(resultado.r2Altura * 100, 1)}% {getCalidadModelo(resultado.r2Altura).emoji}
              </Text>
            </View>

            <Text style={[styles.topicTitle, { marginTop: 15 }]}>🍃 {t("AREA_FOLIAR")}</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("areaActual")}</Text>
              <Text style={styles.resultValue}>{formatearNumero(resultado.areaFoliarActual)} {t("CENTIMETROS_CUADRADOS")}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("Prediccion")} ({resultado.diasPrediccion} {t("DIAS")}):</Text>
              <Text style={styles.resultValue}>{formatearNumero(resultado.areaFoliarPrediccion)} {t("CENTIMETROS_CUADRADOS")}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("CrecimientoEsperado")}</Text>
              <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                +{formatearNumero(resultado.crecimientoAreaEsperado)} {t("CENTIMETROS_CUADRADOS")}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{t("Precision")}</Text>
              <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.r2Area).color }]}>
                {formatearNumero(resultado.r2Area * 100, 1)}% {getCalidadModelo(resultado.r2Area).emoji}
              </Text>
            </View>

            <View style={[styles.resultRow, { marginTop: 15 }]}>
              <Text style={styles.resultLabel}>{t("diasAnalizados")}</Text>
              <Text style={styles.resultValue}>{resultado.totalRegistros}</Text>
            </View>
          </View>
        )}

        {datosParaGrafico.alturas.length > 0 && (
          <>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>{t("historicoAltura") || "Histórico de Altura"}</Text>
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
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>{t("historicoAreaFoliar") || "Histórico de Área Foliar"}</Text>
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
  topicTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4CAF50",
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
})