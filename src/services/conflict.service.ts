import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

import {
    API_BASE_URL,
} from "@/services/api";

import {
    ConflictReport,
    ConflictReportDraft,
    ConflictStatus,
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

/*
 * =====================================================
 * SUBMIT CONFLICT REPORT
 * POST /api/conflicts
 * =====================================================
 */
export async function submitConflictReport(
  draft: ConflictReportDraft,
  token: string
): Promise<SubmitConflictResponse> {
  const formData =
    new FormData();

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
    draft.location.latitude !==
    undefined
  ) {
    formData.append(
      "latitude",
      String(
        draft.location.latitude
      )
    );
  }

  if (
    draft.location.longitude !==
    undefined
  ) {
    formData.append(
      "longitude",
      String(
        draft.location.longitude
      )
    );
  }

  if (
    draft.location.manualLocation
  ) {
    formData.append(
      "manualLocation",
      draft.location.manualLocation
    );
  }

  /*
   * Multiple Evidence
   * 0 - 5 images
   */
  for (const evidence of draft.evidence) {
    const file =
      new File(
        evidence.uri
      );

    formData.append(
      "evidence",
      file
    );
  }

  const response =
    await fetch(
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

  let data: any;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "Invalid response from server"
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to submit report"
    );
  }

  return data;
}

/*
 * =====================================================
 * MY REPORTS
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

  const response =
    await fetch(url, {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    });

  let data: any;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "Invalid response from server"
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to load reports"
    );
  }

  return data;
}

/*
 * =====================================================
 * GET SINGLE REPORT
 * GET /api/conflicts/:id
 * =====================================================
 */
export async function getConflictReportById(
  reportId: string,
  token: string
): Promise<SingleReportResponse> {
  const response =
    await fetch(
      `${API_BASE_URL}/conflicts/${reportId}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  let data: any;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "Invalid response from server"
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to load report"
    );
  }

  return data;
}