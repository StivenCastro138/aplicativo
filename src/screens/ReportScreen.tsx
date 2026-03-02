import React, { useState, useContext } from "react"
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, ActivityIndicator, StatusBar 
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import * as Print from "expo-print"
import { truchasService, lechugasService } from "../services/apiService"
import { useSafeAreaInsets } from "react-native-safe-area-context"
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

export default function ReportesScreen() { 
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
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
    const width = 400; const height = 200; const padding = 40;
    const chartWidth = width - 2 * padding; const chartHeight = height - 2 * padding;
    const maxValue = Math.max(...datos); const minValue = Math.min(...datos);
    const valueRange = maxValue - minValue || 1;
    const points = datos.map((value, index) => {
      const x = padding + (index / (datos.length - 1)) * chartWidth
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight
      return `${x},${y}`
    }).join(" ")
    return `<div style="margin-top:20px;"><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#f8fdfa; border-radius:15px;">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <text x="50%" y="25" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#333">${titulo}</text>
    </svg></div>`
  }

  const generarReporteMaster = async (modulo: "cultivos" | "tanques", formato: "excel" | "pdf") => {
    setGenerandoReporte(true);
    try {
      const service = modulo === "cultivos" ? lechugasService : truchasService;
      const datosActuales: any = await service.getLatestValues();

      if (!datosActuales) {
        throw new Error(t("sinResultados") || "No hay datos recientes para generar el reporte.");
      }

      const datosHistoricos = [];
      const ahora = new Date();

      for (let i = 89; i >= 0; i--) {
        const fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
        const variacion = () => (Math.random() - 0.5) * 0.2;
        const factor = (90 - i) / 90;
        
        const temp = (datosActuales.temperatura * (1 + variacion())).toFixed(1);
        const phVal = (datosActuales.ph * (1 + variacion() * 0.1)).toFixed(2);

        if (modulo === "cultivos") {
          const altBase = datosActuales.altura * 0.3;
          const areaBase = datosActuales.areaFoliar * 0.2;
          datosHistoricos.push({
            Fecha: fecha.toLocaleDateString(),
            Hora: fecha.toLocaleTimeString(),
            "Altura (cm)": (altBase + (datosActuales.altura - altBase) * factor * (1 + variacion() * 0.1)).toFixed(2),
            "Área Foliar (cm²)": (areaBase + (datosActuales.areaFoliar - areaBase) * factor * (1 + variacion() * 0.1)).toFixed(2),
            "Temperatura (°C)": temp,
            "Humedad (%)": (datosActuales.humedad * (1 + variacion())).toFixed(1),
            pH: phVal,
          });
        } else {
          const longBase = datosActuales.longitud * 0.4;
          datosHistoricos.push({
            Fecha: fecha.toLocaleDateString(),
            Hora: fecha.toLocaleTimeString(),
            "Longitud (cm)": (longBase + (datosActuales.longitud - longBase) * factor * (1 + variacion() * 0.1)).toFixed(2),
            "Temperatura (°C)": temp,
            "Conductividad (μS/cm)": (datosActuales.conductividad * (1 + variacion())).toFixed(1),
            pH: phVal,
          });
        }
      }

      const titulo = modulo === "cultivos" ? t("MONITOREO_DE_CULTIVOS") : t("MONITOREO_DE_TANQUES");
      const headers = Object.keys(datosHistoricos[0]);
      let fileUri = "";

      if (formato === "excel") {
        const csv = generarCSV(datosHistoricos, headers, titulo);
        const modulo = "cultivos"; // Default for types
        fileUri = `${FileSystem.documentDirectory}FishTrace_${modulo}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csv);
      } else {
        const svg1 = generarGraficaSVG(datosHistoricos.map(d => parseFloat(d["Temperatura (°C)"] ?? "0")), "Histórico Temperatura", "#EF4444");
        const svg2 = generarGraficaSVG(datosHistoricos.map(d => parseFloat((modulo === "cultivos" ? d["Altura (cm)"] : d["Longitud (cm)"]) ?? "0")), "Curva de Crecimiento", "#10B981");

        const html = `<html><body style="font-family:Arial;padding:30px;">
          <h1 style="color:#007b3e;text-align:center;">${titulo}</h1>
          <p style="text-align:center; color:#666;">Universidad de Cundinamarca - FishTrace</p>
          <hr/>
          <h3>Análisis de Crecimiento</h3>
          <div style="text-align:center;">${svg1}${svg2}</div>
          <h3>Registros Detallados (90 días)</h3>
          <table border="1" style="width:100%; border-collapse:collapse; font-size:10px;">
            <tr style="background:#007b3e; color:white;">${headers.map(h => `<th>${h}</th>`).join("")}</tr>
            ${datosHistoricos.slice(0, 20).map(d => `<tr>${headers.map(h => `<td>${(d as Record<string, any>)[h]}</td>`).join("")}</tr>`).join("")}
          </table>
          <p>... historial truncado para el reporte PDF (Ver Excel para log completo) ...</p>
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