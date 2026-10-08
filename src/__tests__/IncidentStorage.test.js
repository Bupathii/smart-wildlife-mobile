jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveIncident,
  getIncident,
  getAllPending,
  getAllIncidents,
  markSynchronized,
  SyncStatus,
} from '../services/IncidentStorage';

const PENDING = SyncStatus.PENDING_SYNC;
const SYNCED = SyncStatus.SYNCHRONIZED;

const makeIncident = (id, syncStatus = PENDING) => ({
  clientIncidentId: id,
  incidentType: 'POACHING',
  description: 'Test incident',
  syncStatus,
  createdAt: new Date().toISOString(),
});

describe('IncidentStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  describe('saveIncident', () => {
    it('writes incident JSON and appends ID to the list', async () => {
      // getItem called twice: once for incident key, once for __ids__
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'incident:__ids__') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      await saveIncident(makeIncident('uuid-1'));

      const incidentCall = AsyncStorage.setItem.mock.calls.find(
        ([k]) => k === 'incident:uuid-1'
      );
      expect(incidentCall).toBeDefined();
      expect(JSON.parse(incidentCall[1]).clientIncidentId).toBe('uuid-1');
    });

    it('throws when clientIncidentId is missing', async () => {
      await expect(saveIncident({ description: 'no id' })).rejects.toThrow(
        'incident.clientIncidentId is required'
      );
    });
  });

  describe('getIncident', () => {
    it('returns parsed incident when found', async () => {
      const incident = makeIncident('uuid-3');
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'incident:uuid-3') return Promise.resolve(JSON.stringify(incident));
        return Promise.resolve(null);
      });

      const result = await getIncident('uuid-3');
      expect(result.clientIncidentId).toBe('uuid-3');
    });

    it('returns null when not found', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const result = await getIncident('uuid-missing');
      expect(result).toBeNull();
    });
  });

  describe('getAllPending', () => {
    it('returns only incidents with PENDING_SYNC status', async () => {
      const pending = makeIncident('p1', PENDING);
      const synced = makeIncident('s1', SYNCED);

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'incident:__ids__') return Promise.resolve(JSON.stringify(['p1', 's1']));
        if (key === 'incident:p1') return Promise.resolve(JSON.stringify(pending));
        if (key === 'incident:s1') return Promise.resolve(JSON.stringify(synced));
        return Promise.resolve(null);
      });

      const result = await getAllPending();
      expect(result).toHaveLength(1);
      expect(result[0].clientIncidentId).toBe('p1');
    });

    it('returns empty array when no IDs stored', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const result = await getAllPending();
      expect(result).toEqual([]);
    });
  });

  describe('getAllIncidents', () => {
    it('returns all incidents regardless of sync status', async () => {
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'incident:__ids__') return Promise.resolve(JSON.stringify(['a', 'b']));
        if (key === 'incident:a') return Promise.resolve(JSON.stringify(makeIncident('a', PENDING)));
        if (key === 'incident:b') return Promise.resolve(JSON.stringify(makeIncident('b', SYNCED)));
        return Promise.resolve(null);
      });

      const result = await getAllIncidents();
      expect(result).toHaveLength(2);
    });

    it('returns empty array when storage is empty', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const result = await getAllIncidents();
      expect(result).toEqual([]);
    });
  });

  describe('markSynchronized', () => {
    it('updates syncStatus to SYNCHRONIZED', async () => {
      const incident = makeIncident('uuid-5', PENDING);

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'incident:uuid-5') return Promise.resolve(JSON.stringify(incident));
        if (key === 'incident:__ids__') return Promise.resolve(JSON.stringify(['uuid-5']));
        return Promise.resolve(null);
      });

      await markSynchronized('uuid-5');

      const savedCall = AsyncStorage.setItem.mock.calls.find(([k]) => k === 'incident:uuid-5');
      expect(savedCall).toBeDefined();
      const saved = JSON.parse(savedCall[1]);
      expect(saved.syncStatus).toBe(SYNCED);
    });

    it('does nothing when incident not found', async () => {
      AsyncStorage.getItem.mockImplementation((key) => {
        // getIncident('uuid-gone') returns null → markSynchronized returns early
        if (key === 'incident:uuid-gone') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      await expect(markSynchronized('uuid-gone')).resolves.toBeUndefined();
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
