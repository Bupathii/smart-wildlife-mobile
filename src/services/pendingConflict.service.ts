import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Directory,
  File,
  Paths,
} from "expo-file-system";

import {
  ConflictReportDraft,
  EvidenceItem,
} from "@/types/conflict";

import {
  ConflictApiError,
  submitConflictReport,
} from "@/services/conflict.service";

const STORAGE_KEY =
  "pending_conflict_reports_v1";

const evidenceDirectory =
  new Directory(
    Paths.document,
    "pending-conflict-evidence"
  );

export interface PendingConflictReport {
  draft: ConflictReportDraft;
  savedAt: string;
}

/*
 * =====================================================
 * CREATE PERSISTENT EVIDENCE DIRECTORY
 * =====================================================
 */
function ensureEvidenceDirectory() {
  if (!evidenceDirectory.exists) {
    evidenceDirectory.create({
      idempotent: true,
      intermediates: true,
    });
  }
}

/*
 * =====================================================
 * SAFE FILE NAME
 * =====================================================
 */
function sanitizeFileName(
  value: string
) {
  return value.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );
}

/*
 * =====================================================
 * COPY EVIDENCE TO PERSISTENT STORAGE
 *
 * ImagePicker files can be temporary.
 * When report is saved offline, copy them to
 * document storage so they remain available.
 * =====================================================
 */
async function persistEvidence(
  draft: ConflictReportDraft
): Promise<EvidenceItem[]> {
  if (
    draft.evidence.length === 0
  ) {
    return [];
  }

  ensureEvidenceDirectory();

  const savedEvidence:
    EvidenceItem[] = [];

  for (
    let index = 0;
    index < draft.evidence.length;
    index++
  ) {
    const evidence =
      draft.evidence[index];

    const source =
      new File(
        evidence.uri
      );

    if (!source.exists) {
      throw new Error(
        `Evidence image ${
          index + 1
        } is no longer available`
      );
    }

    const originalName =
      sanitizeFileName(
        evidence.fileName ||
          `evidence-${index}.jpg`
      );

    const destinationName =
      `${draft.clientReportId}-${index}-${originalName}`;

    const destination =
      new File(
        evidenceDirectory,
        destinationName
      );

    if (destination.exists) {
      await destination.delete();
    }

    await source.copy(
      destination
    );

    savedEvidence.push({
      uri: destination.uri,

      fileName:
        evidence.fileName ||
        destinationName,

      mimeType:
        evidence.mimeType ||
        "image/jpeg",
    });
  }

  return savedEvidence;
}

/*
 * =====================================================
 * GET ALL PENDING REPORTS
 * =====================================================
 */
export async function getPendingConflictReports():
  Promise<
    PendingConflictReport[]
  > {
  try {
    const stored =
      await AsyncStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.log(
      "Unable to read pending conflict reports:",
      error
    );

    return [];
  }
}

/*
 * =====================================================
 * SAVE REPORT LOCALLY
 * =====================================================
 */
export async function savePendingConflictReport(
  draft: ConflictReportDraft
) {
  const current =
    await getPendingConflictReports();

  /*
   * Do not queue same client report twice.
   */
  const alreadyExists =
    current.some(
      (item) =>
        item.draft
          .clientReportId ===
        draft.clientReportId
    );

  if (alreadyExists) {
    return;
  }

  const persistentEvidence =
    await persistEvidence(
      draft
    );

  const pending:
    PendingConflictReport = {
    savedAt:
      new Date().toISOString(),

    draft: {
      ...draft,

      evidence:
        persistentEvidence,
    },
  };

  const updatedQueue = [
    ...current,
    pending,
  ];

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      updatedQueue
    )
  );
}

/*
 * =====================================================
 * REMOVE PERSISTENT EVIDENCE
 * AFTER SUCCESSFUL SYNC
 * =====================================================
 */
async function cleanupEvidence(
  evidence: EvidenceItem[]
) {
  for (const item of evidence) {
    try {
      const file =
        new File(
          item.uri
        );

      if (file.exists) {
        await file.delete();
      }
    } catch (error) {
      console.log(
        "Evidence cleanup failed:",
        error
      );
    }
  }
}

/*
 * =====================================================
 * SYNC PENDING REPORTS
 * =====================================================
 */
export async function syncPendingConflictReports(
  token: string
) {
  const queue =
    await getPendingConflictReports();

  if (queue.length === 0) {
    return {
      synced: 0,
      remaining: 0,
    };
  }

  const remaining:
    PendingConflictReport[] = [];

  let synced = 0;

  for (const pending of queue) {
    try {
      await submitConflictReport(
        pending.draft,
        token
      );

      await cleanupEvidence(
        pending.draft.evidence
      );

      synced++;
    } catch (error) {
      /*
       * A report may already exist on server if:
       *
       * upload reached backend successfully
       * but phone lost connection before receiving
       * the successful response.
       *
       * Same clientReportId then returns 409.
       * Treat this as already synchronized.
       */
      if (
        error instanceof
          ConflictApiError &&
        error.status === 409
      ) {
        await cleanupEvidence(
          pending.draft.evidence
        );

        synced++;

        continue;
      }

      /*
       * Keep report in local queue.
       * It will be retried later.
       */
      remaining.push(
        pending
      );
    }
  }

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      remaining
    )
  );

  return {
    synced,
    remaining:
      remaining.length,
  };
}