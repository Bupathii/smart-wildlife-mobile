import * as Location from 'expo-location';

// Error code used so callers can distinguish GPS unavailability from other errors
export const GPS_UNAVAILABLE = 'GPS_UNAVAILABLE';

/**
 * Request foreground location permission from the OS.
 * Throws with code GPS_UNAVAILABLE if permission is denied.
 *
 * @returns {Promise<void>}
 */
async function ensurePermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    const err = new Error('Location permission denied');
    err.code = GPS_UNAVAILABLE;
    throw err;
  }
}

/**
 * Get the device's current GPS position.
 *
 * Corresponds to GPSService.getCurrentLocation() in the class diagram.
 * Returns a LocationPoint-compatible object: { latitude, longitude, timestamp, source }.
 *
 * Throws an error with code GPS_UNAVAILABLE when:
 *   - permission denied
 *   - hardware unavailable
 *
 * @returns {Promise<{ latitude: number, longitude: number, timestamp: string, source: 'GPS' }>}
 */
export async function getCurrentLocation() {
  try {
    await ensurePermission();

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date(position.timestamp).toISOString(),
      source: 'GPS',
    };
  } catch (error) {
    if (error.code === GPS_UNAVAILABLE) throw error;

    // Wrap hardware/timeout failures with a consistent code
    const wrapped = new Error('GPS is currently unavailable');
    wrapped.code = GPS_UNAVAILABLE;
    throw wrapped;
  }
}
