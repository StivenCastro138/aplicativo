import React, { useContext, useMemo } from "react";
import { View, StyleSheet, Image, TouchableOpacity, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlert } from "../context/AlertContext";
import { ThemeContext } from "../context/ThemeContext";
import { HeaderNavigationProp } from "../navigation/types";

interface UserHeaderProps {
  onBack?: () => void;
}

export default function UserHeader({ onBack }: UserHeaderProps) {
  const navigation = useNavigation<HeaderNavigationProp>();
  const { alertasActivas } = useAlert();
  const insets = useSafeAreaInsets();
  const theme = useContext(ThemeContext);
  const isDark = theme?.isDark ?? false;

  const styles = useMemo(() => getHeaderStyles(isDark), [isDark]);

  const openMenu = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const goToHome = () => {
    navigation.navigate("MainDrawer", {
      screen: "Dashboard",
      params: { screen: "Home" },
    });
  };

  const hasAlerts = alertasActivas.length > 0;
  const badgeCount =
    alertasActivas.length > 9 ? "9+" : String(alertasActivas.length);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.logoSection}
          onPress={goToHome}
          activeOpacity={0.7}
        >
          <View style={styles.logoWhiteBadge}>
            <Image
              source={{
                uri: "https://res.cloudinary.com/dst5fbura/image/upload/v1771022848/IMAGOTIPO_VERTICAL_BLANCO_qvdudj.png",
              }}
              style={styles.universityLogo}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate("Alertas")}
            activeOpacity={0.6}
          >
            <View>
              <MaterialIcons
                name="notifications-none"
                size={28}
                color="white"
              />

              {hasAlerts && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{badgeCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={openMenu}
            activeOpacity={0.7}
          >
            <MaterialIcons name="account-circle" size={34} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const getHeaderStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: dark ? "#064e3b" : "#007b3e",
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.1)",
      elevation: 6,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: 50,
    },
    logoSection: {},
    logoWhiteBadge: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      width: 42,
      height: 42,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    universityLogo: { width: 26, height: 26 },
    rightSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    notificationBtn: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarBtn: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 4,
    },
    countBadge: {
      position: "absolute",
      right: -4,
      top: -4,
      backgroundColor: "#EF4444",
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 2,
      borderWidth: 2,
      borderColor: dark ? "#064e3b" : "#007b3e",
    },
    countText: {
      color: "white",
      fontSize: 10,
      fontWeight: "900",
      textAlign: "center",
      lineHeight: 14,
    },
  });
