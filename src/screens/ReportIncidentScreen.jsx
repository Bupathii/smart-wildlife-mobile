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
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import GlassBackground from '../components/GlassBackground';
import GlassCard from '../components/GlassCard';
import GlassField from '../components/GlassField';
import GlassButton from '../components/GlassButton';
import { colors } from '../theme/glass';
import { getCurrentLocation, GPS_UNAVAILABLE } from '../services/GPSService';
import { submitIncident, INCIDENT_TYPES, INCIDENT_TYPE_LABELS } from '../services/incidentService';

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

  // Auto-fetch GPS on mount (sequence diagram step 4)
  useEffect(() => {
    fetchGPS();
  }, []);

  const fetchGPS = useCallback(async () => {
    setLocationLoading(true);
    setGpsUnavailable(false);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (err) {
      if (err.code === GPS_UNAVAILABLE) {
        setGpsUnavailable(true);
      }
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // Manual location selection from map (A1 / E1)
  const handleMapConfirm = useCallback((coordinate) => {
    setLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      timestamp: new Date().toISOString(),
      source: 'MANUAL',
    });
    setShowMap(false);
    setGpsUnavailable(false);
  }, []);

  // Capture new photo (main scenario step 5)
  const handleCapturePhoto = useCallback(async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit reached', 'A maximum of 5 evidence photos is allowed.');
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed to capture evidence.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhotos((prev) => [
        ...prev,
        { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: `evidence_${Date.now()}.jpg` },
      ]);
    }
  }, [photos]);

  // Pick existing photo (A2)
  const handlePickPhoto = useCallback(async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit reached', 'A maximum of 5 evidence photos is allowed.');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission required', 'Gallery permission is needed to pick evidence.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhotos((prev) => [
        ...prev,
        { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: `evidence_${Date.now()}.jpg` },
      ]);
    }
  }, [photos]);

  const removePhoto = useCallback((index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Submit (sequence diagram steps 7-12)
  const handleSubmit = useCallback(async () => {
    setFieldErrors([]);
    setSubmitting(true);
    try {
      const result = await submitIncident({
        incidentType,
        description,
        location,
        evidencePhotos: photos,
      });

      navigation.replace('IncidentConfirmation', {
        syncStatus: result.syncStatus,
        clientIncidentId: result.clientIncidentId,
      });
    } catch (err) {
      if (err.missingFields) {
        setFieldErrors(err.missingFields);
        Alert.alert(
          'Missing information',
          `Please complete: ${err.missingFields.join(', ')}`
        );
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
          initialRegion={{
            latitude: location?.latitude ?? 7.8731,
            longitude: location?.longitude ?? 80.7718,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={(e) => handleMapConfirm(e.nativeEvent.coordinate)}
        >
          {location && (
            <Marker
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              title="Incident location"
            />
          )}
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
    <GlassBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.card}>
          <Text style={styles.eyebrow}>Member 3 — IT23820432</Text>
          <Text style={styles.title}>Report Incident</Text>

          {/* Incident type picker */}
          <Text style={styles.label}>
            Incident Type <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.typeGrid}>
            {INCIDENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, incidentType === type && styles.typeChipActive]}
                onPress={() => setIncidentType(type)}
                accessibilityRole="button"
                accessibilityLabel={`Incident type ${INCIDENT_TYPE_LABELS[type]}`}
              >
                <Text
                  style={[styles.typeChipText, incidentType === type && styles.typeChipTextActive]}
                >
                  {INCIDENT_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {fieldErrors.includes('incidentType') && (
            <Text style={styles.error}>Incident type is required</Text>
          )}

          {/* Location */}
          <Text style={styles.label}>
            Location <Text style={styles.required}>*</Text>
          </Text>
          {locationLoading ? (
            <ActivityIndicator color={colors.accent} style={styles.locationLoader} />
          ) : location ? (
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>
                {location.source === 'GPS' ? '📍 GPS' : '📌 Manual'}{' '}
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
              <TouchableOpacity onPress={() => setShowMap(true)}>
                <Text style={styles.adjustLink}>Adjust</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {gpsUnavailable && (
                <Text style={styles.gpsWarning}>
                  GPS unavailable — tap the map to set location manually.
                </Text>
              )}
              <GlassButton onPress={() => setShowMap(true)} style={styles.smallBtn}>
                Set Location on Map
              </GlassButton>
            </View>
          )}
          {fieldErrors.includes('location') && (
            <Text style={styles.error}>Valid location is required</Text>
          )}

          {/* Evidence photos */}
          <Text style={styles.label}>
            Evidence Photo <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.photoRow}>
            <GlassButton onPress={handleCapturePhoto} style={styles.photoBtn}>
              📷 Camera
            </GlassButton>
            <GlassButton onPress={handlePickPhoto} style={styles.photoBtn}>
              🖼 Gallery
            </GlassButton>
          </View>
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {photos.map((p, i) => (
                <TouchableOpacity key={i} onPress={() => removePhoto(i)} style={styles.photoThumb}>
                  <Image source={{ uri: p.uri }} style={styles.thumbImage} />
                  <Text style={styles.photoRemove}>✕</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {fieldErrors.includes('evidencePhotos') && (
            <Text style={styles.error}>At least one evidence photo is required</Text>
          )}

          {/* Description */}
          <GlassField
            label={
              <Text>
                Description <Text style={styles.required}>*</Text>
              </Text>
            }
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the incident..."
            multiline
            numberOfLines={4}
            style={styles.descField}
          />
          {fieldErrors.includes('description') && (
            <Text style={styles.error}>Description is required</Text>
          )}

          <GlassButton
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            style={styles.submitBtn}
          >
            Submit Report
          </GlassButton>
        </GlassCard>
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 16 },
  card: { marginBottom: 24 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.eyebrow,
    marginBottom: 6,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.white, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '500', color: colors.whiteLabel, marginTop: 12, marginBottom: 6 },
  required: { color: '#f87171' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.fieldBg,
  },
  typeChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  typeChipText: { color: colors.whiteMuted, fontSize: 13 },
  typeChipTextActive: { color: colors.accentText, fontWeight: '700' },
  locationLoader: { marginVertical: 10 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.fieldBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
  },
  locationText: { color: colors.white, fontSize: 13, flex: 1 },
  adjustLink: { color: colors.accent, fontSize: 13, fontWeight: '600', marginLeft: 8 },
  gpsWarning: { color: '#fbbf24', fontSize: 13, marginBottom: 8 },
  smallBtn: { paddingVertical: 10, marginBottom: 8 },
  photoRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  photoBtn: { flex: 1, paddingVertical: 10 },
  photoScroll: { marginBottom: 8 },
  photoThumb: { marginRight: 10, position: 'relative' },
  thumbImage: { width: 72, height: 72, borderRadius: 10 },
  photoRemove: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
    borderRadius: 10, width: 18, height: 18,
    textAlign: 'center', fontSize: 11, lineHeight: 18,
  },
  descField: { minHeight: 90 },
  submitBtn: { marginTop: 20 },
  error: { color: '#f87171', fontSize: 12, marginTop: 4 },
  mapOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(2,44,34,0.9)',
    padding: 16, alignItems: 'center',
  },
  mapHint: { color: colors.white, fontSize: 14, marginBottom: 10 },
  mapCancel: { padding: 8 },
  mapCancelText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
});

export default ReportIncidentScreen;
