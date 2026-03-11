import React, { useEffect, useRef, useContext, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Alerta } from "../context/AlertContext";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

interface AlertOverlayProps {
  alerta: Alerta;
  onVerAlerta: () => void;
  onIgnorar: () => void;
}

export default function AlertOverlay({
  alerta,
  onVerAlerta,
  onIgnorar,
}: AlertOverlayProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const { t } = useContext(LanguageContext) || { t: (key: string) => key };
  const styles = useMemo(() => getAlertStyles(isDark), [isDark]);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: -250 })).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const onIgnorarRef = useRef(onIgnorar);
  const onVerAlertaRef = useRef(onVerAlerta);

  useEffect(() => {
    onIgnorarRef.current = onIgnorar;
    onVerAlertaRef.current = onVerAlerta;
  }, [onIgnorar, onVerAlerta]);

  const closeAnimation = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(pan.y, {
        toValue: -250,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleVerAlerta = () => closeAnimation(onVerAlertaRef.current);
  const handleIgnorar = () => closeAnimation(onIgnorarRef.current);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pan.y, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pan.y, opacityAnim]);

  const colors = {
    critica: "#EF4444",
    alta: "#F59E0B",
    media: "#3B82F6",
    baja: "#10B981",
    default: "#94A3B8",
  };

  const getSeverityColor = (sev: string) =>
    colors[sev as keyof typeof colors] || colors.default;

  return (
    <View
      style={[styles.overlay, { paddingTop: insets.top + 10 }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.alertContainer,
          {
            transform: [{ translateY: pan.y }],
            opacity: opacityAnim,
            borderLeftColor: getSeverityColor(alerta.severidad),
          },
        ]}
      >
        <View style={styles.dragBar} />

        <View style={styles.alertHeader}>
          <View style={styles.headerInfo}>
            <MaterialIcons
              name={alerta.severidad === "critica" ? "report" : "warning"}
              size={20}
              color={getSeverityColor(alerta.severidad)}
            />
            <Text
              style={[
                styles.severityText,
                { color: getSeverityColor(alerta.severidad) },
              ]}
            >
              {alerta.severidad.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.timestampText}>
            {new Date(alerta.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        <View style={styles.contentRow}>
          <View
            style={[
              styles.moduleBadge,
              {
                backgroundColor: isDark
                  ? "#333"
                  : alerta.modulo === "tanques"
                  ? "#E0F2FE"
                  : "#DCFCE7",
              },
            ]}
          >
            {alerta.modulo === "tanques" ? (
              <FontAwesome5 name="fish" size={10} color="#0369A1" />
            ) : (
              <MaterialIcons name="eco" size={12} color="#15803D" />
            )}
            <Text
              style={[
                styles.moduleText,
                { color: alerta.modulo === "tanques" ? "#0369A1" : "#15803D" },
              ]}
            >
              {alerta.modulo === "tanques" ? t("tanques") : t("cultivos")}
            </Text>
          </View>

          <Text style={styles.alertMessage} numberOfLines={2}>
            {alerta.mensaje}
          </Text>
        </View>

        <View style={styles.alertActions}>
          <TouchableOpacity
            style={styles.ignoreButton}
            onPress={handleIgnorar}
            activeOpacity={0.7}
          >
            <Text style={styles.ignoreButtonText}>{t("ignorar")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewButton,
              { backgroundColor: getSeverityColor(alerta.severidad) },
            ]}
            onPress={handleVerAlerta}
            activeOpacity={0.8}
          >
            <Text style={styles.viewButtonText}>{t("gestionarAlerta")}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const getAlertStyles = (dark: boolean) =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      paddingHorizontal: 15,
    },
    dragBar: {
      width: 40,
      height: 4,
      backgroundColor: dark ? "#444" : "#E5E7EB",
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 10,
      marginTop: -5,
    },
    alertContainer: {
      backgroundColor: dark ? "#252525" : "white",
      borderRadius: 20,
      padding: 16,
      paddingTop: 12,
      borderLeftWidth: 6,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
    },
    alertHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    headerInfo: { flexDirection: "row", alignItems: "center" },
    severityText: {
      fontSize: 12,
      fontWeight: "800",
      marginLeft: 6,
      letterSpacing: 0.5,
    },
    timestampText: {
      fontSize: 11,
      color: dark ? "#AAA" : "#94A3B8",
      fontWeight: "600",
    },
    contentRow: { marginBottom: 15 },
    moduleBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginBottom: 6,
    },
    moduleText: {
      fontSize: 10,
      fontWeight: "bold",
      marginLeft: 4,
    },
    alertMessage: {
      fontSize: 14,
      color: dark ? "#EEE" : "#334155",
      fontWeight: "500",
      lineHeight: 20,
    },
    alertActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
    ignoreButton: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 12,
      backgroundColor: dark ? "#333" : "#F1F5F9",
    },
    ignoreButtonText: {
      color: dark ? "#BBB" : "#64748B",
      fontSize: 13,
      fontWeight: "700",
    },
    viewButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    viewButtonText: {
      color: "white",
      fontSize: 13,
      fontWeight: "700",
    },
  });