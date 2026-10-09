// ─── Fetch mock (same pattern as conflict.service.test.js) ────────────────────

const mockFetch = jest.fn();

jest.mock(
  'expo/fetch',
  () => ({
    fetch: (...args) => mockFetch(...args),
  })
);

jest.mock(
  '@/services/api',
  () => ({
    API_BASE_URL: 'http://test.local/api',
  })
);

// ─── AsyncStorage mock ────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

class MockFormData {
  constructor() {
    this.items = [];
  }

  append(key, value) {
    this.items.push([key, value]);
  }

  get(key) {
    return this.items.find(([k]) => k === key)?.[1];
  }

  getAll(key) {
    return this.items
      .filter(([k]) => k === key)
      .map(([, v]) => v);
  }
}

function makeResponse({
  ok = true,
  status = 200,
  data = {},
  jsonError,
} = {}) {
  return {
    ok,
    status,
    json: jest.fn().mockImplementation(async () => {
      if (jsonError) throw jsonError;
      return data;
    }),
  };
}

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

// ─── Module imports (after mocks) ─────────────────────────────────────────────

const {
  submitIncidentReport,
  fetchMyIncidents,
} = require('@/services/incident.service');

const {
  getAllIncidents,
  saveIncident,
  updateIncidentStatus,
  getPendingIncidents,
  clearAllIncidents,
} = require('@/services/incident.storage');

// ─── incident.service — submitIncidentReport ──────────────────────────────────

describe(
  'incident.service — submitIncidentReport',
  () => {
    beforeEach(() => {
      mockFetch.mockReset();
      global.FormData = MockFormData;
    });

    test(
      'sends POST to /incidents with correct auth header',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({ data: { data: { _id: 'srv-001' } } })
        );

        const result = await submitIncidentReport(
          {
            clientIncidentId: 'inc_001',
            incidentType: 'Poaching',
            description: 'Test',
            severity: 'HIGH',
            locationSource: 'GPS',
            latitude: 6.123,
            longitude: 80.456,
          },
          'token-abc'
        );

        expect(result.success).toBe(true);
        expect(result.data._id).toBe('srv-001');

        const [url, options] = mockFetch.mock.calls[0];

        expect(url).toBe('http://test.local/api/incidents');
        expect(options.method).toBe('POST');
        expect(options.headers.Authorization).toBe('Bearer token-abc');
      }
    );

    test(
      'appends all required FormData fields',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({ data: { data: { _id: 'srv-002' } } })
        );

        await submitIncidentReport(
          {
            clientIncidentId: 'inc_002',
            incidentType: 'Illegal Camp',
            description: 'Camp found',
            severity: 'MEDIUM',
            locationSource: 'MANUAL',
            latitude: 7.0,
            longitude: 81.0,
            locationTimestamp: '2026-10-08T10:00:00.000Z',
          },
          'tok'
        );

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);

        expect(body.clientIncidentId).toBe('inc_002');
        expect(body.incidentType).toBe('Illegal Camp');
        expect(body.description).toBe('Camp found');
        expect(body.severity).toBe('MEDIUM');
        expect(body.locationSource).toBe('MANUAL');
        expect(body.latitude).toBe(7.0);
        expect(body.longitude).toBe(81.0);
        expect(body.locationTimestamp).toBe('2026-10-08T10:00:00.000Z');
      }
    );

    test(
      'does not append locationTimestamp when omitted',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({ data: { data: { _id: 'srv-003' } } })
        );

        await submitIncidentReport(
          {
            clientIncidentId: 'inc_003',
            incidentType: 'Other',
            description: 'desc',
            severity: 'LOW',
            locationSource: 'GPS',
            latitude: 6.0,
            longitude: 80.0,
          },
          'tok'
        );

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        // locationTimestamp omitted from payload — should be undefined in JSON
        expect(body.locationTimestamp).toBeUndefined();
      }
    );

    test(
      'returns alreadySynchronized flag on 409',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({
            ok: false,
            status: 409,
            data: { alreadySynchronized: true },
          })
        );

        const result = await submitIncidentReport(
          {
            clientIncidentId: 'dup',
            incidentType: 'Poaching',
            description: 'dup',
            severity: 'LOW',
            locationSource: 'GPS',
            latitude: 6.0,
            longitude: 80.0,
          },
          'tok'
        );

        expect(result.success).toBe(false);
        expect(result.alreadySynchronized).toBe(true);
      }
    );

    test(
      'throws on non-409 server error',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({ ok: false, status: 500, data: { message: 'Server error' } })
        );

        await expect(
          submitIncidentReport(
            {
              clientIncidentId: 'err',
              incidentType: 'Poaching',
              description: 'e',
              severity: 'LOW',
              locationSource: 'GPS',
              latitude: 6.0,
              longitude: 80.0,
            },
            'tok'
          )
        ).rejects.toThrow('Server error');
      }
    );

    test(
      'throws when fetch rejects (network failure)',
      async () => {
        mockFetch.mockRejectedValue(new Error('Network unavailable'));

        await expect(
          submitIncidentReport(
            {
              clientIncidentId: 'net',
              incidentType: 'Poaching',
              description: 'e',
              severity: 'LOW',
              locationSource: 'GPS',
              latitude: 6.0,
              longitude: 80.0,
            },
            'tok'
          )
        ).rejects.toThrow('Network unavailable');
      }
    );
  }
);

// ─── incident.service — fetchMyIncidents ──────────────────────────────────────

describe(
  'incident.service — fetchMyIncidents',
  () => {
    beforeEach(() => {
      mockFetch.mockReset();
    });

    test(
      'calls GET /incidents/my with bearer token',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({ data: { data: [], total: 0 } })
        );

        const result = await fetchMyIncidents('tok-xyz');

        const [url, options] = mockFetch.mock.calls[0];

        expect(url).toContain('/incidents/my');
        expect(options.headers.Authorization).toBe('Bearer tok-xyz');
        expect(result.reports).toEqual([]);
        expect(result.total).toBe(0);
      }
    );

    test(
      'passes page and limit as query params',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({ data: { data: [], total: 0 } })
        );

        await fetchMyIncidents('tok', 3, 10);

        const [url] = mockFetch.mock.calls[0];

        expect(url).toContain('page=3');
        expect(url).toContain('limit=10');
      }
    );

    test(
      'returns reports from response data array',
      async () => {
        const reports = [
          makeIncident({ syncStatus: 'Synchronized' }),
          makeIncident({ clientIncidentId: 'inc_002', incidentType: 'Illegal Camp' }),
        ];

        mockFetch.mockResolvedValue(
          makeResponse({ data: { data: reports, total: 2 } })
        );

        const result = await fetchMyIncidents('tok');

        expect(result.reports).toHaveLength(2);
        expect(result.total).toBe(2);
      }
    );

    test(
      'throws on non-ok response',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({ ok: false, status: 401, data: {} })
        );

        await expect(fetchMyIncidents('bad-tok')).rejects.toThrow();
      }
    );
  }
);

// ─── incident.storage ─────────────────────────────────────────────────────────

describe(
  'incident.storage',
  () => {
    beforeEach(() => {
      mockStorage.clear();
      mockGetItem.mockClear();
      mockSetItem.mockClear();
      mockRemoveItem.mockClear();
    });

    test(
      'getAllIncidents returns empty array when nothing stored',
      async () => {
        const all = await getAllIncidents();
        expect(all).toEqual([]);
      }
    );

    test(
      'saveIncident stores a report and getAllIncidents returns it',
      async () => {
        const report = makeIncident();
        await saveIncident(report);

        const all = await getAllIncidents();

        expect(all).toHaveLength(1);
        expect(all[0].clientIncidentId).toBe('inc_test_001');
        expect(all[0].incidentType).toBe('Poaching');
      }
    );

    test(
      'saveIncident updates existing report with same clientIncidentId',
      async () => {
        const report = makeIncident();
        await saveIncident(report);

        const updated = { ...report, description: 'Updated desc' };
        await saveIncident(updated);

        const all = await getAllIncidents();

        expect(all).toHaveLength(1);
        expect(all[0].description).toBe('Updated desc');
      }
    );

    test(
      'saveIncident prepends new reports (most recent first)',
      async () => {
        await saveIncident(makeIncident({ clientIncidentId: 'first' }));
        await saveIncident(makeIncident({ clientIncidentId: 'second' }));

        const all = await getAllIncidents();

        expect(all[0].clientIncidentId).toBe('second');
        expect(all[1].clientIncidentId).toBe('first');
      }
    );

    test(
      'updateIncidentStatus sets Synchronized and stores serverId',
      async () => {
        await saveIncident(makeIncident());
        await updateIncidentStatus('inc_test_001', 'Synchronized', 'srv-abc');

        const all = await getAllIncidents();

        expect(all[0].syncStatus).toBe('Synchronized');
        expect(all[0].serverId).toBe('srv-abc');
      }
    );

    test(
      'updateIncidentStatus sets Failed',
      async () => {
        await saveIncident(makeIncident());
        await updateIncidentStatus('inc_test_001', 'Failed');

        const all = await getAllIncidents();
        expect(all[0].syncStatus).toBe('Failed');
      }
    );

    test(
      'updateIncidentStatus does nothing for unknown id',
      async () => {
        await saveIncident(makeIncident());
        await updateIncidentStatus('nonexistent-id', 'Synchronized');

        const all = await getAllIncidents();
        expect(all[0].syncStatus).toBe('Pending');
      }
    );

    test(
      'getPendingIncidents returns only Pending reports',
      async () => {
        await saveIncident(makeIncident({ clientIncidentId: 'p1' }));
        await saveIncident(makeIncident({ clientIncidentId: 'p2' }));
        await saveIncident(
          makeIncident({ clientIncidentId: 's1', syncStatus: 'Synchronized' })
        );

        const pending = await getPendingIncidents();

        expect(pending).toHaveLength(2);
        expect(pending.every((r) => r.syncStatus === 'Pending')).toBe(true);
      }
    );

    test(
      'getPendingIncidents returns empty when all Synchronized',
      async () => {
        await saveIncident(makeIncident({ syncStatus: 'Synchronized' }));

        const pending = await getPendingIncidents();
        expect(pending).toEqual([]);
      }
    );

    test(
      'clearAllIncidents removes all stored data',
      async () => {
        await saveIncident(makeIncident());
        await clearAllIncidents();

        const all = await getAllIncidents();
        expect(all).toEqual([]);
      }
    );
  }
);
