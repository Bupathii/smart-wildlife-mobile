import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useAuth } from "@/context/AuthContext";
import {
  getTrackedAnimals,
  sendAnimalLocation,
  type TrackedAnimal,
} from "@/services/tracking.service";

export default function RangerTrackingScreen() {
  const { token, user } = useAuth();
  const [animals, setAnimals] = useState<TrackedAnimal[]>([]);
  const [animalId, setAnimalId] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("Not started");
  const [sending, setSending] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

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
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  async function submitLocation(nextLatitude: number, nextLongitude: number) {
    if (!animalId) {
      Alert.alert("Select an animal", "Register and select an animal before starting GPS tracking.");
      return;
    }

    if (!token) {
      Alert.alert("Authentication Required", "Please log in to send tracking data.");
      return;
    }

    setSending(true);

    try {
      const response = await sendAnimalLocation(token, {
        animalId,
        latitude: nextLatitude,
        longitude: nextLongitude,
        timestamp: new Date().toISOString(),
      });

      if (response.alertGenerated) {
        Alert.alert(
          "Wildlife Risk Alert",
          `Alert ${response.alertId} generated for ${animalId}. Ranger has been notified.`
        );
      }
    } catch (error) {
      Alert.alert(
        "Tracking Error",
        error instanceof Error ? error.message : "Unable to send GPS data."
      );
    } finally {
      setSending(false);
    }
  }

  async function startTracking() {
    if (!animalId) {
      Alert.alert("Select an animal", "Register an animal in the Animals page before starting tracking.");
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "This prototype GPS collar needs location permission to send animal coordinates."
        );
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentLat = currentPosition.coords.latitude;
      const currentLng = currentPosition.coords.longitude;

      setLatitude(currentLat);
      setLongitude(currentLng);
      setUpdatedAt(new Date().toLocaleTimeString());

      await submitLocation(currentLat, currentLng);

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

          void submitLocation(nextLat, nextLng);
        }
      );

      locationSubscription.current = subscription;
      setIsTracking(true);
    } catch (error) {
      Alert.alert(
        "GPS unavailable",
        error instanceof Error ? error.message : "Unable to access GPS position."
      );
    }
  }

  function stopTracking() {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
    Alert.alert("Tracking stopped", "The prototype collar is no longer sending GPS updates.");
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 px-5 py-6">
      <Text className="text-3xl font-bold text-slate-900">Wildlife Tracking</Text>

      <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
        <Text className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
          Prototype GPS collar
        </Text>

        <Text className="mt-4 text-sm font-semibold text-slate-700">Select registered animal</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {animals.map((animal) => (
            <Pressable
              key={animal.animalId}
              onPress={() => setAnimalId(animal.animalId)}
              disabled={isTracking || sending}
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

        <View className="mt-4 space-y-3">
          <Text className="text-base text-slate-700">
            Animal: <Text className="font-bold text-slate-900">{animalId || "Not selected"}</Text>
          </Text>

          <Text className="text-base text-slate-700">
            Status: <Text className="font-bold text-emerald-600">{isTracking ? "🟢 Tracking" : "🔴 Offline"}</Text>
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
        <Pressable
          onPress={startTracking}
          disabled={isTracking || sending}
          className={`rounded-2xl px-5 py-4 ${isTracking || sending ? "bg-emerald-200" : "bg-emerald-600"}`}
        >
          <Text className="text-center text-base font-bold text-white">
            {sending ? "Sending GPS..." : "START TRACKING"}
          </Text>
        </Pressable>

        <Pressable
          onPress={stopTracking}
          disabled={!isTracking}
          className={`rounded-2xl px-5 py-4 ${!isTracking ? "bg-slate-200" : "bg-red-600"}`}
        >
          <Text className="text-center text-base font-bold text-white">STOP TRACKING</Text>
        </Pressable>
      </View>

      {sending && (
        <View className="mt-6 flex-row items-center justify-center gap-2">
          <ActivityIndicator size="small" color="#059669" />
          <Text className="text-sm text-slate-600">Syncing location to backend...</Text>
        </View>
      )}
    </ScrollView>
  );
}
