export type PatrolStatus =
  | "PLANNED"
  | "ACTIVE"
  | "DELAYED"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export interface PatrolWaypoint {
  number: number;
  latitude: number;
  longitude: number;
  reached: boolean;
}

export interface MyPatrol {
  patrolId: string;
  status: PatrolStatus;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  route: {
    routeId: string;
    name: string;
    description: string;
    routeLength: number;
  };
  waypoints: PatrolWaypoint[];
  waypointsReached: number;
  progressPercentage: number;
  distanceCoveredKm: number;
  coveragePercentage: number;
  teammates: string[];
  lastUpdate: string;
}

export interface PatrolHistoryItem {
  patrolId: string;
  endTime: string | null;
  durationMinutes: number;
  route: { routeId: string; name: string; routeLength: number };
  coveragePercentage: number;
  distanceCoveredKm: number;
  evaluation: { rating: number; notes: string } | null;
}

export interface PatrolInsights {
  completedPatrols: number;
  averageCoverage: number;
  totalDistanceKm: number;
  averageRating: number;
  lastEvaluation: { patrolId: string; rating: number; notes: string } | null;
}

export interface MyPatrolResponse {
  ranger: { rangerId: string; name: string; rank: string };
  patrol: MyPatrol | null;
  insights: PatrolInsights;
  history: PatrolHistoryItem[];
}

/** One position waiting to be sent, or already sent, to the server. */
export interface LocationReport {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface LocationReportResult {
  accepted: number;
  patrolId: string;
  progressPercentage: number;
  distanceCoveredKm: number;
}
