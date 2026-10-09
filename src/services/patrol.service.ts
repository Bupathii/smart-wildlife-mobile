import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE_URL } from "@/services/api";
import {
  LocationReport,
  LocationReportResult,
  MyPatrolResponse,
  PatrolWaypoint,
} from "@/types/patrol";

/*
 * Everything the ranger's "My Patrol" screen needs from the server, plus
 * the small offline queue that keeps positions safe while there is no
 * connection.
 */

const QUEUE_KEY = "pending_patrol_locations_v1";
const MAX_POINTS_PER_REQUEST = 200;
const EARTH_RADIUS_KM = 6371;
/** Answers that mean "these positions are wrong", not "try again later". */
const REFUSED_STATUSES = [400, 404, 409];

export class PatrolApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PatrolApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  token: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new PatrolApiError(
      data?.error?.message || data?.message || "The request could not be completed",
      response.status
    );
  }
  return data as T;
}

/** The ranger's assigned patrol, insights and recent history. */
export function getMyPatrol(token: string) {
  return request<MyPatrolResponse>("/patrols/mine", token);
}

/** PLANNED → ACTIVE. */
export function startMyPatrol(token: string) {
  return request<MyPatrolResponse>("/patrols/mine/start", token, "POST");
}

/** In progress → COMPLETED. */
export function completeMyPatrol(token: string) {
  return request<MyPatrolResponse>("/patrols/mine/complete", token, "POST");
}

/* ------------------------------ Offline queue ---------------------------- */

interface PendingLocations {
  patrolId: string;
  points: LocationReport[];
}

async function readQueue(patrolId: string): Promise<LocationReport[]> {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    const pending: PendingLocations | null = stored ? JSON.parse(stored) : null;
    // Positions left over from a different patrol are of no use any more.
    return pending?.patrolId === patrolId ? pending.points : [];
  } catch {
    return [];
  }
}

async function writeQueue(patrolId: string, points: LocationReport[]) {
  if (points.length === 0) {
    await AsyncStorage.removeItem(QUEUE_KEY);
    return;
  }
  const pending: PendingLocations = { patrolId, points };
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pending));
}

/** How many positions are waiting to be sent for this patrol. */
export async function countPendingLocations(patrolId: string) {
  return (await readQueue(patrolId)).length;
}

export interface SendOutcome {
  /** The server's answer, or null when nothing could be sent. */
  result: LocationReportResult | null;
  /** Positions still stored on the phone. */
  waiting: number;
  /** Set when the server refused the positions (they are then discarded). */
  rejected: string | null;
}

/**
 * Stores the new position, then tries to send everything that is waiting.
 * With no connection the positions simply stay on the phone and are sent
 * (as "synchronised" points) the next time this is called.
 */
export async function reportLocation(
  token: string,
  patrolId: string,
  point: LocationReport
): Promise<SendOutcome> {
  const queue = [...(await readQueue(patrolId)), point];
  await writeQueue(patrolId, queue);

  const batch = queue.slice(0, MAX_POINTS_PER_REQUEST);
  try {
    const result = await request<LocationReportResult>(
      "/patrols/mine/locations",
      token,
      "POST",
      { points: batch }
    );
    const remaining = queue.slice(batch.length);
    await writeQueue(patrolId, remaining);
    return { result, waiting: remaining.length, rejected: null };
  } catch (error) {
    const refused =
      error instanceof PatrolApiError && REFUSED_STATUSES.includes(error.status);
    if (refused) {
      // The server will never accept these points (patrol not started,
      // invalid position…): drop them so the queue cannot get stuck.
      await writeQueue(patrolId, []);
      return { result: null, waiting: 0, rejected: (error as PatrolApiError).message };
    }
    // No connection or a temporary server fault: keep everything for later.
    return { result: null, waiting: queue.length, rejected: null };
  }
}

/* -------------------------------- Demo walk ------------------------------ */

type Position = Pick<PatrolWaypoint, "latitude" | "longitude">;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function distanceKm(from: Position, to: Position) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * The position reached after walking `distance` km along the route.
 * Used only by the "Demo walk" switch, which lets the app be demonstrated
 * away from the park by sending positions along the assigned route.
 */
export function positionAlongRoute(
  waypoints: Position[],
  distance: number
): Position {
  let remaining = Math.max(0, distance);

  for (let index = 1; index < waypoints.length; index += 1) {
    const start = waypoints[index - 1];
    const end = waypoints[index];
    const segment = distanceKm(start, end);

    if (remaining <= segment && segment > 0) {
      const ratio = remaining / segment;
      return {
        latitude: start.latitude + (end.latitude - start.latitude) * ratio,
        longitude: start.longitude + (end.longitude - start.longitude) * ratio,
      };
    }
    remaining -= segment;
  }

  return waypoints[waypoints.length - 1];
}
