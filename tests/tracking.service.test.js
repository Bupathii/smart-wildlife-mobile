const mockFetch = jest.fn();

global.fetch = (...args) => mockFetch(...args);

jest.mock('@/services/api', () => ({
  API_BASE_URL: 'http://test.local/api',
}));

const {
  activateCollarTracking,
  getAnimalTrackingSession,
  getCollarTrackingSession,
  getRangerAlerts,
  getTrackedAnimals,
  sendAnimalLocation,
  startRemoteTracking,
  stopRemoteTracking,
} = require('@/services/tracking.service');

function makeResponse({ ok = true, status = 200, data = {} } = {}) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
  };
}

describe('tracking service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test('sends an animal location and returns a generated high-risk alert', async () => {
    const response = {
      success: true,
      message: 'High-risk alert generated',
      alertGenerated: true,
      alertId: 'ALT001',
      priority: 'HIGH',
    };
    mockFetch.mockResolvedValue(makeResponse({ data: response }));

    await expect(sendAnimalLocation('token-1', {
      animalId: 'ELE001',
      latitude: 7.8731,
      longitude: 80.7718,
      timestamp: '2026-10-17T10:00:00.000Z',
    })).resolves.toEqual(response);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://test.local/api/tracking/location',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"animalId":"ELE001"'),
      })
    );
  });

  test('loads ranger alerts', async () => {
    const alerts = [{ alertId: 'ALT001', priority: 'HIGH' }];
    mockFetch.mockResolvedValue(makeResponse({ data: { alerts } }));

    await expect(getRangerAlerts('token-1')).resolves.toEqual(alerts);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://test.local/api/tracking/alerts',
      expect.objectContaining({ method: 'GET' })
    );
  });

  test('loads the collar tracking session', async () => {
    const session = { animalId: 'ELE001', status: 'ACTIVE' };
    mockFetch.mockResolvedValue(makeResponse({ data: { session } }));

    await expect(getCollarTrackingSession('token-1')).resolves.toEqual(session);
  });

  test('encodes animal IDs when starting tracking', async () => {
    mockFetch.mockResolvedValue(makeResponse());

    await startRemoteTracking('token-1', 'ELE 001');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://test.local/api/tracking/animals/ELE%20001/tracking/start',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test.each([
    ['stops tracking', stopRemoteTracking, '/tracking/stop'],
    ['activates tracking', activateCollarTracking, '/tracking/activate'],
  ])('%s', async (_name, operation, path) => {
    mockFetch.mockResolvedValue(makeResponse());

    await operation('token-1', 'ELE001');

    expect(mockFetch).toHaveBeenCalledWith(
      `http://test.local/api/tracking/animals/ELE001${path}`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('loads tracked animals', async () => {
    const animals = [{ animalId: 'ELE001', name: 'Elephant 001', species: 'Elephant' }];
    mockFetch.mockResolvedValue(makeResponse({ data: { animals } }));

    await expect(getTrackedAnimals('token-1')).resolves.toEqual(animals);
  });

  test('throws the server message when sending a location fails', async () => {
    mockFetch.mockResolvedValue(makeResponse({
      ok: false,
      status: 422,
      data: { message: 'Invalid GPS coordinates' },
    }));

    await expect(sendAnimalLocation('token-1', {
      animalId: 'ELE001',
      latitude: 91,
      longitude: 80,
      timestamp: '2026-10-17T10:00:00.000Z',
    })).rejects.toThrow('Invalid GPS coordinates');
  });
});
