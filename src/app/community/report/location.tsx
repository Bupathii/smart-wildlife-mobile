import {
    CheckCircle2,
    LocateFixed,
    MapPin,
    Navigation,
    PencilLine,
} from "lucide-react-native";

import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    router,
} from "expo-router";

import * as Location from "expo-location";

import {
    useState,
} from "react";

import {
    useConflictReport,
} from "@/context/ConflictReportContext";

import {
    LocationSource,
} from "@/types/conflict";

export default function ConflictLocationScreen() {
  const {
    draft,
    setLocation,
  } = useConflictReport();

  const [
    selectedSource,
    setSelectedSource,
  ] =
    useState<LocationSource | null>(
      draft.location.source
    );

  const [
    manualLocation,
    setManualLocation,
  ] = useState(
    draft.location
      .manualLocation || ""
  );

  const [
    latitude,
    setLatitude,
  ] = useState<
    number | undefined
  >(
    draft.location.latitude
  );

  const [
    longitude,
    setLongitude,
  ] = useState<
    number | undefined
  >(
    draft.location.longitude
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function getCurrentLocation() {
    try {
      setLoading(true);

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (
        permission.status !==
        "granted"
      ) {
        Alert.alert(
          "Location Permission Required",
          "Location permission was not granted. You can enter the conflict location manually."
        );

        setSelectedSource(
          "MANUAL"
        );

        return;
      }

      const position =
        await Location.getCurrentPositionAsync(
          {
            accuracy:
              Location.Accuracy.High,
          }
        );

      setLatitude(
        position.coords.latitude
      );

      setLongitude(
        position.coords.longitude
      );

      setSelectedSource(
        "GPS"
      );
    } catch {
      Alert.alert(
        "Unable to Get Location",
        "GPS location could not be detected. Please enter the approximate location manually."
      );

      setSelectedSource(
        "MANUAL"
      );
    } finally {
      setLoading(false);
    }
  }

  function selectManual() {
    setSelectedSource(
      "MANUAL"
    );

    setLatitude(undefined);
    setLongitude(undefined);
  }

  function handleContinue() {
    if (
      selectedSource ===
      "GPS"
    ) {
      if (
        latitude === undefined ||
        longitude === undefined
      ) {
        Alert.alert(
          "Location Required",
          "Please capture your GPS location first."
        );

        return;
      }

      setLocation({
        source: "GPS",
        latitude,
        longitude,
      });
    } else if (
      selectedSource ===
      "MANUAL"
    ) {
      if (
        !manualLocation.trim()
      ) {
        Alert.alert(
          "Location Required",
          "Please enter an approximate location."
        );

        return;
      }

      setLocation({
        source: "MANUAL",
        manualLocation:
          manualLocation.trim(),
      });
    } else {
      Alert.alert(
        "Select Location",
        "Please use GPS or enter the location manually."
      );

      return;
    }

    router.push(
      "/community/report/details"
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text className="text-[26px] font-bold text-slate-900">
          Where did it happen?
        </Text>

        <Text className="mt-2 text-sm leading-6 text-slate-500">
          Capture the location with
          GPS or manually enter an
          approximate location.
        </Text>

        <View className="mt-7 gap-4">
          {/* GPS */}

          <Pressable
            onPress={
              getCurrentLocation
            }
            disabled={loading}
            className={`rounded-2xl border p-5 ${
              selectedSource ===
              "GPS"
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <View className="flex-row items-center">
              <View
                className={`h-12 w-12 items-center justify-center rounded-xl ${
                  selectedSource ===
                  "GPS"
                    ? "bg-blue-600"
                    : "bg-blue-50"
                }`}
              >
                {loading ? (
                  <ActivityIndicator
                    color={
                      selectedSource ===
                      "GPS"
                        ? "#FFFFFF"
                        : "#2563EB"
                    }
                  />
                ) : (
                  <LocateFixed
                    size={22}
                    color={
                      selectedSource ===
                      "GPS"
                        ? "#FFFFFF"
                        : "#2563EB"
                    }
                  />
                )}
              </View>

              <View className="ml-4 flex-1">
                <Text className="text-base font-bold text-slate-800">
                  Use GPS Location
                </Text>

                <Text className="mt-1 text-xs leading-5 text-slate-500">
                  Capture your current
                  latitude and longitude
                  automatically.
                </Text>
              </View>

              {selectedSource ===
                "GPS" &&
                latitude !==
                  undefined && (
                  <CheckCircle2
                    size={22}
                    color="#2563EB"
                  />
                )}
            </View>

            {selectedSource ===
              "GPS" &&
              latitude !==
                undefined &&
              longitude !==
                undefined && (
                <View className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
                  <View className="flex-row items-center">
                    <Navigation
                      size={16}
                      color="#2563EB"
                    />

                    <Text className="ml-2 text-xs font-bold text-blue-800">
                      Location captured
                    </Text>
                  </View>

                  <Text className="mt-3 text-xs text-slate-500">
                    Latitude:{" "}
                    {latitude.toFixed(
                      6
                    )}
                  </Text>

                  <Text className="mt-1 text-xs text-slate-500">
                    Longitude:{" "}
                    {longitude.toFixed(
                      6
                    )}
                  </Text>
                </View>
              )}
          </Pressable>

          <View className="flex-row items-center">
            <View className="h-px flex-1 bg-slate-200" />

            <Text className="mx-3 text-xs font-bold text-slate-400">
              OR
            </Text>

            <View className="h-px flex-1 bg-slate-200" />
          </View>

          {/* Manual location */}

          <Pressable
            onPress={
              selectManual
            }
            className={`rounded-2xl border p-5 ${
              selectedSource ===
              "MANUAL"
                ? "border-teal-500 bg-teal-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <View className="flex-row items-center">
              <View
                className={`h-12 w-12 items-center justify-center rounded-xl ${
                  selectedSource ===
                  "MANUAL"
                    ? "bg-teal-700"
                    : "bg-teal-50"
                }`}
              >
                <PencilLine
                  size={22}
                  color={
                    selectedSource ===
                    "MANUAL"
                      ? "#FFFFFF"
                      : "#0F766E"
                  }
                />
              </View>

              <View className="ml-4 flex-1">
                <Text className="text-base font-bold text-slate-800">
                  Enter Manually
                </Text>

                <Text className="mt-1 text-xs leading-5 text-slate-500">
                  Enter the village,
                  road, landmark or
                  approximate area.
                </Text>
              </View>
            </View>

            {selectedSource ===
              "MANUAL" && (
                <View className="mt-4">
                  <View className="mb-2 flex-row items-center">
                    <MapPin
                      size={16}
                      color="#0F766E"
                    />

                    <Text className="ml-2 text-xs font-bold text-slate-700">
                      Approximate location
                    </Text>
                  </View>

                  <TextInput
                    value={
                      manualLocation
                    }
                    onChangeText={
                      setManualLocation
                    }
                    multiline
                    textAlignVertical="top"
                    placeholder="Example: Near Wewa Road, eastern village boundary"
                    placeholderTextColor="#94A3B8"
                    className="min-h-24 rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm text-slate-800"
                  />
                </View>
              )}
          </Pressable>
        </View>

        <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-xs leading-5 text-slate-500">
            If GPS is unavailable or
            inaccurate, use the manual
            option and provide enough
            location information for
            wildlife personnel.
          </Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 pb-5 pt-4">
        <Pressable
          onPress={
            handleContinue
          }
          className="h-14 items-center justify-center rounded-2xl bg-teal-700"
        >
          <Text className="text-base font-bold text-white">
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}