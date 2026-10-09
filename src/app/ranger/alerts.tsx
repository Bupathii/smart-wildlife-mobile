import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import WebView from "react-native-webview";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/services/api";

function LeafletMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map { margin: 0; height: 100%; width: 100%; }
          body { background: #e2e8f0; }
          .leaflet-container { background: #dbeafe; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const latitude = ${Number(latitude)};
          const longitude = ${Number(longitude)};
          const map = L.map('map', { zoomControl: true }).setView([latitude, longitude], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          L.circle([latitude, longitude], { radius: 200, color: '#ef4444', fillColor: '#f87171', fillOpacity: 0.35 }).addTo(map);
          L.circleMarker([latitude, longitude], { radius: 8, color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.9 }).addTo(map);
        </script>
      </body>
    </html>`;

  return <WebView source={{ html }} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled startInLoadingState />;
}

type ApiAlert = {
  alertId: string;
  animalId: string;
  zone: string;
  latitude: number;
  longitude: number;
  priority: string;
  status: string;
  timestamp?: string;
};

export default function RangerAlerts() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => !["RESOLVED", "ESCALATED"].includes(String(alert.status).toUpperCase())),
    [alerts]
  );

  async function fetchAlerts(silent = false) {
    if (!token) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      const response = await fetch(`${API_BASE_URL}/tracking/alerts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Unable to load wildlife alerts");
      }

      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
    } catch (error) {
      if (!silent) {
        Alert.alert(
          "Load failed",
          error instanceof Error ? error.message : "Unable to load Ranger alerts."
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function updateAlert(alertId: string, action: "acknowledge" | "response" | "resolve" | "escalate") {
    if (!token) {
      Alert.alert("Authentication Required", "Please sign in to manage alerts.");
      return;
    }

    setBusyId(alertId);

    try {
      let url = `${API_BASE_URL}/tracking/alerts/${alertId}`;
      let method = "PUT";
      let body: Record<string, string> | undefined;

      if (action === "acknowledge") {
        url = `${API_BASE_URL}/tracking/alerts/${alertId}/acknowledge`;
        method = "POST";
      } else if (action === "response") {
        url = `${API_BASE_URL}/tracking/alerts/${alertId}/response`;
        body = { responseType: "INVESTIGATE", notes: "Response initiated by ranger." };
      } else if (action === "resolve") {
        url = `${API_BASE_URL}/tracking/alerts/${alertId}/resolve`;
        body = { notes: "Resolved by ranger." };
      } else if (action === "escalate") {
        url = `${API_BASE_URL}/tracking/alerts/${alertId}/escalate`;
        body = { notes: "Escalated to supervisor." };
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Unable to update the alert");
      }

      const nextStatus =
        action === "acknowledge"
          ? "ACKNOWLEDGED"
          : action === "response"
            ? "RESPONSE_INITIATED"
            : action === "resolve"
              ? "RESOLVED"
              : "ESCALATED";

      setAlerts((current) =>
        current.map((alert) =>
          alert.alertId === alertId
            ? {
                ...alert,
                status: nextStatus,
              }
            : alert
        )
      );

      Alert.alert("Alert updated", `Alert ${alertId} marked as ${nextStatus}.`);
    } catch (error) {
      Alert.alert(
        "Update failed",
        error instanceof Error ? error.message : "Unable to update this alert."
      );
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    void fetchAlerts();
    const refreshTimer = setInterval(() => void fetchAlerts(true), 5000);
    return () => clearInterval(refreshTimer);
  }, [token]);

  useEffect(() => {
    if (!alarmEnabled) return;

    const newestActive = activeAlerts[0];
    if (!newestActive) return;

    Alert.alert(
      "Wildlife Risk Alert",
      `${newestActive.animalId} has entered ${newestActive.zone}. Tap to view the alert.`,
      [
        { text: "Turn off alarm", style: "destructive", onPress: () => setAlarmEnabled(false) },
        { text: "Dismiss", style: "cancel" },
      ]
    );
  }, [activeAlerts, alarmEnabled]);

  return (
    <ScrollView className="flex-1 bg-slate-50 px-5 py-6">
      <Text className="text-3xl font-bold text-slate-900">Wildlife Risk Alerts</Text>
      <Text className="mt-2 text-sm text-slate-500">
        Ranger assigned alerts refresh from the live backend and can be acknowledged or escalated.
      </Text>

      {loading ? (
        <View className="mt-8 flex-row items-center justify-center gap-2">
          <ActivityIndicator size="small" color="#0f172a" />
          <Text className="text-sm text-slate-600">Loading alerts...</Text>
        </View>
      ) : activeAlerts.length === 0 ? (
        <View className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-5">
          <Text className="text-base text-slate-500">No active wildlife risk alerts.</Text>
        </View>
      ) : (
        <View className="mt-6 gap-4">
          {activeAlerts.map((alert) => (
            <View key={alert.alertId} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <Text className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
                {alert.priority} PRIORITY
              </Text>
              <Text className="mt-2 text-xl font-bold text-slate-900">{alert.alertId}</Text>
              <Text className="mt-2 text-sm text-slate-700">Animal: {alert.animalId}</Text>
              <Text className="text-sm text-slate-700">Zone: {alert.zone}</Text>
              <Text className="text-sm text-slate-700">
                Location: {alert.latitude}, {alert.longitude}
              </Text>
              <Text className="mt-2 text-sm font-medium text-slate-800">Status: {alert.status}</Text>

              <View className="mt-4 h-36 overflow-hidden rounded-2xl border border-slate-200">
                <LeafletMap latitude={Number(alert.latitude)} longitude={Number(alert.longitude)} />
              </View>

              <View className="mt-4 gap-2">
                <Pressable
                  onPress={() => void updateAlert(alert.alertId, "acknowledge")}
                  disabled={busyId === alert.alertId}
                  className={`rounded-xl px-4 py-3 ${busyId === alert.alertId ? "bg-emerald-200" : "bg-emerald-600"}`}
                >
                  <Text className="text-center text-sm font-bold text-white">ACKNOWLEDGE</Text>
                </Pressable>

                <Pressable
                  onPress={() => void updateAlert(alert.alertId, "response")}
                  disabled={busyId === alert.alertId}
                  className={`rounded-xl px-4 py-3 ${busyId === alert.alertId ? "bg-amber-200" : "bg-amber-500"}`}
                >
                  <Text className="text-center text-sm font-bold text-white">INITIATE RESPONSE</Text>
                </Pressable>

                <Pressable
                  onPress={() => void updateAlert(alert.alertId, "resolve")}
                  disabled={busyId === alert.alertId}
                  className={`rounded-xl px-4 py-3 ${busyId === alert.alertId ? "bg-slate-200" : "bg-slate-800"}`}
                >
                  <Text className="text-center text-sm font-bold text-white">RESOLVE</Text>
                </Pressable>

                <Pressable
                  onPress={() => void updateAlert(alert.alertId, "escalate")}
                  disabled={busyId === alert.alertId}
                  className={`rounded-xl px-4 py-3 ${busyId === alert.alertId ? "bg-red-200" : "bg-red-600"}`}
                >
                  <Text className="text-center text-sm font-bold text-white">ESCALATE</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}