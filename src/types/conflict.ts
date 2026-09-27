export type ConflictType =
  | "ELEPHANT_SIGHTING"
  | "CROP_RAIDING"
  | "OTHER";

export type LocationSource =
  | "GPS"
  | "MANUAL";

export interface ConflictLocation {
  source: LocationSource | null;
  latitude?: number;
  longitude?: number;
  manualLocation?: string;
}

export interface EvidenceItem {
  uri: string;
  fileName: string;
  mimeType: string;
}

export interface ConflictReportDraft {
  conflictType: ConflictType | null;
  description: string;
  location: ConflictLocation;
  evidence: EvidenceItem[];
}

export interface ConflictReport {
  _id: string;

  conflictType: ConflictType;
  description: string;

  reportingChannel:
    | "MOBILE_APP"
    | "SMS";

  location: {
    source: LocationSource;
    latitude?: number;
    longitude?: number;
    manualLocation?: string;
  };

  evidence: {
    url: string;
    publicId: string;
    originalName?: string;
  }[];

  status:
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "RESPONDING"
    | "RESOLVED";

  urgencyLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  duplicateInfo?: {
    isPotentialDuplicate: boolean;
    duplicateOf?: unknown;
  };

  createdAt: string;
  updatedAt: string;
}