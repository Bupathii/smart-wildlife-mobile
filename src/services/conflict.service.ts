import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

import { API_BASE_URL } from "@/services/api";

import {
  ConflictReport,
  ConflictReportDraft,
  ConflictStatus,
  UrgencyLevel,
} from "@/types/conflict";

interface SubmitConflictResponse {
  success: boolean;
  message: string;
  potentialDuplicate?: boolean;
  report: ConflictReport;
}

interface MyReportsResponse {
  success: boolean;
  count: number;
  reports: ConflictReport[];
}

interface SingleReportResponse {
  success: boolean;
  report: ConflictReport;
}

interface StaffReportsResponse {
  success: boolean;

  pagination: {
    page: number;
    limit: number;
    totalReports: number;
    totalPages: number;
  };

  reports: ConflictReport[];
}

interface UpdateResponsePayload {
  status?: Exclude<
    ConflictStatus,
    "SUBMITTED"
  >;

  urgencyLevel?: UrgencyLevel;

  responseNote?: string;
}

interface UpdateConflictResponse {
  success: boolean;
  message: string;
  report: ConflictReport;
}

/*
 * SUBMIT COMMUNITY REPORT
 */
export async function submitConflictReport(
  draft: ConflictReportDraft,
  token: string
): Promise<SubmitConflictResponse> {
  const formData = new FormData();

  formData.append(
    "clientReportId",
    draft.clientReportId
  );

  formData.append(
    "conflictType",
    draft.conflictType || ""
  );

  formData.append(
    "description",
    draft.description
  );

  formData.append(
    "locationSource",
    draft.location.source || ""
  );

  if (
    draft.location.latitude !== undefined
  ) {
    formData.append(
      "latitude",
      String(draft.location.latitude)
    );
  }

  if (
    draft.location.longitude !== undefined
  ) {
    formData.append(
      "longitude",
      String(draft.location.longitude)
    );
  }

  if (draft.location.manualLocation) {
    formData.append(
      "manualLocation",
      draft.location.manualLocation
    );
  }

  for (const evidence of draft.evidence) {
    const file = new File(
      evidence.uri
    );

    formData.append(
      "evidence",
      file
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/conflicts`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },

      body: formData,
    }
  );

  const data: any =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to submit report"
    );
  }

  return data;
}

/*
 * COMMUNITY MEMBER - MY REPORTS
 */
export async function getMyConflictReports(
  token: string,
  status?: ConflictStatus
): Promise<MyReportsResponse> {
  let url =
    `${API_BASE_URL}/conflicts/my`;

  if (status) {
    url += `?status=${encodeURIComponent(
      status
    )}`;
  }

  const response = await fetch(
    url,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data: any =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to load reports"
    );
  }

  return data;
}

/*
 * GET ONE REPORT
 *
 * Works for Community Member,
 * Ranger and CLO according to backend permissions.
 */
export async function getConflictReportById(
  reportId: string,
  token: string
): Promise<SingleReportResponse> {
  const response = await fetch(
    `${API_BASE_URL}/conflicts/${reportId}`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data: any =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to load report"
    );
  }

  return data;
}

/*
 * STAFF - ALL COMMUNITY CONFLICT REPORTS
 */
export async function getStaffConflictReports(
  token: string,
  status?: ConflictStatus
): Promise<StaffReportsResponse> {
  const params: string[] = [
    "page=1",
    "limit=50",
  ];

  if (status) {
    params.push(
      `status=${encodeURIComponent(
        status
      )}`
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/conflicts?${params.join(
      "&"
    )}`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data: any =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to load conflict reports"
    );
  }

  return data;
}

/*
 * RANGER / CLO - UPDATE RESPONSE
 */
export async function updateConflictResponse(
  reportId: string,
  token: string,
  payload: UpdateResponsePayload
): Promise<UpdateConflictResponse> {
  const response = await fetch(
    `${API_BASE_URL}/conflicts/${reportId}/response`,
    {
      method: "PATCH",

      headers: {
        Authorization:
          `Bearer ${token}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
        payload
      ),
    }
  );

  const data: any =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to update report"
    );
  }

  return data;
}