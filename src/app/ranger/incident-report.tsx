import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  useCallback,
  useRef,
  useState,
} from "react";
import MapView, { Marker, MapPressEvent, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useAuth } from "@/context/AuthContext";
import { saveIncident, updateIncidentStatus } from "@/services/incident.storage";
import { submitIncidentReport } from "@/services/incident.service";
import { IncidentType, PendingIncidentReport } from "@/types/incident";
import NetInfo from "@react-native-community/netinfo";
import { MapPin, X, Navigation } from "lucide-react-native";

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "POACHING",          label: "Poaching" },
  { value: "ILLEGAL_CAMP",      label: "Illegal Camp" },
  { value: "SNARE",             label: "Snare" },
  { value: "ANIMAL_CARCASS",    label: "Animal Carcass" },
  { value: "ANIMAL_FOOTPRINT", label: "Animal Footprint" },
  { value: "OTHER",             label: "Other" },
];

const SEVERITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
];

type Step = "form" | "map";

function generateId(): string {
  return `inc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function IncidentReportScreen() {
  const { token } = useAuth();

  /* form state */
  const [incidentType, setIncidentType] = useState<IncidentType>("POACHING");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [step, setStep] = useState<Step>("form");

  /* location state */
  const [markerCoord, setMarkerCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locatingGPS, setLocatingGPS] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const mapRef = useRef<MapView>(null);

  const defaultRegion: Region = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.5,
    longitudeDelta: 0.3,
  };

  /* --- GPS --- */
  const handleGetGPS = useCallback(async () => {
    setLocatingGPS(true);
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to use GPS.",
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coord = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setMarkerCoord(coord);
      mapRef.current?.animateToRegion(
        { ...coord, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500,
      );
      setStep("map");
    } catch {
      Alert.alert("Error", "Could not get GPS location. Try manual pin.");
    } finally {
      setLocatingGPS(false);
    }
  }, []);

  /* --- map tap --- */
  const handleMapPress = useCallback((e: MapPressEvent) => {
    setMarkerCoord(e.nativeEvent.coordinate);
  }, []);

  /* --- submit --- */
  const handleSubmit = useCallback(async () => {
    if (!description.trim()) {
      Alert.alert("Required", "Please enter a description.");
      return;
    }
    if (!markerCoord) {
      Alert.alert("Location required", "Please pin the incident location on the map.");
      return;
    }

    setSubmitting(true);
    const clientIncidentId = generateId();

    const report: PendingIncidentReport = {
      clientIncidentId,
      incidentType,
      description: description.trim(),
      severity,
      location: {
        latitude: markerCoord.latitude,
        longitude: markerCoord.longitude,
        source: "GPS",
        timestamp: new Date().toISOString(),
      },
      evidenceUris: [],
      createdAt: new Date().toISOString(),
      syncStatus: "Pending",
    };

    await saveIncident(report);

    // try online submit
    const net = await NetInfo.fetch();
    let syncStatus: "Synchronized" | "Pending" = "Pending";
    let serverId: string | undefined;

    if (net.isConnected && token) {
      try {
        const res = await submitIncidentReport(
          {
            clientIncidentId,
            incidentType,
            description: description.trim(),
            severity,
            locationSource: "GPS",
            latitude: markerCoord.latitude,
            longitude: markerCoord.longitude,
            locationTimestamp: report.location.timestamp,
          },
          token,
        );
        if (res.success && res.data?._id) {
          syncStatus = "Synchronized";
          serverId = res.data._id as string;
          await updateIncidentStatus(clientIncidentId, "Synchronized", serverId);
        }
      } catch {
        // stay Pending – will sync later
      }
    }

    setSubmitting(false);

    router.replace({
      pathname: "/ranger/incident-confirm",
      params: { clientIncidentId, syncStatus, serverId: serverId ?? "" },
    });
  }, [description, markerCoord, incidentType, severity, token]);

  /* ---- MAP VIEW ---- */
  if (step === "map") {
    return (
      <View style={styles.mapRoot}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={
            markerCoord
              ? {
                  latitude: markerCoord.latitude,
                  longitude: markerCoord.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.03,
                }
              : defaultRegion
          }
          onPress={handleMapPress}
          showsUserLocation
        >
          {markerCoord && (
            <Marker coordinate={markerCoord} pinColor="#E11D48" />
          )}
        </MapView>

        <View style={styles.mapBottomSheet}>
          <Text style={styles.mapHint}>Tap the map to set the incident location</Text>
          <Pressable style={styles.cancelBtn} onPress={() => setStep("form")}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </View>

        {markerCoord && (
          <Pressable style={styles.mapConfirmBtn} onPress={() => setStep("form")}>
            <Text style={styles.mapConfirmText}>Confirm Location</Text>
          </Pressable>
        )}
      </View>
    );
  }

  /* ---- FORM VIEW ---- */
  return (
    <View style={styles.root}>
      <View style={[styles.circle, styles.circleTopLeft]} />
      <View style={[styles.circle, styles.circleBottomRight]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Incident Type */}
        <Text style={styles.sectionLabel}>Incident Type</Text>
        <View style={styles.typeGrid}>
          {INCIDENT_TYPES.map((t) => (
            <Pressable
              key={t.value}
              style={[
                styles.typeChip,
                incidentType === t.value && styles.typeChipActive,
              ]}
              onPress={() => setIncidentType(t.value)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  incidentType === t.value && styles.typeChipTextActive,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Severity */}
        <Text style={styles.sectionLabel}>Severity</Text>
        <View style={styles.severityRow}>
          {SEVERITY_OPTIONS.map((s) => (
            <Pressable
              key={s.value}
              style={[
                styles.severityChip,
                severity === s.value && styles.severityChipActive,
              ]}
              onPress={() => setSeverity(s.value as "LOW" | "MEDIUM" | "HIGH")}
            >
              <Text
                style={[
                  styles.severityText,
                  severity === s.value && styles.severityTextActive,
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Location */}
        <Text style={styles.sectionLabel}>Incident Location</Text>
        <View style={styles.locationRow}>
          <Pressable style={styles.locationBtn} onPress={handleGetGPS}>
            {locatingGPS ? (
              <ActivityIndicator size="small" color="#0F766E" />
            ) : (
              <Navigation size={18} color="#0F766E" strokeWidth={2} />
            )}
            <Text style={styles.locationBtnText}>Use GPS</Text>
          </Pressable>

          <Pressable
            style={styles.locationBtn}
            onPress={() => setStep("map")}
          >
            <MapPin size={18} color="#0F766E" strokeWidth={2} />
            <Text style={styles.locationBtnText}>Pin on Map</Text>
          </Pressable>
        </View>

        {markerCoord && (
          <View style={styles.coordCard}>
            <Text style={styles.coordText}>
              📍 {markerCoord.latitude.toFixed(5)}, {markerCoord.longitude.toFixed(5)}
            </Text>
            <Pressable onPress={() => setMarkerCoord(null)}>
              <X size={16} color="#64748b" />
            </Pressable>
          </View>
        )}

        {/* Description */}
        <Text style={styles.sectionLabel}>Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe what you observed..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
          maxLength={1500}
        />
        <Text style={styles.charCount}>{description.length} / 1500</Text>

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Incident Report</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const BG = "#EEF7EE";
const PRIMARY = "#0F766E";
const CIRCLE_COLOR = "rgba(15,118,110,0.07)";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  circle: { position: "absolute", borderRadius: 999, backgroundColor: CIRCLE_COLOR },
  circleTopLeft: { width: 200, height: 200, top: -60, left: -60 },
  circleBottomRight: { width: 260, height: 260, bottom: -80, right: -80 },

  scroll: { padding: 18, paddingBottom: 60, gap: 6 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 8,
  },

  /* Type chips */
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  typeChipActive: { borderColor: PRIMARY, backgroundColor: "#dcfce7" },
  typeChipText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  typeChipTextActive: { color: "#14532d", fontWeight: "700" },

  /* Severity */
  severityRow: { flexDirection: "row", gap: 10 },
  severityChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  severityChipActive: { borderColor: PRIMARY, backgroundColor: "#dcfce7" },
  severityText: { fontSize: 13, color: "#475569", fontWeight: "600" },
  severityTextActive: { color: "#14532d" },

  /* Location */
  locationRow: { flexDirection: "row", gap: 10 },
  locationBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    backgroundColor: "#fff",
  },
  locationBtnText: { fontSize: 14, color: PRIMARY, fontWeight: "600" },

  coordCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  coordText: { fontSize: 12, color: "#166534", fontWeight: "500" },

  /* Description */
  textArea: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
    minHeight: 110,
  },
  charCount: { fontSize: 11, color: "#94a3b8", textAlign: "right", marginTop: 4 },

  /* Submit */
  submitBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  /* Map */
  mapRoot: { flex: 1 },
  mapBottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  mapHint: { fontSize: 15, color: "#475569", marginBottom: 12 },
  cancelBtn: { paddingVertical: 6 },
  cancelBtnText: { fontSize: 15, color: PRIMARY, fontWeight: "600" },

  mapConfirmBtn: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: PRIMARY,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  mapConfirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
