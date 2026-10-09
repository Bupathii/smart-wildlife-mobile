import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import WebView from "react-native-webview";
import * as Location from "expo-location";
import { useAuth } from "@/context/AuthContext";
import {
  activateCollarTracking,
  getAnimalTrackingSession,
  getCollarTrackingSession,
  getTrackedAnimals,
  sendAnimalLocation,
  startRemoteTracking as requestTrackingStart,
  stopRemoteTracking as requestTrackingStop,
  type TrackedAnimal,
} from "@/services/tracking.service";

type SessionStatus = "STOPPED" | "REQUESTED" | "ACTIVE";

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
          L.circleMarker([latitude, longitude], { radius: 8, color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 0.9 }).addTo(map);
        </script>
      </body>
    </html>`;

  return <WebView source={{ html }} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled startInLoadingState />;
}

export default function RangerTrackingScreen() {
  const { token, user } = useAuth();
  const isRangerController = Platform.OS === "android";
  const [animals, setAnimals] = useState<TrackedAnimal[]>([]);
  const [animalId, setAnimalId] = useState("");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("STOPPED");
  const [sessionAnimalName, setSessionAnimalName] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("Not started");
  const [sending, setSending] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const startingSession = useRef(false);

  useEffect(() => {
    if (isRangerController) return;
    let isMounted = true;

    const pollForTrackingRequest = async () => {
      if (!token || startingSession.current) return;
      try {
        const session = await getCollarTrackingSession(token);
        if (!isMounted) return;

        if (session?.status === "REQUESTED") {
          startingSession.current = true;
          setAnimalId(session.animalId);
          setSessionAnimalName(session.name);
          setSessionStatus("REQUESTED");
          try {
            await startLocalTracking(session.animalId, true);
          } finally {
            startingSession.current = false;
          }
        } else if (session?.status === "ACTIVE") {
          setAnimalId(session.animalId);
          setSessionAnimalName(session.name);
          setSessionStatus("ACTIVE");
        } else if (isTracking) {
          stopLocalTracking();
          setSessionStatus("STOPPED");
        }
      } catch {
        // The collar retries on the next poll while the backend is unavailable.
      }
    };

    void pollForTrackingRequest();
    const pollTimer = setInterval(() => void pollForTrackingRequest(), 2000);
    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [isRangerController, isTracking, token]);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setAnimals([]);
      setAnimalId("");
      return () => {
        isMounted = false;
      };
    }

    getTrackedAnimals(token)
      .then((registeredAnimals) => {
        if (!isMounted) return;
        setAnimals(registeredAnimals);
        setAnimalId((currentId) => (
          registeredAnimals.some((animal) => animal.animalId === currentId)
            ? currentId
            : registeredAnimals[0]?.animalId || ""
        ));
      })
      .catch((error) => {
        if (isMounted) {
          Alert.alert(
            "Animal list unavailable",
            error instanceof Error ? error.message : "Unable to load registered animals."
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!isRangerController || !token || !animalId) return;
    let isMounted = true;
    let isPolling = false;

    const refreshController = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const [session, registeredAnimals] = await Promise.all([
          getAnimalTrackingSession(token, animalId),
          getTrackedAnimals(token),
        ]);
        if (!isMounted) return;

        setSessionStatus(session.status);
        const animal = registeredAnimals.find((item) => item.animalId === animalId);
        setSessionAnimalName(animal?.name || animalId);
        const location = animal?.currentLocation;
        if (location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
          setLatitude(location.latitude ?? null);
          setLongitude(location.longitude ?? null);
          setUpdatedAt(location.lastUpdated
            ? new Date(location.lastUpdated).toLocaleTimeString()
            : "Recently updated");
        }
      } catch {
        // Keep the last known state visible and retry on the next poll.
      } finally {
        isPolling = false;
      }
    };

    void refreshController();
    const refreshTimer = setInterval(() => void refreshController(), 3000);
    return () => {
      isMounted = false;
      clearInterval(refreshTimer);
    };
  }, [animalId, isRangerController, token]);

  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  function stopLocalTracking() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    setIsTracking(false);
  }

  async function submitLocation(
    trackedAnimalId: string,
    nextLatitude: number,
    nextLongitude: number
  ) {
    if (!trackedAnimalId) {
      return;
    }

    if (!token) {
      Alert.alert("Authentication Required", "Please log in to send tracking data.");
      return;
    }

    setSending(true);

    try {
      await sendAnimalLocation(token, {
        animalId: trackedAnimalId,
        latitude: nextLatitude,
        longitude: nextLongitude,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      Alert.alert(
        "Tracking Error",
        error instanceof Error ? error.message : "Unable to send GPS data."
      );
    } finally {
      setSending(false);
    }
  }

  async function startLocalTracking(trackedAnimalId: string, remotelyRequested = false) {
    if (!token || !trackedAnimalId || locationSubscription.current) {
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "This prototype GPS collar needs location permission to send animal coordinates."
        );
        if (remotelyRequested) {
          await requestTrackingStop(token, trackedAnimalId).catch(() => undefined);
          setSessionStatus("STOPPED");
        }
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentLat = currentPosition.coords.latitude;
      const currentLng = currentPosition.coords.longitude;

      setAnimalId(trackedAnimalId);
      setLatitude(currentLat);
      setLongitude(currentLng);
      setUpdatedAt(new Date().toLocaleTimeString());

      if (remotelyRequested) {
        await activateCollarTracking(token, trackedAnimalId);
        setSessionStatus("ACTIVE");
      }
      await submitLocation(trackedAnimalId, currentLat, currentLng);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 15000,
          distanceInterval: 25,
        },
        (position) => {
          const nextLat = position.coords.latitude;
          const nextLng = position.coords.longitude;

          setLatitude(nextLat);
          setLongitude(nextLng);
          setUpdatedAt(new Date().toLocaleTimeString());

          void submitLocation(trackedAnimalId, nextLat, nextLng);
        }
      );

      locationSubscription.current = subscription;
      setIsTracking(true);
    } catch (error) {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
      setIsTracking(false);
      if (remotelyRequested) {
        await requestTrackingStop(token, trackedAnimalId).catch(() => undefined);
        setSessionStatus("STOPPED");
      }
      Alert.alert(
        "GPS unavailable",
        error instanceof Error ? error.message : "Unable to access GPS position."
      );
    }
  }

  async function startTracking() {
    if (!isRangerController) return;
    if (!animalId) {
      Alert.alert("Select an animal", "Register an animal in the Animals page before starting tracking.");
      return;
    }
    if (!token) {
      Alert.alert("Authentication Required", "Please log in to start tracking.");
      return;
    }

    setSending(true);
    try {
      await requestTrackingStart(token, animalId);
      setSessionStatus("REQUESTED");
      setSessionAnimalName(animals.find((animal) => animal.animalId === animalId)?.name || animalId);
      Alert.alert(
        "iPhone collar requested",
        `The iPhone logged into this Ranger account will start tracking ${animalId} when it receives the request. Keep the tracking screen open on the iPhone.`
      );
    } catch (error) {
      Alert.alert("Tracking request failed", error instanceof Error ? error.message : "Unable to contact the collar phone.");
    } finally {
      setSending(false);
    }
  }

  async function stopTracking() {
    if (!isRangerController || !token || !animalId) return;
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
    try {
      await requestTrackingStop(token, animalId);
      setSessionStatus("STOPPED");
      Alert.alert("Tracking stopped", `The iPhone collar stopped tracking ${animalId}.`);
    } catch (error) {
      Alert.alert("Stop request failed", error instanceof Error ? error.message : "Unable to stop remote tracking.");
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 px-5 py-6">
      <Text className="text-3xl font-bold text-slate-900">Wildlife Tracking</Text>

      <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
        <Text className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
          Prototype GPS collar
        </Text>

        {isRangerController ? (
          <>
            <Text className="mt-4 text-sm font-semibold text-slate-700">Select animal to track on iPhone</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {animals.map((animal) => (
                <Pressable
                  key={animal.animalId}
                  onPress={() => setAnimalId(animal.animalId)}
                  disabled={sessionStatus !== "STOPPED" || sending}
                  className={`rounded-xl border px-3 py-2 ${
                    animalId === animal.animalId
                      ? "border-emerald-600 bg-emerald-600"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Text className={`text-sm font-semibold ${
                    animalId === animal.animalId ? "text-white" : "text-slate-700"
                  }`}>
                    {animal.animalId} · {animal.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            {animals.length === 0 && (
              <Text className="mt-2 text-sm text-amber-700">Register an animal in the dashboard first.</Text>
            )}
          </>
        ) : (
          <View className="mt-4 rounded-xl bg-emerald-50 p-3">
            <Text className="text-sm font-semibold text-emerald-800">
              {isTracking ? `Sending GPS for ${sessionAnimalName || animalId}` : "iPhone collar standby"}
            </Text>
            <Text className="mt-1 text-xs text-emerald-700">
              Keep this screen open. It starts GPS when the Ranger requests tracking from Android.
            </Text>
          </View>
        )}

        <View className="mt-4 space-y-3">
          <Text className="text-base text-slate-700">
            Animal: <Text className="font-bold text-slate-900">{sessionAnimalName || animalId || "Not selected"}</Text>
          </Text>

          <Text className="text-base text-slate-700">
            Status: <Text className="font-bold text-emerald-600">
              {isRangerController
                ? sessionStatus === "ACTIVE"
                  ? "Tracking from iPhone"
                  : sessionStatus === "REQUESTED"
                    ? "Waiting for iPhone"
                    : "Stopped"
                : isTracking
                  ? "Sending GPS"
                  : sessionStatus === "REQUESTED"
                    ? "Starting collar"
                    : "Waiting for Ranger"}
            </Text>
          </Text>

          <Text className="text-base text-slate-700">
            Latitude: <Text className="font-bold text-slate-900">{latitude ?? "--"}</Text>
          </Text>

          <Text className="text-base text-slate-700">
            Longitude: <Text className="font-bold text-slate-900">{longitude ?? "--"}</Text>
          </Text>

          <Text className="text-base text-slate-700">
            Last Updated: <Text className="font-bold text-slate-900">{updatedAt}</Text>
          </Text>

          <Text className="text-sm text-slate-500">
            User: {user?.name || "Ranger"}
          </Text>
        </View>
      </View>

      <View className="mt-8 gap-3">
        {isRangerController && (
          <Pressable
            onPress={() => setShowMap((current) => !current)}
            disabled={!animalId || sessionStatus === "STOPPED"}
            className={`rounded-2xl px-5 py-4 ${!animalId || sessionStatus === "STOPPED" ? "bg-slate-300" : "bg-sky-600"}`}
          >
            <Text className="text-center text-base font-bold text-white">MAP</Text>
          </Pressable>
        )}

        <Pressable
          onPress={startTracking}
          disabled={!isRangerController || sessionStatus !== "STOPPED" || sending}
          className={`rounded-2xl px-5 py-4 ${!isRangerController || sessionStatus !== "STOPPED" || sending ? "bg-emerald-200" : "bg-emerald-600"}`}
        >
          <Text className="text-center text-base font-bold text-white">
            {!isRangerController
              ? (isTracking ? "IPHONE COLLAR ACTIVE" : "WAITING FOR RANGER REQUEST")
              : sessionStatus === "REQUESTED"
                ? "WAITING FOR IPHONE"
                : sessionStatus === "ACTIVE"
                  ? "IPHONE TRACKING ACTIVE"
                  : sending
                    ? "SENDING REQUEST..."
                    : "START TRACKING ON IPHONE"}
          </Text>
        </Pressable>

        <Pressable
          onPress={stopTracking}
          disabled={!isRangerController || sessionStatus === "STOPPED"}
          className={`rounded-2xl px-5 py-4 ${!isRangerController || sessionStatus === "STOPPED" ? "bg-slate-200" : "bg-red-600"}`}
        >
          <Text className="text-center text-base font-bold text-white">
            {isRangerController ? "STOP IPHONE TRACKING" : "CONTROLLED BY RANGER PHONE"}
          </Text>
        </Pressable>
      </View>

      {showMap && isRangerController && latitude !== null && longitude !== null && (
        <View className="mt-6 h-56 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <LeafletMap latitude={latitude} longitude={longitude} />
        </View>
      )}

      {sending && (
        <View className="mt-6 flex-row items-center justify-center gap-2">
          <ActivityIndicator size="small" color="#059669" />
          <Text className="text-sm text-slate-600">Syncing location to backend...</Text>
        </View>
      )}
    </ScrollView>
  );
}
