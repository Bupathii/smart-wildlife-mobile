import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  checkConnectivity,
  storeOffline,
  submitToServer,
  subscribeToConnectivity,
} from "@/services/incident.sync";
import {
  saveIncident,
  SyncStatus,
  type IncidentRecord,
} from "@/services/incident.storage";

const INCIDENT_TYPES = [
  { key: "POACHING", label: "Poaching" },
  { key: "ILLEGAL_LOGGING", label: "Illegal Logging" },
  { key: "ANIMAL_INJURY", label: "Animal Injury" },
  { key: "HABITAT_DESTRUCTION", label: "Habitat Destruction" },
  { key: "OTHER", label: "Other" },
];

const SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ReportIncidentScreen() {
  const { token } = useAuth();

  const [incidentType, setIncidentType] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationSource, setLocationSource] = useState("GPS");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchGPS();
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  async function fetchGPS() {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationSource("MANUAL");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setLocationSource("GPS");
    } catch {
      setLocationSource("MANUAL");
    } finally {
      setGpsLoading(false);
    }
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera roll access is needed to upload evidence.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera access is needed to capture evidence.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!incidentType) { Alert.alert("Required", "Please select an incident type."); return; }
    if (!description.trim()) { Alert.alert("Required", "Please enter a description."); return; }
    if (!latitude || !longitude) { Alert.alert("Required", "Location is required. Please fetch GPS or enter manually."); return; }

    const incident: IncidentRecord = {
      clientIncidentId: uuid(),
      incidentType,
      description: description.trim(),
      latitude,
      longitude,
      locationSource,
      severity,
      evidencePhotoUri: photoUri ?? undefined,
      syncStatus: SyncStatus.PENDING_SYNC,
      createdAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      await saveIncident(incident);
      const online = await checkConnectivity();

      if (online && token) {
        const result = await submitToServer(incident, token);
        if (result.success) {
          const { markSynchronized } = await import("@/services/incident.storage");
          await markSynchronized(incident.clientIncidentId, result.serverId);
          incident.syncStatus = SyncStatus.SYNCHRONIZED;
        } else {
          if (token) {
            unsubscribeRef.current = subscribeToConnectivity(token);
          }
        }
      } else if (token) {
        unsubscribeRef.current = subscribeToConnectivity(token);
      }

      router.push({
        pathname: "/ranger/incident-confirm",
        params: {
          syncStatus: incident.syncStatus,
          incidentType: incident.incidentType,
        },
      });
    } catch (err) {
      Alert.alert("Error", "Failed to save incident. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Incident Type */}
      <Text style={styles.label}>Incident Type *</Text>
      <View style={styles.chipRow}>
        {INCIDENT_TYPES.map(({ key: k, label }) => (
          <TouchableOpacity
            key={k}
            style={[styles.chip, incidentType === k && styles.chipActive]}
            onPress={() => setIncidentType(k)}
          >
            <Text style={[styles.chipText, incidentType === k && styles.chipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* GPS Location */}
      <Text style={styles.label}>Location *</Text>
      <View style={styles.locationCard}>
        {gpsLoading ? (
          <ActivityIndicator color="#0F766E" />
        ) : latitude ? (
          <Text style={styles.locationText}>
            📍 {locationSource} · {latitude.toFixed(5)}, {longitude!.toFixed(5)}
          </Text>
        ) : (
          <Text style={styles.locationMuted}>GPS unavailable — enter coordinates below</Text>
        )}
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchGPS}>
          <Text style={styles.refreshBtnText}>Refresh GPS</Text>
        </TouchableOpacity>
      </View>

      {/* Manual lat/lng if GPS unavailable */}
      {!latitude && !gpsLoading && (
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="e.g. 7.8731"
              onChangeText={(v) => setLatitude(parseFloat(v) || null)}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="e.g. 80.7718"
              onChangeText={(v) => setLongitude(parseFloat(v) || null)}
            />
          </View>
        </View>
      )}

      {/* Severity */}
      <Text style={styles.label}>Severity</Text>
      <View style={styles.chipRow}>
        {SEVERITY_LEVELS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, severity === s && styles.chipActive]}
            onPress={() => setSeverity(s)}
          >
            <Text style={[styles.chipText, severity === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Evidence Photo */}
      <Text style={styles.label}>Evidence Photo</Text>
      {photoUri && <Image source={{ uri: photoUri }} style={styles.photoPreview} />}
      <View style={styles.row}>
        <TouchableOpacity style={[styles.outlineBtn, { flex: 1, marginRight: 6 }]} onPress={takePhoto}>
          <Text style={styles.outlineBtnText}>📷 Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.outlineBtn, { flex: 1, marginLeft: 6 }]} onPress={pickPhoto}>
          <Text style={styles.outlineBtnText}>🖼 Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe the incident in detail..."
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Report</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.myReportsLink} onPress={() => router.push("/ranger/my-incidents")}>
        <Text style={styles.myReportsLinkText}>View My Reports →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7f5" },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: "#CBD5E1", backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#0F766E", borderColor: "#0F766E" },
  chipText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  locationCard: {
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  locationText: { fontSize: 13, color: "#0F766E", fontWeight: "500", marginBottom: 8 },
  locationMuted: { fontSize: 13, color: "#94A3B8", marginBottom: 8 },
  refreshBtn: { alignSelf: "flex-start" },
  refreshBtnText: { fontSize: 12, color: "#0F766E", fontWeight: "600" },
  row: { flexDirection: "row" },
  input: {
    backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0",
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1F2937",
  },
  textArea: { minHeight: 100, textAlignVertical: "top", marginTop: 0 },
  photoPreview: { width: "100%", height: 180, borderRadius: 10, marginBottom: 8 },
  outlineBtn: {
    borderWidth: 1.5, borderColor: "#0F766E", borderRadius: 8,
    paddingVertical: 10, alignItems: "center",
  },
  outlineBtnText: { color: "#0F766E", fontWeight: "600", fontSize: 13 },
  submitBtn: {
    marginTop: 24, backgroundColor: "#0F766E", borderRadius: 10,
    paddingVertical: 14, alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  myReportsLink: { marginTop: 14, alignItems: "center" },
  myReportsLinkText: { color: "#0F766E", fontSize: 13, fontWeight: "600" },
});