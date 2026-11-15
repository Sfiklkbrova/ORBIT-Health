import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { HealthAlert } from '../types/astronaut';
import { insertAlert } from './db';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('astronaut-alerts', {
      name: 'Astronaut Health & Environmental Alerts',
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00F2FE',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

/**
 * Dispatches an astronaut health alert:
 * 1. Shows an OS notification if permissions granted.
 * 2. Saves to local SQLite database for persistent in-app review.
 */
export async function triggerHealthAlert(
  title: string,
  category: HealthAlert['category'],
  severity: HealthAlert['severity'],
  message: string,
  triggerReason: string,
  recommendedAction: string
): Promise<HealthAlert> {
  const alert: HealthAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    title,
    category,
    severity,
    message,
    triggerReason,
    recommendedAction,
    acknowledged: false,
  };

  // 1. Save to SQLite
  try {
    await insertAlert(alert);
  } catch (err) {
    console.log('Failed to save alert to SQLite:', err);
  }

  // 2. Dispatch local OS notification
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `[${severity}] ${title}`,
        body: message,
        data: { alertId: alert.id, category },
      },
      trigger: null, // Send immediately
    });
  } catch (err) {
    console.log('Could not schedule local push notification:', err);
  }

  return alert;
}
