// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockStorage = new Map();

const mockGetItem = jest.fn(
  async (key) =>
    mockStorage.has(key) ? mockStorage.get(key) : null
);

const mockSetItem = jest.fn(async (key, value) => {
  mockStorage.set(key, value);
});

const mockRemoveItem = jest.fn(async (key) => {
  mockStorage.delete(key);
});

jest.mock(
  '@react-native-async-storage/async-storage',
  () => ({
    __esModule: true,
    default: {
      getItem: (...args) => mockGetItem(...args),
      setItem: (...args) => mockSetItem(...args),
      removeItem: (...args) => mockRemoveItem(...args),
    },
  })
);

const mockSubmitIncident = jest.fn();

jest.mock(
  '@/services/incident.service',
  () => ({
    submitIncidentReport: (...args) =>
      mockSubmitIncident(...args),
    fetchMyIncidents: jest.fn(),
  })
);

jest.mock(
  '@react-native-community/netinfo',
  () => ({
    __esModule: true,
    default: {
      fetch: jest.fn().mockResolvedValue({
        isConnected: true,
      }),
    },
  })
);

// ─── Module imports (after mocks) ─────────────────────────────────────────────

const {
  saveIncident,
  getAllIncidents,
  updateIncidentStatus,
} = require('@/services/incident.storage');

const {
  syncPendingIncidents,
} = require('@/services/incident.sync');

const NetInfo = require('@react-native-community/netinfo').default;

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeIncident(overrides = {}) {
  return {
    clientIncidentId: 'inc_test_001',
    incidentType: 'Poaching',
    description: 'Suspected poachers spotted near sector 4.',
    severity: 'HIGH',
    location: {
      latitude: 6.12345,
      longitude: 80.12345,
      source: 'GPS',
      timestamp: '2026-10-08T10:00:00.000Z',
    },
    evidenceUris: [],
    createdAt: '2026-10-08T10:00:00.000Z',
    syncStatus: 'Pending',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe(
  'incident.sync — syncPendingIncidents',
  () => {
    beforeEach(() => {
      mockStorage.clear();
      mockGetItem.mockClear();
      mockSetItem.mockClear();
      mockRemoveItem.mockClear();
      mockSubmitIncident.mockReset();
      NetInfo.fetch.mockResolvedValue({ isConnected: true });
    });

    test(
      'returns zeros when no pending reports exist',
      async () => {
        const result = await syncPendingIncidents('tok');

        expect(result).toEqual({
          synced: 0,
          remaining: 0,
          failed: 0,
          skipped: 0,
        });
      }
    );

    test(
      'returns remaining count and skips fetch when offline',
      async () => {
        await saveIncident(makeIncident());

        NetInfo.fetch.mockResolvedValue({ isConnected: false });

        const result = await syncPendingIncidents('tok');

        expect(result).toEqual({
          synced: 0,
          remaining: 1,
          failed: 0,
          skipped: 0,
        });

        expect(mockSubmitIncident).not.toHaveBeenCalled();
      }
    );

    test(
      'syncs a pending report and marks it Synchronized',
      async () => {
        await saveIncident(makeIncident());

        mockSubmitIncident.mockResolvedValue({
          success: true,
          data: { _id: 'srv-111' },
        });

        const result = await syncPendingIncidents('tok');

        expect(result.synced).toBe(1);
        expect(result.remaining).toBe(0);

        const all = await getAllIncidents();
        expect(all[0].syncStatus).toBe('Synchronized');
        expect(all[0].serverId).toBe('srv-111');
      }
    );

    test(
      'keeps report Pending when submit throws generic error',
      async () => {
        await saveIncident(makeIncident());

        mockSubmitIncident.mockRejectedValue(
          new Error('Network error')
        );

        const result = await syncPendingIncidents('tok');

        expect(result.synced).toBe(0);
        expect(result.remaining).toBe(1);

        const all = await getAllIncidents();
        expect(all[0].syncStatus).toBe('Pending');
      }
    );

    test(
      'marks Synchronized on 409 alreadySynchronized error',
      async () => {
        await saveIncident(makeIncident());

        // expo/fetch errors use err.status + err.data (not axios err.response.*)
        const err = Object.assign(
          new Error('Conflict'),
          {
            status: 409,
            data: { alreadySynchronized: true },
          }
        );

        mockSubmitIncident.mockRejectedValue(err);

        const result = await syncPendingIncidents('tok');

        expect(result.synced).toBe(1);
        expect(result.remaining).toBe(0);

        const all = await getAllIncidents();
        expect(all[0].syncStatus).toBe('Synchronized');
      }
    );

    test(
      'syncs multiple pending reports independently',
      async () => {
        await saveIncident(makeIncident({ clientIncidentId: 'inc_a' }));
        await saveIncident(makeIncident({ clientIncidentId: 'inc_b' }));

        mockSubmitIncident
          .mockResolvedValueOnce({
            success: true,
            data: { _id: 'srv-a' },
          })
          .mockRejectedValueOnce(new Error('fail'));

        const result = await syncPendingIncidents('tok');

        expect(result.synced).toBe(1);
        expect(result.remaining).toBe(1);

        const all = await getAllIncidents();
        const incA = all.find((r) => r.clientIncidentId === 'inc_a');
        const incB = all.find((r) => r.clientIncidentId === 'inc_b');
        expect(incB.syncStatus).toBe('Synchronized');
        expect(incA.syncStatus).toBe('Pending');
      }
    );

    test(
      'passes token and correct payload to submitIncidentReport',
      async () => {
        await saveIncident(makeIncident());

        mockSubmitIncident.mockResolvedValue({
          success: true,
          data: { _id: 'srv-tok' },
        });

        await syncPendingIncidents('my-secret-token');

        expect(mockSubmitIncident).toHaveBeenCalledWith(
          expect.objectContaining({
            clientIncidentId: 'inc_test_001',
            incidentType: 'Poaching',
            latitude: 6.12345,
            longitude: 80.12345,
          }),
          'my-secret-token'
        );
      }
    );

    test(
      'only syncs Pending reports, ignores Synchronized ones',
      async () => {
        await saveIncident(
          makeIncident({
            clientIncidentId: 'done',
            syncStatus: 'Synchronized',
          })
        );
        await saveIncident(
          makeIncident({ clientIncidentId: 'todo' })
        );

        mockSubmitIncident.mockResolvedValue({
          success: true,
          data: { _id: 'srv-x' },
        });

        const result = await syncPendingIncidents('tok');

        expect(mockSubmitIncident).toHaveBeenCalledTimes(1);
        expect(result.synced).toBe(1);
      }
    );

    test(
      'keeps report Pending on non-409 error with response',
      async () => {
        await saveIncident(makeIncident());

        const err = Object.assign(
          new Error('Server error'),
          {
            response: {
              status: 500,
              data: { message: 'Internal server error' },
            },
          }
        );

        mockSubmitIncident.mockRejectedValue(err);

        const result = await syncPendingIncidents('tok');

        expect(result.remaining).toBe(1);

        const all = await getAllIncidents();
        expect(all[0].syncStatus).toBe('Pending');
      }
    );
  }
);
