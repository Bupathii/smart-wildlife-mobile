import { useThemedStyles } from "@/theme/useThemedStyles";
import { Reveal } from "@/components/premium/Motion";
import { ShieldCheck, RadioTower } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
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
import { Camera, Images, MapPin, X, Navigation } from "lucide-react-native";

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
  const themedStyles = useThemedStyles(styles);
  const { token } = useAuth();

  /* form state */
  const [incidentType, setIncidentType] = useState<IncidentType>("POACHING");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [step, setStep] = useState<Step>("form");

  /* evidence photo */
  const [evidenceUri, setEvidenceUri] = useState<string | null>(null);

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

  /* --- Evidence photo --- */
  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera permission is needed to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setEvidenceUri(result.assets[0].uri);
    }
  }, []);

  const handleSelectFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Photo library permission is needed to select a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setEvidenceUri(result.assets[0].uri);
    }
  }, []);

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
      evidenceUris: evidenceUri ? [evidenceUri] : [],
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
            evidenceUris: evidenceUri ? [evidenceUri] : [],
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
  }, [description, markerCoord, incidentType, severity, token, evidenceUri]);

  /* ---- MAP VIEW ---- */
  if (step === "map") {
    return (
      <View style={themedStyles.mapRoot}>
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

        <View style={themedStyles.mapBottomSheet}>
          <Text style={themedStyles.mapHint}>Tap the map to set the incident location</Text>
          <Pressable style={themedStyles.cancelBtn} onPress={() => setStep("form")}>
            <Text style={themedStyles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </View>

        {markerCoord && (
          <Pressable style={themedStyles.mapConfirmBtn} onPress={() => setStep("form")}>
            <Text style={themedStyles.mapConfirmText}>Confirm Location</Text>
          </Pressable>
        )}
      </View>
    );
  }

  /* ---- FORM VIEW ---- */
  return (
    <View style={themedStyles.root}>

      <ScrollView
        contentContainerStyle={themedStyles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Reveal style={{ marginBottom: 9 }}>
          <View style={{ backgroundColor: "#0E3A30", paddingHorizontal: 21, paddingVertical: 20, borderRadius: 23, overflow: "hidden" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <RadioTower size={15} color="#E7C17B" />
              <Text style={{ color: "#E7C17B", fontSize: 10, fontWeight: "800", letterSpacing: 1.6 }}>FIELD OBSERVATION</Text>
            </View>
            <Text style={{ color: "#FFFFFF", fontSize: 23, fontWeight: "900", letterSpacing: -0.6 }}>New incident report</Text>
            <Text style={{ color: "#BED8CA", fontSize: 12, lineHeight: 18, marginTop: 8 }}>
              Record what happened, attach evidence and identify the exact location.
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 15 }}>
              <ShieldCheck size={14} color="#79DAAB" />
              <Text style={{ color: "#D8EDE0", fontSize: 11, fontWeight: "700" }}>Field-ready reporting · Offline support</Text>
            </View>
          </View>
        </Reveal>
        {/* Incident Type */}
        <Text style={themedStyles.sectionLabel}>Incident Type</Text>
        <View style={themedStyles.typeGrid}>
          {INCIDENT_TYPES.map((t) => (
            <Pressable
              key={t.value}
              style={[
                themedStyles.typeChip,
                incidentType === t.value && themedStyles.typeChipActive,
              ]}
              onPress={() => setIncidentType(t.value)}
            >
              <Text
                style={[
                  themedStyles.typeChipText,
                  incidentType === t.value && themedStyles.typeChipTextActive,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Severity */}
        <Text style={themedStyles.sectionLabel}>Severity</Text>
        <View style={themedStyles.severityRow}>
          {SEVERITY_OPTIONS.map((s) => (
            <Pressable
              key={s.value}
              style={[
                themedStyles.severityChip,
                severity === s.value && themedStyles.severityChipActive,
              ]}
              onPress={() => setSeverity(s.value as "LOW" | "MEDIUM" | "HIGH")}
            >
              <Text
                style={[
                  themedStyles.severityText,
                  severity === s.value && themedStyles.severityTextActive,
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Location */}
        <Text style={themedStyles.sectionLabel}>Incident Location</Text>
        <View style={themedStyles.locationRow}>
          <Pressable style={themedStyles.locationBtn} onPress={handleGetGPS}>
            {locatingGPS ? (
              <ActivityIndicator size="small" color="#0F766E" />
            ) : (
              <Navigation size={18} color="#0F766E" strokeWidth={2} />
            )}
            <Text style={themedStyles.locationBtnText}>Use GPS</Text>
          </Pressable>

          <Pressable
            style={themedStyles.locationBtn}
            onPress={() => setStep("map")}
          >
            <MapPin size={18} color="#0F766E" strokeWidth={2} />
            <Text style={themedStyles.locationBtnText}>Pin on Map</Text>
          </Pressable>
        </View>

        {markerCoord && (
          <View style={themedStyles.coordCard}>
            <Text style={themedStyles.coordText}>
              📍 {markerCoord.latitude.toFixed(5)}, {markerCoord.longitude.toFixed(5)}
            </Text>
            <Pressable onPress={() => setMarkerCoord(null)}>
              <X size={16} color="#64748b" />
            </Pressable>
          </View>
        )}

        {/* Evidence Photo */}
        <Text style={themedStyles.sectionLabel}>Evidence Photo</Text>
        <View style={themedStyles.evidenceBtnRow}>
          <Pressable style={themedStyles.evidenceBtn} onPress={handleTakePhoto}>
            <Camera size={18} color={PRIMARY} strokeWidth={2} />
            <Text style={themedStyles.evidenceBtnText}>Camera</Text>
          </Pressable>
          <Pressable style={[themedStyles.evidenceBtn, themedStyles.evidenceBtnGallery]} onPress={handleSelectFromGallery}>
            <Images size={18} color="#166534" strokeWidth={2} />
            <Text style={[themedStyles.evidenceBtnText, themedStyles.evidenceBtnGalleryText]}>Gallery</Text>
          </Pressable>
        </View>

        {evidenceUri && (
          <View style={themedStyles.evidenceThumbContainer}>
            <Image
              source={{ uri: evidenceUri }}
              style={themedStyles.evidenceThumb}
              resizeMode="cover"
            />
            <Pressable
              style={themedStyles.evidenceRemoveBtn}
              onPress={() => setEvidenceUri(null)}
              hitSlop={8}
            >
              <X size={12} color="#fff" strokeWidth={3} />
            </Pressable>
          </View>
        )}

        {/* Description */}
        <Text style={themedStyles.sectionLabel}>Description</Text>
        <TextInput
          style={themedStyles.textArea}
          placeholder="Describe what you observed..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
          maxLength={1500}
        />
        <Text style={themedStyles.charCount}>{description.length} / 1500</Text>

        {/* Submit */}
        <Pressable
          style={[themedStyles.submitBtn, submitting && themedStyles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={themedStyles.submitBtnText}>Submit Incident Report</Text>
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

  /* Evidence photo */
  evidenceBtnRow: { flexDirection: "row", gap: 10 },
  evidenceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    backgroundColor: "#fff",
  },
  evidenceBtnGallery: {
    borderColor: "#166534",
    backgroundColor: "#dcfce7",
  },
  evidenceBtnText: { fontSize: 14, color: PRIMARY, fontWeight: "600" },
  evidenceBtnGalleryText: { color: "#166534" },
  evidenceThumbContainer: {
    marginTop: 10,
    position: "relative",
    alignSelf: "flex-start",
  },
  evidenceThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  evidenceRemoveBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },

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
