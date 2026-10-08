jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

jest.mock('../api/incidents', () => ({
  createIncident: jest.fn(),
}));

jest.mock('../services/IncidentStorage', () => ({
  getAllPending: jest.fn(),
  markSynchronized: jest.fn(),
  saveIncident: jest.fn(),
  SyncStatus: { PENDING_SYNC: 'PENDING_SYNC', SYNCHRONIZED: 'SYNCHRONIZED' },
}));


import NetInfo from '@react-native-community/netinfo';
import { createIncident } from '../api/incidents';
import { getAllPending, markSynchronized } from '../services/IncidentStorage';
import {
  checkConnectivity,
  storeOffline,
  synchronizeData,
  retrySynchronization,
  subscribeToConnectivity,
} from '../services/SyncManager';

const makeIncident = (id) => ({
  clientIncidentId: id,
  incidentType: 'SNARE',
  description: 'Test',
  location: { source: 'GPS', latitude: 7.0, longitude: 80.0, timestamp: new Date().toISOString() },
  evidencePhotos: [{ uri: 'file://photo.jpg', type: 'image/jpeg', name: 'photo.jpg' }],
  severity: 'MEDIUM',
  syncStatus: 'PENDING_SYNC',
});

describe('SyncManager', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('checkConnectivity', () => {
    it('returns true when connected and internet reachable', async () => {
      NetInfo.fetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
      expect(await checkConnectivity()).toBe(true);
    });

    it('returns false when not connected', async () => {
      NetInfo.fetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });
      expect(await checkConnectivity()).toBe(false);
    });

    it('returns false when internet unreachable', async () => {
      NetInfo.fetch.mockResolvedValue({ isConnected: true, isInternetReachable: false });
      expect(await checkConnectivity()).toBe(false);
    });
  });

  describe('synchronizeData', () => {
    it('syncs all pending incidents and marks them synchronized', async () => {
      getAllPending.mockResolvedValue([makeIncident('u1'), makeIncident('u2')]);
      createIncident.mockResolvedValue({ success: true });
      markSynchronized.mockResolvedValue();

      const result = await synchronizeData();

      expect(createIncident).toHaveBeenCalledTimes(2);
      expect(markSynchronized).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ synced: 2, failed: 0 });
    });

    it('treats 409 as already synchronized (idempotency)', async () => {
      getAllPending.mockResolvedValue([makeIncident('u3')]);
      const err = Object.assign(new Error('Conflict'), { response: { status: 409 } });
      createIncident.mockRejectedValue(err);
      markSynchronized.mockResolvedValue();

      const result = await synchronizeData();

      expect(markSynchronized).toHaveBeenCalledWith('u3');
      expect(result).toEqual({ synced: 1, failed: 0 });
    });

    it('counts network failure as failed without losing other incidents', async () => {
      getAllPending.mockResolvedValue([makeIncident('u4'), makeIncident('u5')]);
      createIncident
        .mockRejectedValueOnce(new Error('Network error'))  // u4 fails
        .mockResolvedValueOnce({ success: true });           // u5 succeeds

      const result = await synchronizeData();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('returns 0 synced when no pending incidents', async () => {
      getAllPending.mockResolvedValue([]);
      const result = await synchronizeData();
      expect(result).toEqual({ synced: 0, failed: 0 });
    });
  });

  describe('retrySynchronization', () => {
    it('calls synchronizeData when online', async () => {
      NetInfo.fetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
      getAllPending.mockResolvedValue([]);

      await retrySynchronization();

      expect(getAllPending).toHaveBeenCalled();
    });

    it('does not call synchronizeData when offline', async () => {
      NetInfo.fetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });

      await retrySynchronization();

      expect(getAllPending).not.toHaveBeenCalled();
    });
  });

  describe('subscribeToConnectivity', () => {
    it('returns an unsubscribe function', () => {
      const unsub = jest.fn();
      NetInfo.addEventListener.mockReturnValue(unsub);

      const result = subscribeToConnectivity();

      expect(typeof result).toBe('function');
      expect(NetInfo.addEventListener).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
