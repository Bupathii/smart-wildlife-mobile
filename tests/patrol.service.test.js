/*
 * Ranger "My Patrol" service (src/services/patrol.service.ts): API calls,
 * the offline location queue and the demo-walk position helper.
 * AsyncStorage and fetch are replaced by in-memory fakes.
 */

const mockStorage = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key) => (mockStorage.has(key) ? mockStorage.get(key) : null)),
    setItem: jest.fn(async (key, value) => {
      mockStorage.set(key, value);
    }),
    removeItem: jest.fn(async (key) => {
      mockStorage.delete(key);
    }),
  },
}));

import { API_BASE_URL } from '@/services/api';
import {
  PatrolApiError,
  completeMyPatrol,
  countPendingLocations,
  getMyPatrol,
  positionAlongRoute,
  reportLocation,
  startMyPatrol,
} from '@/services/patrol.service';

const QUEUE_KEY = 'pending_patrol_locations_v1';
const TOKEN = 'token-123';

/** A fetch Response stand-in. */
function reply(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: body === undefined ? async () => Promise.reject(new Error('not JSON')) : async () => body,
  };
}

const point = (minutesAgo, latitude = 6.47) => ({
  latitude,
  longitude: 81.42,
  timestamp: new Date(Date.UTC(2026, 4, 18, 10, 0) - minutesAgo * 60_000).toISOString(),
});

const sentPoints = (callIndex) => JSON.parse(global.fetch.mock.calls[callIndex][1].body).points;
const storedQueue = () => (mockStorage.has(QUEUE_KEY) ? JSON.parse(mockStorage.get(QUEUE_KEY)) : null);

beforeEach(() => {
  mockStorage.clear();
  global.fetch = jest.fn();
});

/* ------------------------------- API calls ------------------------------- */

describe('patrol API calls', () => {
  test('My Patrol is loaded with the ranger token', async () => {
    const body = { ranger: { name: 'Dilan Fernando' }, patrol: null };
    global.fetch.mockResolvedValueOnce(reply(200, body));

    await expect(getMyPatrol(TOKEN)).resolves.toEqual(body);
    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/patrols/mine`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: undefined,
    });
  });

  test('start and end are POST requests to their own addresses', async () => {
    global.fetch.mockResolvedValue(reply(200, { patrol: { status: 'ACTIVE' } }));

    await startMyPatrol(TOKEN);
    await completeMyPatrol(TOKEN);

    expect(global.fetch.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      [`${API_BASE_URL}/patrols/mine/start`, 'POST'],
      [`${API_BASE_URL}/patrols/mine/complete`, 'POST'],
    ]);
  });

  test('the server message is shown when a request is refused', async () => {
    global.fetch.mockResolvedValueOnce(
      reply(404, { error: { code: 'NOT_FOUND', message: 'No patrol is assigned to you at the moment' } })
    );

    const error = await startMyPatrol(TOKEN).catch((problem) => problem);

    expect(error).toBeInstanceOf(PatrolApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('No patrol is assigned to you at the moment');
  });

  test('other error shapes still give a readable message', async () => {
    global.fetch
      .mockResolvedValueOnce(reply(401, { message: 'Invalid or expired token' }))
      .mockResolvedValueOnce(reply(502, undefined));

    await expect(getMyPatrol(TOKEN)).rejects.toThrow('Invalid or expired token');
    await expect(getMyPatrol(TOKEN)).rejects.toThrow('The request could not be completed');
  });
});

/* --------------------------- Offline location queue --------------------- */

describe('reporting locations', () => {
  test('a position is sent at once and nothing is left waiting', async () => {
    const result = { accepted: 1, patrolId: 'PT-009', progressPercentage: 12, distanceCoveredKm: 1.2 };
    global.fetch.mockResolvedValueOnce(reply(200, result));

    const outcome = await reportLocation(TOKEN, 'PT-009', point(0));

    expect(outcome).toEqual({ result, waiting: 0, rejected: null });
    expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE_URL}/patrols/mine/locations`);
    expect(sentPoints(0)).toEqual([point(0)]);
    expect(storedQueue()).toBeNull();
    await expect(countPendingLocations('PT-009')).resolves.toBe(0);
  });

  test('without a connection positions are kept and sent together later', async () => {
    global.fetch
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(reply(200, { accepted: 3 }));

    const first = await reportLocation(TOKEN, 'PT-009', point(2));
    const second = await reportLocation(TOKEN, 'PT-009', point(1));
    await expect(countPendingLocations('PT-009')).resolves.toBe(2);
    const third = await reportLocation(TOKEN, 'PT-009', point(0));

    expect(first).toEqual({ result: null, waiting: 1, rejected: null });
    expect(second.waiting).toBe(2);
    expect(third).toEqual({ result: { accepted: 3 }, waiting: 0, rejected: null });
    expect(sentPoints(2)).toEqual([point(2), point(1), point(0)]);
    expect(storedQueue()).toBeNull();
  });

  test('a temporary server fault keeps the positions for the next try', async () => {
    global.fetch.mockResolvedValueOnce(reply(500, { error: { message: 'Something went wrong' } }));

    const outcome = await reportLocation(TOKEN, 'PT-009', point(0));

    expect(outcome).toEqual({ result: null, waiting: 1, rejected: null });
    expect(storedQueue().points).toEqual([point(0)]);
  });

  test.each([400, 404, 409])('positions refused with %i are dropped so the queue cannot get stuck', async (status) => {
    global.fetch.mockResolvedValueOnce(
      reply(status, { error: { message: 'Start the patrol before sending locations' } })
    );

    const outcome = await reportLocation(TOKEN, 'PT-009', point(0));

    expect(outcome).toEqual({
      result: null,
      waiting: 0,
      rejected: 'Start the patrol before sending locations',
    });
    expect(storedQueue()).toBeNull();
  });

  test('positions left over from a different patrol are discarded', async () => {
    mockStorage.set(QUEUE_KEY, JSON.stringify({ patrolId: 'PT-005', points: [point(30)] }));
    global.fetch.mockResolvedValueOnce(reply(200, { accepted: 1 }));

    await expect(countPendingLocations('PT-009')).resolves.toBe(0);
    await expect(countPendingLocations('PT-005')).resolves.toBe(1);
    await reportLocation(TOKEN, 'PT-009', point(0));

    expect(sentPoints(0)).toEqual([point(0)]);
  });

  test('at most 200 positions are sent at a time; the rest wait for the next report', async () => {
    const backlog = Array.from({ length: 250 }, (_, index) => point(300 - index));
    mockStorage.set(QUEUE_KEY, JSON.stringify({ patrolId: 'PT-009', points: backlog }));
    global.fetch.mockResolvedValueOnce(reply(200, { accepted: 200 }));

    const outcome = await reportLocation(TOKEN, 'PT-009', point(0));

    expect(sentPoints(0)).toHaveLength(200);
    expect(sentPoints(0)[0]).toEqual(backlog[0]);
    expect(outcome.waiting).toBe(51);
    expect(storedQueue().points[0]).toEqual(backlog[200]);
  });

  test('a damaged stored queue is treated as empty', async () => {
    mockStorage.set(QUEUE_KEY, '{not json');
    global.fetch.mockResolvedValueOnce(reply(200, { accepted: 1 }));

    await expect(countPendingLocations('PT-009')).resolves.toBe(0);
    await reportLocation(TOKEN, 'PT-009', point(0));

    expect(sentPoints(0)).toEqual([point(0)]);
  });
});

/* -------------------------------- Demo walk ------------------------------ */

describe('demo walk positions along the route', () => {
  // Two segments of 1 degree of latitude each (about 111.19 km).
  const route = [
    { latitude: 6, longitude: 81 },
    { latitude: 7, longitude: 81 },
    { latitude: 8, longitude: 81 },
  ];
  const ONE_DEGREE_KM = 111.19;

  test('starts at the first waypoint and stays there for negative distances', () => {
    expect(positionAlongRoute(route, 0)).toEqual(route[0]);
    expect(positionAlongRoute(route, -5)).toEqual(route[0]);
  });

  test('walks along the segments in order', () => {
    expect(positionAlongRoute(route, ONE_DEGREE_KM / 2).latitude).toBeCloseTo(6.5, 3);
    expect(positionAlongRoute(route, ONE_DEGREE_KM * 1.5).latitude).toBeCloseTo(7.5, 3);
    expect(positionAlongRoute(route, ONE_DEGREE_KM * 1.5).longitude).toBeCloseTo(81, 6);
  });

  test('stops at the last waypoint at or beyond the end of the route', () => {
    expect(positionAlongRoute(route, 1000)).toEqual(route[2]);
  });

  test('a repeated waypoint (zero-length segment) is skipped', () => {
    const withRepeat = [route[0], route[0], route[1]];

    expect(positionAlongRoute(withRepeat, ONE_DEGREE_KM / 4).latitude).toBeCloseTo(6.25, 3);
  });
});
