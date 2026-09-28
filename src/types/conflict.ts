export type ConflictType =
  | "ELEPHANT_SIGHTING"
  | "CROP_RAIDING"
  | "OTHER";

export type LocationSource =
  | "GPS"
  | "MANUAL";

export type ConflictStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "RESPONDING"
  | "RESOLVED";

export type UrgencyLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

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
  clientReportId: string;
  conflictType: ConflictType | null;
  description: string;
  location: ConflictLocation;
  evidence: EvidenceItem[];
}

export interface ConflictEvidence {
  _id?: string;
  url: string;
  publicId: string;
  originalName?: string;
  uploadedAt?: string;
}

export interface ConflictReport {
  _id: string;

  reporter?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };

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

  evidence: ConflictEvidence[];

  status: ConflictStatus;

  urgencyLevel: UrgencyLevel;

  duplicateInfo?: {
    isPotentialDuplicate: boolean;
    duplicateOf?: any;
  };

  assignedTo?: {
    _id: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;

  response?: {
    note?: string;
    respondedBy?: {
      _id: string;
      name?: string;
      email?: string;
      role?: string;
    } | null;
    respondedAt?: string | null;
  };

  createdAt: string;
  updatedAt: string;
}