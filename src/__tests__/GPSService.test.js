jest.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

import * as Location from 'expo-location';
import { getCurrentLocation, GPS_UNAVAILABLE } from '../services/GPSService';

describe('GPSService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a LocationPoint when permission granted and position available', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 7.8731, longitude: 80.7718 },
      timestamp: new Date('2024-01-15T10:00:00Z').getTime(),
    });

    const result = await getCurrentLocation();

    expect(result.latitude).toBe(7.8731);
    expect(result.longitude).toBe(80.7718);
    expect(result.source).toBe('GPS');
    expect(typeof result.timestamp).toBe('string');
  });

  it('throws GPS_UNAVAILABLE when permission denied', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

    await expect(getCurrentLocation()).rejects.toMatchObject({ code: GPS_UNAVAILABLE });
  });

  it('throws GPS_UNAVAILABLE when hardware fails', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockRejectedValue(new Error('Hardware error'));

    await expect(getCurrentLocation()).rejects.toMatchObject({ code: GPS_UNAVAILABLE });
  });

  it('wraps hardware error message in a readable message', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockRejectedValue(new Error('Timeout'));

    try {
      await getCurrentLocation();
    } catch (err) {
      expect(err.message).toBe('GPS is currently unavailable');
    }
  });
});
