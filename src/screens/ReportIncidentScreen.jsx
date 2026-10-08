import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { getCurrentLocation, GPS_UNAVAILABLE } from '../services/GPSService';
import { submitIncident, INCIDENT_TYPES, INCIDENT_TYPE_LABELS } from '../services/incidentService';

const T = {
  bg: '#f5f7f5',
  card: '#ffffff',
  primary: '#0F766E',
  primaryText: '#ffffff',
  text: '#111827',
  label: '#374151',
  muted: '#6B7280',
  faint: '#9CA3AF',
  border: '#E2E8F0',
  chipBg: '#ffffff',
  chipBorder: '#CBD5E1',
  error: '#EF4444',
  warning: '#D97706',
};

function ReportIncidentScreen({ navigation }) {
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [gpsUnavailable, setGpsUnavailable] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => { fetchGPS(); }, []);

  const fetchGPS = useCallback(async () => {
    setLocationLoading(true);
    setGpsUnavailable(false);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (err) {
      if (err.code === GPS_UNAVAILABLE) setGpsUnavailable(true);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const handleMapConfirm = useCallback((coordinate) => {
    setLocation({ latitude: coordinate.latitude, longitude: coordinate.longitude, timestamp: new Date().toISOString(), source: 'MANUAL' });
    setShowMap(false);
    setGpsUnavailable(false);
  }, []);

  const handleCapturePhoto = useCallback(async () => {
    if (photos.length >= 5) { Alert.alert('Limit reached', 'Maximum 5 evidence photos allowed.'); return; }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') { Alert.alert('Permission required', 'Camera permission needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets?.length) {
      const a = result.assets[0];
      setPhotos((prev) => [...prev, { uri: a.uri, type: a.mimeType || 'image/jpeg', name: `evidence_${Date.now()}.jpg` }]);
    }
  }, [photos]);

  const handlePickPhoto = useCallback(async () => {
    if (photos.length >= 5) { Alert.alert('Limit reached', 'Maximum 5 evidence photos allowed.'); return; }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') { Alert.alert('Permission required', 'Gallery permission needed.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets?.length) {
      const a = result.assets[0];
      setPhotos((prev) => [...prev, { uri: a.uri, type: a.mimeType || 'image/jpeg', name: `evidence_${Date.now()}.jpg` }]);
    }
  }, [photos]);

  const removePhoto = useCallback((index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    setFieldErrors([]);
    setSubmitting(true);
    try {
      const result = await submitIncident({ incidentType, description, location, evidencePhotos: photos });
      navigation.replace('IncidentConfirmation', { syncStatus: result.syncStatus, clientIncidentId: result.clientIncidentId });
    } catch (err) {
      if (err.missingFields) {
        setFieldErrors(err.missingFields);
        Alert.alert('Missing information', `Please complete: ${err.missingFields.join(', ')}`);
      } else {
        Alert.alert('Error', err.message || 'Submission failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [incidentType, description, location, photos, navigation]);

  if (showMap) {
    return (
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{ latitude: location?.latitude ?? 7.8731, longitude: location?.longitude ?? 80.7718, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          onPress={(e) => handleMapConfirm(e.nativeEvent.coordinate)}
        >
          {location && <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} title="Incident location" />}
        </MapView>
        <View style={styles.mapOverlay}>
          <Text style={styles.mapHint}>Tap the map to set the incident location</Text>
          <TouchableOpacity style={styles.mapCancel} onPress={() => setShowMap(false)}>
            <Text style={styles.mapCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Incident Type */}
      <Text style={styles.label}>Incident Type <Text style={styles.required}>*</Text></Text>
      <View style={styles.chipRow}>
        {INCIDENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, incidentType === type && styles.chipActive]}
            onPress={() => setIncidentType(type)}
          >
            <Text style={[styles.chipText, incidentType === type && styles.chipTextActive]}>
              {INCIDENT_TYPE_LABELS[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {fieldErrors.includes('incidentType') && <Text style={styles.error}>Incident type is required</Text>}

      {/* Location */}
      <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
      {locationLoading ? (
        <ActivityIndicator color={T.primary} style={{ marginVertical: 10 }} />
      ) : location ? (
        <View style={styles.locationCard}>
          <Text style={styles.locationText}>
            {location.source === 'GPS' ? '📍 GPS' : '📌 Manual'} {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </Text>
          <TouchableOpacity onPress={() => setShowMap(true)}>
            <Text style={styles.adjustLink}>Adjust</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {gpsUnavailable && <Text style={styles.gpsWarning}>GPS unavailable — tap the map to set location manually.</Text>}
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowMap(true)}>
            <Text style={styles.outlineBtnText}>📌 Set Location on Map</Text>
          </TouchableOpacity>
        </View>
      )}
      {fieldErrors.includes('location') && <Text style={styles.error}>Valid location is required</Text>}

      {/* Evidence Photos */}
      <Text style={styles.label}>Evidence Photo <Text style={styles.required}>*</Text></Text>
      <View style={styles.photoRow}>
        <TouchableOpacity style={[styles.outlineBtn, { flex: 1, marginRight: 6 }]} onPress={handleCapturePhoto}>
          <Text style={styles.outlineBtnText}>📷 Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.outlineBtn, { flex: 1, marginLeft: 6 }]} onPress={handlePickPhoto}>
          <Text style={styles.outlineBtnText}>🖼 Gallery</Text>
        </TouchableOpacity>
      </View>
      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {photos.map((p, i) => (
            <TouchableOpacity key={i} onPress={() => removePhoto(i)} style={styles.photoThumb}>
              <Image source={{ uri: p.uri }} style={styles.thumbImage} />
              <Text style={styles.photoRemove}>✕</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {fieldErrors.includes('evidencePhotos') && <Text style={styles.error}>At least one evidence photo is required</Text>}

      {/* Description */}
      <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe the incident in detail..."
        placeholderTextColor={T.faint}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />
      {fieldErrors.includes('description') && <Text style={styles.error}>Description is required</Text>}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>Submit Report</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.myReportsLink} onPress={() => navigation.navigate('MyIncidentReports')}>
        <Text style={styles.myReportsLinkText}>View My Reports →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: T.label, marginTop: 16, marginBottom: 6 },
  required: { color: T.error },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: T.chipBorder, backgroundColor: T.chipBg },
  chipActive: { backgroundColor: T.primary, borderColor: T.primary },
  chipText: { fontSize: 13, color: T.muted, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  locationCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: T.border },
  locationText: { fontSize: 13, color: T.primary, fontWeight: '500', flex: 1 },
  adjustLink: { color: T.primary, fontSize: 13, fontWeight: '600', marginLeft: 8 },
  gpsWarning: { color: T.warning, fontSize: 13, marginBottom: 8 },
  outlineBtn: { borderWidth: 1.5, borderColor: T.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginBottom: 8 },
  outlineBtnText: { color: T.primary, fontWeight: '600', fontSize: 13 },
  photoRow: { flexDirection: 'row', marginBottom: 4 },
  photoThumb: { marginRight: 10, position: 'relative' },
  thumbImage: { width: 72, height: 72, borderRadius: 10 },
  photoRemove: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 10, width: 18, height: 18, textAlign: 'center', fontSize: 11, lineHeight: 18 },
  input: { backgroundColor: T.card, borderRadius: 8, borderWidth: 1, borderColor: T.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: T.text },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  submitBtn: { marginTop: 24, backgroundColor: T.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  myReportsLink: { marginTop: 14, alignItems: 'center' },
  myReportsLinkText: { color: T.primary, fontSize: 13, fontWeight: '600' },
  error: { color: T.error, fontSize: 12, marginTop: 4 },
  mapOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,118,110,0.92)', padding: 16, alignItems: 'center' },
  mapHint: { color: '#fff', fontSize: 14, marginBottom: 10 },
  mapCancel: { padding: 8 },
  mapCancelText: { color: '#6ee7b7', fontSize: 14, fontWeight: '600' },
});

export default ReportIncidentScreen;
