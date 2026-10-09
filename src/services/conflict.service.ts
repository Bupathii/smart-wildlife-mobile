import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

import { API_BASE_URL } from "@/services/api";

import {
  ConflictReport,
  ConflictReportDraft,
  ConflictStatus,
  UrgencyLevel,
} from "@/types/conflict";

export class ConflictApiError extends Error {
  status: number;
  data: any;

  constructor(
    message: string,
    status: number,
    data?: any
  ) {
    super(message);

    this.name = "ConflictApiError";
    this.status = status;
    this.data = data;
  }
}

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

async function readResponse(
  response: any
) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/*
 * =====================================================
 * SUBMIT COMMUNITY CONFLICT REPORT
 * POST /api/conflicts
 * =====================================================
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

  /*
   * Multiple optional evidence images.
   */
  for (const evidence of draft.evidence) {
    const file = new File(
      evidence.uri
    );

    if (!file.exists) {
      throw new Error(
        `Evidence file "${evidence.fileName}" is not available`
      );
    }

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
    await readResponse(response);

  if (!response.ok) {
    throw new ConflictApiError(
      data?.message ||
        "Unable to submit report",
      response.status,
      data
    );
  }

  return data;
}

/*
 * =====================================================
 * COMMUNITY MEMBER - MY REPORTS
 * GET /api/conflicts/my
 * =====================================================
 */
export async function getMyConflictReports(
  token: string,
  status?: ConflictStatus
): Promise<MyReportsResponse> {
  let url =
    `${API_BASE_URL}/conflicts/my`;

  if (status) {
    url +=
      `?status=${encodeURIComponent(
        status
      )}`;
  }

  const response = await fetch(
    url,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data: any =
    await readResponse(response);

  if (!response.ok) {
    throw new ConflictApiError(
      data?.message ||
        "Unable to load reports",
      response.status,
      data
    );
  }

  return data;
}

/*
 * =====================================================
 * GET SINGLE CONFLICT REPORT
 * GET /api/conflicts/:id
 * =====================================================
 */
export async function getConflictReportById(
  reportId: string,
  token: string
): Promise<SingleReportResponse> {
  const response = await fetch(
    `${API_BASE_URL}/conflicts/${reportId}`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data: any =
    await readResponse(response);

  if (!response.ok) {
    throw new ConflictApiError(
      data?.message ||
        "Unable to load report",
      response.status,
      data
    );
  }

  return data;
}

/*
 * =====================================================
 * STAFF - GET ALL CONFLICT REPORTS
 * GET /api/conflicts
 * =====================================================
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
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data: any =
    await readResponse(response);

  if (!response.ok) {
    throw new ConflictApiError(
      data?.message ||
        "Unable to load conflict reports",
      response.status,
      data
    );
  }

  return data;
}

/*
 * =====================================================
 * RANGER / CLO - UPDATE RESPONSE
 * PATCH /api/conflicts/:id/response
 * =====================================================
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
    await readResponse(response);

  if (!response.ok) {
    throw new ConflictApiError(
      data?.message ||
        "Unable to update report",
      response.status,
      data
    );
  }

  return data;
}