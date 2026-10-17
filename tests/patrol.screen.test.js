/*
 * Ranger "My Patrol" screen (src/app/ranger/patrol.tsx), rendered with
 * react-test-renderer. The patrol service, GPS, keep-awake, router and
 * sign-in are replaced by mocks so the screen's behaviour can be checked
 * without a phone or a server.
 */
import React from 'react';
import { Alert, Switch, Text } from 'react-native';
import { act, create } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ token: 'token-123' }),
}));

jest.mock('expo-router', () => ({
  useFocusEffect: (callback) => {
    const { useEffect } = require('react');
    useEffect(() => callback(), [callback]);
  },
}));

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(() => Promise.resolve()),
  deactivateKeepAwake: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-location', () => ({
  __esModule: true,
  Accuracy: { High: 4 },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('@/services/patrol.service', () => {
  const actual = jest.requireActual('@/services/patrol.service');
  return {
    positionAlongRoute: actual.positionAlongRoute,
    getMyPatrol: jest.fn(),
    startMyPatrol: jest.fn(),
    completeMyPatrol: jest.fn(),
    reportLocation: jest.fn(),
    countPendingLocations: jest.fn(async () => 0),
  };
});

import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as service from '@/services/patrol.service';
import RangerPatrol from '@/app/ranger/patrol';
import { ThemeProvider } from '@/theme/ThemeContext';

/* -------------------------------- fixtures ------------------------------- */

const WAYPOINTS = [
  { number: 1, latitude: 6.47, longitude: 81.415, reached: true },
  { number: 2, latitude: 6.476, longitude: 81.432, reached: false },
];

const patrol = (overrides = {}) => ({
  patrolId: 'PT-009',
  status: 'PLANNED',
  startTime: '2026-05-18T04:30:00.000Z',
  endTime: '2026-05-18T08:30:00.000Z',
  durationMinutes: 0,
  route: {
    routeId: 'RT-004',
    name: 'Menik River Buffer Line',
    description: 'Boundary line along the Menik Ganga buffer.',
    routeLength: 1.97,
  },
  waypoints: WAYPOINTS,
  waypointsReached: 1,
  progressPercentage: 12,
  distanceCoveredKm: 0.5,
  coveragePercentage: 14.3,
  teammates: ['Dilan Fernando'],
  lastUpdate: '2026-05-18T04:30:00.000Z',
  ...overrides,
});

const response = (currentPatrol, extra = {}) => ({
  ranger: { rangerId: 'RN-007', name: 'Dilan Fernando', rank: 'Ranger' },
  patrol: currentPatrol,
  insights: {
    completedPatrols: 0,
    averageCoverage: 0,
    totalDistanceKm: 0,
    averageRating: 0,
    lastEvaluation: null,
  },
  history: [],
  ...extra,
});

const ACTIVE = patrol({ status: 'ACTIVE', durationMinutes: 75 });
const SENT = { result: { accepted: 1 }, waiting: 0, rejected: null };

/* --------------------------------- helpers ------------------------------- */

/** Flattens the children of a <Text> into one string. */
function textOf(node) {
  const children = Array.isArray(node.props.children) ? node.props.children : [node.props.children];
  return children
    .map((child) => {
      if (child === null || child === undefined || typeof child === 'boolean') return '';
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      return child.props ? textOf(child) : '';
    })
    .join('');
}

/** Every piece of text currently on screen. */
const screenText = (renderer) => renderer.root.findAllByType(Text).map(textOf);
const hasText = (renderer, text) => screenText(renderer).some((line) => line.includes(text));

/**
 * The button whose label contains `label`: the outermost element with an
 * onPress handler around that text. (Pressable is wrapped in memo and
 * forwardRef, so it is found by its onPress prop rather than by type.)
 */
function button(renderer, label) {
  return renderer.root.findAll(
    (node) =>
      typeof node.props.onPress === 'function' &&
      node.findAllByType(Text).some((text) => textOf(text).includes(label))
  )[0];
}

/** Lets pending promises and effects finish. */
async function settle() {
  for (let round = 0; round < 5; round += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function renderScreen() {
  let renderer;
  await act(async () => {
    // The screen reads its colours from the app theme, so it is rendered inside the real provider.
    renderer = create(
      <ThemeProvider>
        <RangerPatrol />
      </ThemeProvider>
    );
  });
  await settle();
  return renderer;
}

let mounted = [];

beforeEach(() => {
  jest.clearAllMocks();
  // Replies queued with mockResolvedValueOnce must not leak between tests.
  [
    service.getMyPatrol,
    service.startMyPatrol,
    service.completeMyPatrol,
    service.reportLocation,
  ].forEach((mock) => mock.mockReset());
  mounted = [];
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Location.getCurrentPositionAsync.mockResolvedValue({
    coords: { latitude: 6.4712, longitude: 81.4161 },
    timestamp: Date.UTC(2026, 4, 18, 5, 0),
  });
  service.reportLocation.mockResolvedValue(SENT);
});

afterEach(async () => {
  // Stops the location timer of every screen a test rendered.
  for (const renderer of mounted) {
    await act(async () => renderer.unmount());
  }
});

/** Renders the screen; getMyPatrol answers with each response in turn, then keeps the last. */
async function show(...responses) {
  responses.forEach((value) => service.getMyPatrol.mockResolvedValueOnce(value));
  service.getMyPatrol.mockResolvedValue(responses.at(-1));
  const renderer = await renderScreen();
  mounted.push(renderer);
  return renderer;
}

/* ---------------------------------- tests -------------------------------- */

describe('loading the screen', () => {
  test('shows the reason and a Try again button when loading fails', async () => {
    service.getMyPatrol.mockRejectedValueOnce(new Error('No ranger profile is linked to this account'));
    service.getMyPatrol.mockResolvedValueOnce(response(null));
    const renderer = await renderScreen();
    mounted.push(renderer);

    expect(hasText(renderer, 'No ranger profile is linked to this account')).toBe(true);
    await act(async () => button(renderer, 'Try again').props.onPress());
    await settle();

    expect(service.getMyPatrol).toHaveBeenCalledTimes(2);
    expect(service.getMyPatrol).toHaveBeenCalledWith('token-123');
    expect(hasText(renderer, 'No patrol assigned')).toBe(true);
  });

  test('a ranger with nothing assigned is told so and sees zeroed insights', async () => {
    const renderer = await show(response(null));

    expect(hasText(renderer, 'No patrol assigned')).toBe(true);
    expect(hasText(renderer, 'Dilan Fernando, you have no patrol at the moment')).toBe(true);
    expect(screenText(renderer)).toEqual(expect.arrayContaining(['My patrol insights', '0', '0%', '0 km', '—']));
    expect(button(renderer, 'Start patrol')).toBeUndefined();
    expect(service.reportLocation).not.toHaveBeenCalled();
  });
});

describe('a planned patrol', () => {
  test('shows the route, progress, waypoint checklist and a Start button', async () => {
    const renderer = await show(response(patrol()));

    expect(screenText(renderer)).toEqual(
      expect.arrayContaining([
        'PT-009',
        'Planned',
        'Menik River Buffer Line',
        '12%',
        '0.5 / 1.97 km',
        '1 / 2',
        'Waypoints (1/2)',
        'Reached',
        'Pending',
        'Start patrol',
      ])
    );
    expect(hasText(renderer, 'Team: Dilan Fernando')).toBe(true);
    expect(service.reportLocation).not.toHaveBeenCalled();
    expect(activateKeepAwakeAsync).not.toHaveBeenCalled();
  });

  test('Start patrol starts it and the phone begins sending its GPS position', async () => {
    service.startMyPatrol.mockResolvedValueOnce(response(ACTIVE));
    const renderer = await show(response(patrol()), response(ACTIVE));

    await act(async () => button(renderer, 'Start patrol').props.onPress());
    await settle();

    expect(service.startMyPatrol).toHaveBeenCalledWith('token-123');
    expect(activateKeepAwakeAsync).toHaveBeenCalledWith('ranger-patrol');
    expect(service.reportLocation).toHaveBeenCalledWith('token-123', 'PT-009', {
      latitude: 6.4712,
      longitude: 81.4161,
      timestamp: new Date(Date.UTC(2026, 4, 18, 5, 0)).toISOString(),
    });
    expect(hasText(renderer, 'Sending location')).toBe(true);
    expect(hasText(renderer, 'Keep this screen open while you are on patrol.')).toBe(true);
    expect(button(renderer, 'End patrol')).toBeDefined();
  });

  test('a failed start is reported in an alert', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    service.startMyPatrol.mockRejectedValueOnce(new Error('Patrol PT-009 has already been started'));
    const renderer = await show(response(patrol()));

    await act(async () => button(renderer, 'Start patrol').props.onPress());
    await settle();

    expect(alert).toHaveBeenCalledWith('Patrol', 'Patrol PT-009 has already been started');
    expect(hasText(renderer, 'Planned')).toBe(true);
    alert.mockRestore();
  });
});

describe('an active patrol', () => {
  test('without location permission the ranger is told what to do', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const renderer = await show(response(ACTIVE));

    expect(service.reportLocation).not.toHaveBeenCalled();
    expect(hasText(renderer, 'Location is not available. Allow location access or turn on Demo walk.')).toBe(true);
  });

  test('a GPS failure is handled the same way', async () => {
    Location.getCurrentPositionAsync.mockRejectedValue(new Error('Location services are off'));
    const renderer = await show(response(ACTIVE));

    expect(service.reportLocation).not.toHaveBeenCalled();
    expect(hasText(renderer, 'Location is not available')).toBe(true);
  });

  test('without a connection it says the positions are saved on the phone', async () => {
    service.reportLocation.mockResolvedValue({ result: null, waiting: 3, rejected: null });
    const renderer = await show(response(ACTIVE));

    expect(hasText(renderer, 'No connection – locations are saved on this phone')).toBe(true);
    expect(hasText(renderer, '3 waiting to send')).toBe(true);
  });

  test('a refusal from the server is shown', async () => {
    service.reportLocation.mockResolvedValue({
      result: null,
      waiting: 0,
      rejected: 'Start the patrol before sending locations',
    });
    const renderer = await show(response(ACTIVE));

    expect(hasText(renderer, 'Start the patrol before sending locations')).toBe(true);
  });

  test('Demo walk sends positions along the route instead of the phone GPS', async () => {
    const renderer = await show(response(ACTIVE), response(ACTIVE), response(ACTIVE));
    Location.getCurrentPositionAsync.mockClear();

    await act(async () => renderer.root.findByType(Switch).props.onValueChange(true));
    await settle();

    const demoPoint = service.reportLocation.mock.calls.at(-1)[2];
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(demoPoint.latitude).toBeGreaterThan(WAYPOINTS[0].latitude);
    expect(demoPoint.latitude).toBeLessThan(WAYPOINTS[1].latitude);
    expect(demoPoint.longitude).toBeGreaterThan(WAYPOINTS[0].longitude);
  });

  test('End patrol asks for confirmation, then completes it and shows the history', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const finished = response(null, {
      insights: {
        completedPatrols: 1,
        averageCoverage: 100,
        totalDistanceKm: 1.97,
        averageRating: 5,
        lastEvaluation: { patrolId: 'PT-009', rating: 5, notes: 'Full route covered.' },
      },
      history: [
        {
          patrolId: 'PT-009',
          endTime: '2026-05-18T06:00:00.000Z',
          durationMinutes: 90,
          route: { routeId: 'RT-004', name: 'Menik River Buffer Line', routeLength: 1.97 },
          coveragePercentage: 100,
          distanceCoveredKm: 1.97,
          evaluation: { rating: 5, notes: 'Full route covered.' },
        },
      ],
    });
    service.completeMyPatrol.mockResolvedValueOnce(finished);
    const renderer = await show(response(ACTIVE), response(ACTIVE));

    await act(async () => button(renderer, 'End patrol').props.onPress());
    const [title, question, choices] = alert.mock.calls[0];
    await act(async () => choices[1].onPress());
    await settle();

    expect([title, question]).toEqual(['End patrol', 'Mark this patrol as completed?']);
    expect(choices[0]).toEqual({ text: 'Cancel', style: 'cancel' });
    expect(service.completeMyPatrol).toHaveBeenCalledWith('token-123');
    expect(hasText(renderer, 'No patrol assigned')).toBe(true);
    expect(hasText(renderer, 'Recent patrols')).toBe(true);
    expect(hasText(renderer, 'PT-009 · Menik River Buffer Line')).toBe(true);
    expect(hasText(renderer, 'Latest evaluation · PT-009 · ★★★★★')).toBe(true);
    expect(hasText(renderer, 'Full route covered.')).toBe(true);
    expect(screenText(renderer)).toEqual(expect.arrayContaining(['1', '100%', '1.97 km', '5 / 5']));
    expect(hasText(renderer, '1h 30m')).toBe(true);
    expect(deactivateKeepAwake).toHaveBeenCalledWith('ranger-patrol');
    alert.mockRestore();
  });

  test('leaving the screen stops tracking and lets the phone sleep', async () => {
    service.getMyPatrol.mockResolvedValue(response(ACTIVE));
    const renderer = await renderScreen();

    await act(async () => renderer.unmount());

    expect(activateKeepAwakeAsync).toHaveBeenCalledTimes(1);
    expect(deactivateKeepAwake).toHaveBeenCalledWith('ranger-patrol');
  });
});
