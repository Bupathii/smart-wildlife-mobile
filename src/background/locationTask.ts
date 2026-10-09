import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { API_BASE_URL } from "@/services/api";

export const LOCATION_TASK_NAME = "wildlife-background-location-task";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error || !data || typeof data !== "object") {
    return;
  }

  const token = await AsyncStorage.getItem("ranger_token");
  if (!token) {
    return;
  }

  try {
    const sessionResponse = await fetch(`${API_BASE_URL}/tracking/collar/session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const sessionData = await sessionResponse.json().catch(() => ({}));
    if (!sessionResponse.ok || !sessionData?.session || sessionData.session.status !== "ACTIVE") {
      return;
    }

    const taskData = data as {
      locations?: Array<{
        coords: {
          latitude: number;
          longitude: number;
        };
      }>;
    };
    const locations = taskData.locations ?? [];
    const latest = locations[locations.length - 1];
    if (!latest) {
      return;
    }

    const payload = {
      animalId: sessionData.session.animalId,
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(`${API_BASE_URL}/tracking/location`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (response.ok && result?.alertGenerated) {
      // Background alert notifications are intentionally disabled in Expo Go.
      // The in-app alert popup remains active while the app is foregrounded.
    }
  } catch {
    // Retry on the next interval.
  }
});

export async function registerBackgroundLocationTask() {
  const hasPermission = await Location.getForegroundPermissionsAsync()
    .then((result) => result.status === "granted")
    .catch(() => false);

  if (!hasPermission) {
    return;
  }

  const backgroundPermission = await Location.getBackgroundPermissionsAsync();
  if (backgroundPermission.status !== "granted") {
    return;
  }

  const isRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
    .catch(() => false);

  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 15000,
      distanceInterval: 25,
      deferredUpdatesInterval: 15000,
      foregroundService: {
        notificationTitle: "Wildlife tracking active",
        notificationBody: "Sending GPS updates to the ranger backend.",
      },
    });
  }
}
