import React, { useState, useContext } from "react"
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, ActivityIndicator, StatusBar 
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import * as Print from "expo-print"
import {
  truchasService,
  lechugasService,
  type LechugaHistoryRow,
  type TruchaHistoryRow,
} from "../services/apiService"
import { TRUCHAS_CSV_SEED } from "../data/truchasSeedData"
import { ThemeContext } from "../context/ThemeContext"
import { LanguageContext } from "../context/LanguageContext"
import { useNavigation } from "@react-navigation/native"

interface ReportCardProps {
  title: string;
  desc: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onExcel: () => void;
  onPdf: () => void;
  isDark: boolean;
  styles: any;
}

type ReportRow = Record<string, string>

const TANQUES_BASE_DATA: TruchaHistoryRow[] = TRUCHAS_CSV_SEED.map((row) => ({
  dia: row.dia,
  timestamp: row.timestamp,
  longitudCm: row.longitudCm,
  pesoG: row.pesoG,
  temperaturaC: row.temperaturaC,
  conductividadUsCm: row.conductividadUsCm,
  pH: row.pH,
  oxigenoMgL: row.oxigenoMgL,
  turbidezNtu: row.turbidezNtu,
}))

const toDateParts = (timestamp: string) => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return { fecha: "N/A", hora: "N/A" }
  }

  return {
    fecha: date.toLocaleDateString(),
    hora: date.toLocaleTimeString(),
  }
}

const getLast90Days = <T extends { timestamp: string }>(rows: T[]) => {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  return rows.filter((row) => new Date(row.timestamp).getTime() >= ninetyDaysAgo)
}

export default function ReportesScreen() { 
  const navigation = useNavigation<any>()
  const [generandoReporte, setGenerandoReporte] = useState(false)
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  const styles = getStyles(isDark);
  
  const languageContext = useContext(LanguageContext);
  const t = languageContext?.t || ((key: string) => key);

  const generarCSV = (datos: any[], headers: string[], titulo: string) => {
    const csvHeaders = headers.join(",")
    const csvRows = datos.map((row) =>
      headers.map((header) => {
        const value = row[header] || ""
        return typeof value === "string" && (value.includes(",") || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"` : value
      }).join(",")
    ).join("\n")
    return `${titulo}\nFecha: ${new Date().toLocaleString()}\nUCUNDINAMARCA\n\n${csvHeaders}\n${csvRows}`
  }

  const generarGraficaSVG = (datos: number[], titulo: string, color: string) => {
    if (datos.length === 0) {
      return `<div style="margin-top:20px; color:#64748b; text-align:center;">Sin datos para ${titulo}</div>`
    }

    const width = 400; const height = 200; const padding = 40;
    const chartWidth = width - 2 * padding; const chartHeight = height - 2 * padding;
    const maxValue = Math.max(...datos); const minValue = Math.min(...datos);
    const valueRange = maxValue - minValue || 1;
    const points = datos.map((value, index) => {
      const ratio = datos.length === 1 ? 0.5 : index / (datos.length - 1)
      const x = padding + ratio * chartWidth
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight
      return `${x},${y}`
    }).join(" ")
    return `<div style="margin-top:20px;"><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#f8fdfa; border-radius:15px;">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <text x="50%" y="25" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#333">${titulo}</text>
    </svg></div>`
  }

  const construirFilasCultivos = (historico: LechugaHistoryRow[], actual: any): ReportRow[] => {
    if (historico.length > 0) {
      return historico.map((d) => {
        const { fecha, hora } = toDateParts(d.timestamp)
        return {
          Fecha: fecha,
          Hora: hora,
          "Altura (cm)": d.altura.toFixed(2),
          "Área Foliar (cm²)": d.areaFoliar.toFixed(2),
          "Temperatura (°C)": d.temperatura.toFixed(2),
          "Humedad (%)": d.humedad.toFixed(2),
          pH: d.ph.toFixed(2),
        }
      })
    }

    const ahora = new Date()
    return [
      {
        Fecha: ahora.toLocaleDateString(),
        Hora: ahora.toLocaleTimeString(),
        "Altura (cm)": Number(actual.altura || 0).toFixed(2),
        "Área Foliar (cm²)": Number(actual.areaFoliar || 0).toFixed(2),
        "Temperatura (°C)": Number(actual.temperatura || 0).toFixed(2),
        "Humedad (%)": Number(actual.humedad || 0).toFixed(2),
        pH: Number(actual.ph || 0).toFixed(2),
      },
    ]
  }

  const construirFilasTanques = (historicoApi: TruchaHistoryRow[], actual: any): ReportRow[] => {
    const merged = [...TANQUES_BASE_DATA, ...historicoApi]
    const mapByTimestamp = new Map<string, TruchaHistoryRow>()
    merged.forEach((item, idx) => {
      const timestamp = item.timestamp || `fallback-${idx}`
      const prev = mapByTimestamp.get(timestamp)

      if (!prev) {
        mapByTimestamp.set(timestamp, { ...item, dia: item.dia || idx + 1 })
        return
      }

      mapByTimestamp.set(timestamp, {
        ...item,
        dia: item.dia || prev.dia || idx + 1,
        pesoG: item.pesoG > 0 ? item.pesoG : prev.pesoG,
      })
    })

    const rows = Array.from(mapByTimestamp.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    if (rows.length > 0) {
      return rows.map((d) => {
        const { fecha, hora } = toDateParts(d.timestamp)
        return {
          Fecha: fecha,
          Hora: hora,
          "Longitud (cm)": d.longitudCm.toFixed(2),
          "Peso (g)": d.pesoG > 0 ? d.pesoG.toFixed(2) : "N/D",
          "Temperatura (°C)": d.temperaturaC.toFixed(2),
          "Conductividad (μS/cm)": d.conductividadUsCm.toFixed(2),
          "Oxígeno (mg/L)": d.oxigenoMgL.toFixed(2),
          "Turbidez (NTU)": d.turbidezNtu.toFixed(2),
          pH: d.pH.toFixed(2),
        }
      })
    }

    const ahora = new Date()
    return [
      {
        Fecha: ahora.toLocaleDateString(),
        Hora: ahora.toLocaleTimeString(),
        "Longitud (cm)": Number(actual.longitudCm || 0).toFixed(2),
        "Peso (g)": Number(actual.pesoG || 0).toFixed(2),
        "Temperatura (°C)": Number(actual.temperaturaC || 0).toFixed(2),
        "Conductividad (μS/cm)": Number(actual.conductividadUsCm || 0).toFixed(2),
        "Oxígeno (mg/L)": Number(actual.oxigenoMgL || 0).toFixed(2),
        "Turbidez (NTU)": Number(actual.turbidezNtu || 0).toFixed(2),
        pH: Number(actual.pH || 0).toFixed(2),
      },
    ]
  }

  const generarReporteMaster = async (modulo: "cultivos" | "tanques", formato: "excel" | "pdf") => {
    setGenerandoReporte(true);
    try {
      let datosCompletosFormateados: ReportRow[] = []
      let datosUltimos90Formateados: ReportRow[] = []

      if (modulo === "cultivos") {
        const historicoCultivos = await lechugasService.getDailyHistory()
        const actualCultivos = await lechugasService.getLatestValues()
        const cultivos90 = getLast90Days(historicoCultivos)

        datosCompletosFormateados = construirFilasCultivos(historicoCultivos, actualCultivos)
        datosUltimos90Formateados = construirFilasCultivos(cultivos90, actualCultivos)
      } else {
        const historicoTanquesApi = await truchasService.getDailyHistory()
        const historicoTanques = [...TANQUES_BASE_DATA, ...historicoTanquesApi].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )
        const actualTanques = await truchasService.getLatestValues()
        const tanques90 = getLast90Days(historicoTanques)

        datosCompletosFormateados = construirFilasTanques(historicoTanques, actualTanques)
        datosUltimos90Formateados = construirFilasTanques(tanques90, actualTanques)
      }

      if (!datosCompletosFormateados.length) {
        throw new Error(t("sinResultados") || "No hay datos recientes para generar el reporte.")
      }

      const titulo = modulo === "cultivos" ? t("MONITOREO_DE_CULTIVOS") : t("MONITOREO_DE_TANQUES");
      const headers = Object.keys((formato === "pdf" ? datosUltimos90Formateados : datosCompletosFormateados)[0]);
      let fileUri = "";

      if (formato === "excel") {
        const csv = generarCSV(datosCompletosFormateados, headers, titulo);
        fileUri = `${FileSystem.documentDirectory}FishTrace_${modulo}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csv);
      } else {
        const dataForPdf = datosUltimos90Formateados.length
          ? datosUltimos90Formateados
          : datosCompletosFormateados.slice(-90)

        const svg1 = generarGraficaSVG(
          dataForPdf.map((d) => {
            const row = d as Record<string, string>
            return parseFloat(row["Temperatura (°C)"] ?? "0")
          }),
          "Histórico Temperatura",
          "#EF4444",
        );

        const svg2 = generarGraficaSVG(
          dataForPdf.map((d) => {
            const row = d as Record<string, string>
            return parseFloat(
              (modulo === "cultivos" ? row["Altura (cm)"] : row["Longitud (cm)"]) ?? "0",
            )
          }),
          "Curva de Crecimiento",
          "#10B981",
        );

        const html = `<html><body style="font-family:Arial;padding:30px;">
          <h1 style="color:#007b3e;text-align:center;">${titulo}</h1>
          <p style="text-align:center; color:#666;">Universidad de Cundinamarca - FishTracer</p>
          <hr/>
          <h3>Análisis de Crecimiento (Últimos 90 días)</h3>
          <div style="text-align:center;">${svg1}${svg2}</div>
          <h3>Registros Detallados (90 días)</h3>
          <table border="1" style="width:100%; border-collapse:collapse; font-size:10px;">
            <tr style="background:#007b3e; color:white;">${headers.map(h => `<th>${h}</th>`).join("")}</tr>
            ${dataForPdf.map(d => `<tr>${headers.map(h => `<td>${(d as Record<string, any>)[h]}</td>`).join("")}</tr>`).join("")}
          </table>
          <p>CSV: historial completo disponible.</p>
        </body></html>`;

        const { uri } = await Print.printToFileAsync({ html });
        fileUri = uri;
      }

      setGenerandoReporte(false);
      Alert.alert(t("confirmar"), t("confirmar"), [
        { text: "Compartir", onPress: () => Sharing.shareAsync(fileUri) },
        { text: t("cerrar") }
      ]);
    } catch (e: any) {
      setGenerandoReporte(false);
      Alert.alert(t("error"), e.message || "Error al procesar el reporte.");
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? "#34D399" : "#007b3e"} />
        </TouchableOpacity>
        <Text style={styles.subHeaderTitle}>{t("generarReporte")}</Text>
        <MaterialIcons name="analytics" size={26} color={isDark ? "#34D399" : "#007b3e"} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ReportCard 
          title={t("moduloCultivo")} 
          desc={t("datosDe") + " " + t("LECHUGAS") + " " + t("yvariablesAmbientales")}
          icon="eco" color="#10B981"
          onExcel={() => generarReporteMaster("cultivos", "excel")}
          onPdf={() => generarReporteMaster("cultivos", "pdf")}
          isDark={isDark}
          styles={styles}
        />

        <ReportCard 
          title={t("moduloTanque")} 
          desc={t("datosDe") + " " + t("pecesTruchas") + " " + t("ycalidadDeAgua")}
          icon="water" color="#0284C7"
          onExcel={() => generarReporteMaster("tanques", "excel")}
          onPdf={() => generarReporteMaster("tanques", "pdf")}
          isDark={isDark}
          styles={styles}
        />

        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={22} color={isDark ? "#34D399" : "#065F46"} />
          <Text style={styles.infoText}>{t("infoBoxReportes")}</Text>
        </View>
      </ScrollView>

      {generandoReporte && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={isDark ? "#34D399" : "#007b3e"} />
            <Text style={styles.loaderText}>{t("generandoReporteTecnico")}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const ReportCard = ({ title, desc, icon, color, onExcel, onPdf, isDark, styles }: ReportCardProps) => (
  <View style={[styles.card, isDark && { backgroundColor: '#1E1E1E' }]}>
    <View style={styles.cardMain}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={32} color={color} />
      </View>
      <View style={{ marginLeft: 15, flex: 1 }}>
        <Text style={[styles.cardTitle, isDark && { color: '#F1F5F9' }]}>{title}</Text>
        <Text style={[styles.cardDesc, isDark && { color: '#94A3B8' }]}>{desc}</Text>
      </View>
    </View>
    <View style={styles.btnRow}>
      <TouchableOpacity style={[styles.btn, { borderColor: '#10B981' }]} onPress={onExcel}>
        <MaterialIcons name="table-rows" size={20} color="#10B981" />
        <Text style={[styles.btnText, { color: '#10B981' }]}>Excel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { borderColor: '#EF4444' }]} onPress={onPdf}>
        <MaterialIcons name="picture-as-pdf" size={20} color="#EF4444" />
        <Text style={[styles.btnText, { color: '#EF4444' }]}>PDF</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#121212" : "#F0FDF4" },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 15 },
  subHeaderTitle: { fontSize: 22, fontWeight: '800', color: isDark ? "#F1F5F9" : '#1E2937' },
  backBtn: { padding: 5 },
  infoBox: { 
    flexDirection: 'row', 
    backgroundColor: isDark ? "#1E293B" : '#DCFCE7', 
    margin: 20, 
    padding: 15, 
    borderRadius: 15, 
    alignItems: 'center' 
  },
  infoText: { flex: 1, marginLeft: 10, fontSize: 12, color: isDark ? "#94A3B8" : '#065F46', lineHeight: 18 },
  card: { 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    marginBottom: 15, 
    padding: 20, 
    borderRadius: 25, 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { padding: 12, borderRadius: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E2937' },
  cardDesc: { fontSize: 13, color: '#64748B', marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  btnText: { marginLeft: 8, fontWeight: 'bold' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  loaderCard: { backgroundColor: isDark ? "#1E1E1E" : '#fff', padding: 30, borderRadius: 25, alignItems: 'center' },
  loaderText: { marginTop: 15, fontWeight: 'bold', color: isDark ? "#F1F5F9" : '#1E2937' }
});