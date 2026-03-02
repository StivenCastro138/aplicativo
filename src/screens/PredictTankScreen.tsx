"use client"

import React, { useContext } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ThemeContext } from "../context/ThemeContext"
import { LanguageContext } from "../context/LanguageContext"

interface PrediccionesTanquesScreenProps {
  navigation?: any
}

interface FeatureItemProps {
  iconColor: string
  text: string
  isDark: boolean
}

export default function PrediccionesTanquesScreen({ navigation }: PrediccionesTanquesScreenProps = {}) {
  const insets = useSafeAreaInsets()
  const themeContext = useContext(ThemeContext)
  const isDark = themeContext?.isDark ?? false
  const styles = getStyles(isDark)
  
  const languageContext = useContext(LanguageContext)
  const { t } = languageContext ?? { t: (key: string) => key }

  const handleModeloRegresion = () => {
    navigation?.navigate("PrediccionTruchasAvanzada")
  }

  const handleModeloSeriesTemporales = () => {
    navigation?.navigate("PrediccionTruchasSARIMA")
  }

  const handleModeloMachineLearning = () => {
    navigation?.navigate("PrediccionMLTanques")
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.subHeader]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? "#60A5FA" : "#1565C0"} />
        </TouchableOpacity>
        <Text style={styles.subHeaderTitle}>{t("modelos_prediccion")}</Text>
        <MaterialIcons name="waves" size={26} color={isDark ? "#60A5FA" : "#1565C0"} /> 
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >
        {/* Cabecera de contenido */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            {t("iniciomodelostanques")}
          </Text>
        </View>

        <View style={styles.modelsContainer}>

          <TouchableOpacity 
            style={[styles.modelCard, styles.regressionCard]} 
            onPress={handleModeloRegresion}
            activeOpacity={0.7}
          >
            <View style={styles.modelIconContainer}>
              <MaterialIcons name="trending-up" size={40} color="#059669" />
            </View>
            <View style={styles.modelContent}>
              <Text style={styles.modelTitle}>{t("modeloRegresionVonBertalanffy")}</Text>
              <Text style={styles.modelDescription}>
                {t("textoModeloRegresionVonBertalanffy")}
              </Text>
              <View style={styles.modelFeatures}>
                <FeatureItem iconColor="#059669" text={t("prediccionLongitud")} isDark={isDark} />
                <FeatureItem iconColor="#059669" text={t("modeloVonBertalanffy")} isDark={isDark} />
                <FeatureItem iconColor="#059669" text={t("analisisCorrelacion")} isDark={isDark} />
              </View>
            </View>
            <MaterialIcons name="arrow-forward" size={24} color="#059669" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modelCard, styles.sarimaCard]} 
            onPress={handleModeloSeriesTemporales}
            activeOpacity={0.7}
          >
            <View style={styles.modelIconContainer}>
              <MaterialIcons name="timeline" size={40} color="#7B1FA2" />
            </View>
            <View style={styles.modelContent}>
              <Text style={styles.modelTitle}>{t("SeriesTemporalesSARIMA")}</Text>
              <Text style={styles.modelDescription}>
                {t("textoSeriesTemporalesTanques")}
              </Text>
              <View style={styles.modelFeatures}>
                <FeatureItem iconColor="#7B1FA2" text={t("Analisistendencias")} isDark={isDark} />
                <FeatureItem iconColor="#7B1FA2" text={t("analisisEstacionalidad")} isDark={isDark} />
                <FeatureItem iconColor="#7B1FA2" text={t("Prediccióntemporal")} isDark={isDark} />
              </View>
            </View>
            <MaterialIcons name="arrow-forward" size={24} color="#7B1FA2" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modelCard, styles.mlCard]} 
            onPress={handleModeloMachineLearning}
            activeOpacity={0.7}
          >
            <View style={styles.modelIconContainer}>
              <MaterialIcons name="smart-toy" size={40} color="#DC2626" />
            </View>
            <View style={styles.modelContent}>
              <Text style={styles.modelTitle}>{t("machine_learning_ia")}</Text>
              <Text style={styles.modelDescription}>
                {t("textoModeloHibrido")}
              </Text>
              <View style={styles.modelFeatures}>
                <FeatureItem iconColor="#DC2626" text={t("modeloensamble")} isDark={isDark} />
                <FeatureItem iconColor="#DC2626" text={t("predictividad")} isDark={isDark} />
              </View>
            </View>
            <MaterialIcons name="arrow-forward" size={24} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <MaterialIcons name="info-outline" size={22} color={isDark ? "#94A3B8" : "#64748B"} />
          <Text style={styles.infoText}>
            {t("textomodeloTanques")}
          </Text>
        </View>

      </ScrollView>
    </View>
  )
}

const FeatureItem = ({ iconColor, text, isDark }: FeatureItemProps) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
    <MaterialIcons name="check-circle" size={16} color={iconColor} />
    <Text style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#475569", fontWeight: "500" }}>{text}</Text>
  </View>
)

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? "#121212" : "#EFF6FF",
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
  subHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: isDark ? "#F1F5F9" : "#1E2937",
  },
  backBtn: {
    padding: 5,
  },
  header: {
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: isDark ? "#94A3B8" : "#64748B",
    lineHeight: 20,
  },
  modelsContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  modelCard: {
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 5,
  },
  regressionCard: { borderLeftColor: "#059669" },
  sarimaCard: { borderLeftColor: "#7B1FA2" },
  mlCard: { borderLeftColor: "#DC2626" },
  modelIconContainer: { marginRight: 15 },
  modelContent: { flex: 1 },
  modelTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: isDark ? "#F1F5F9" : "#1E293B",
    marginBottom: 4,
  },
  modelDescription: {
    fontSize: 12,
    color: isDark ? "#94A3B8" : "#64748B",
    lineHeight: 18,
    marginBottom: 10,
  },
  modelFeatures: { marginTop: 5 },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
    marginHorizontal: 20,
    marginVertical: 25,
    padding: 15,
    borderRadius: 15,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: isDark ? "#94A3B8" : "#64748B",
    fontWeight: "500",
  },
})