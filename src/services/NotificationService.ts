import * as Notifications from "expo-notifications";
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

export const requestPermissions = async () => {
  if (isExpoGo && Platform.OS === 'android') {
    console.log("⚠️ Saltando solicitud de permisos de notificaciones push en Expo Go");
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
};

export const sendTestNotification = async (t: (key: string) => string) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t("tituloNotificacion"),
        body: t("pHFueraRango"),
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: "#007b3e",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        channelId: "default",
      },
    });
    console.log("✅ Notificación programada con éxito");
  } catch (error) {
    console.error("❌ Error al programar la notificación:", error);
  }
};