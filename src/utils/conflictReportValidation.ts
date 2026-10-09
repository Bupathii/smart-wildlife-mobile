import {
    ConflictReportDraft,
} from "@/types/conflict";

type ValidationSuccess = {
  valid: true;
};

type ValidationFailure = {
  valid: false;
  title: string;
  message: string;
};

export type ConflictReportValidationResult =
  | ValidationSuccess
  | ValidationFailure;

const MAX_DESCRIPTION_LENGTH =
  1500;

const MIN_DESCRIPTION_LENGTH =
  5;

const MAX_EVIDENCE =
  5;

export function validateConflictReportDraft(
  draft: ConflictReportDraft
): ConflictReportValidationResult {
  /*
   * Client report ID
   */
  if (
    !draft.clientReportId ||
    !draft.clientReportId.trim()
  ) {
    return {
      valid: false,

      title:
        "Invalid Report",

      message:
        "The report reference is missing. Please restart the report and try again.",
    };
  }

  /*
   * Conflict type
   */
  if (!draft.conflictType) {
    return {
      valid: false,

      title:
        "Conflict Type Required",

      message:
        "Please select the type of human-wildlife conflict.",
    };
  }

  if (
    ![
      "ELEPHANT_SIGHTING",
      "CROP_RAIDING",
      "OTHER",
    ].includes(
      draft.conflictType
    )
  ) {
    return {
      valid: false,

      title:
        "Invalid Conflict Type",

      message:
        "Please select a valid conflict type.",
    };
  }

  /*
   * Description
   */
  const description =
    draft.description.trim();

  if (!description) {
    return {
      valid: false,

      title:
        "Conflict Details Required",

      message:
        "Please provide details about the conflict.",
    };
  }

  if (
    description.length <
    MIN_DESCRIPTION_LENGTH
  ) {
    return {
      valid: false,

      title:
        "More Details Required",

      message:
        "Please provide at least 5 characters describing what happened.",
    };
  }

  if (
    description.length >
    MAX_DESCRIPTION_LENGTH
  ) {
    return {
      valid: false,

      title:
        "Description Too Long",

      message:
        "Conflict details cannot exceed 1500 characters.",
    };
  }

  /*
   * Location source
   */
  if (!draft.location.source) {
    return {
      valid: false,

      title:
        "Location Required",

      message:
        "Please provide the location of the conflict.",
    };
  }

  if (
    draft.location.source !==
      "GPS" &&
    draft.location.source !==
      "MANUAL"
  ) {
    return {
      valid: false,

      title:
        "Invalid Location",

      message:
        "Please select GPS or manual location.",
    };
  }

  /*
   * GPS validation
   */
  if (
    draft.location.source ===
    "GPS"
  ) {
    const {
      latitude,
      longitude,
    } = draft.location;

    if (
      typeof latitude !==
        "number" ||
      typeof longitude !==
        "number" ||
      !Number.isFinite(
        latitude
      ) ||
      !Number.isFinite(
        longitude
      )
    ) {
      return {
        valid: false,

        title:
          "GPS Location Required",

        message:
          "Please capture a valid GPS location before submitting the report.",
      };
    }

    if (
      latitude < -90 ||
      latitude > 90
    ) {
      return {
        valid: false,

        title:
          "Invalid GPS Location",

        message:
          "The captured latitude is invalid. Please capture your location again.",
      };
    }

    if (
      longitude < -180 ||
      longitude > 180
    ) {
      return {
        valid: false,

        title:
          "Invalid GPS Location",

        message:
          "The captured longitude is invalid. Please capture your location again.",
      };
    }
  }

  /*
   * Manual location validation
   */
  if (
    draft.location.source ===
    "MANUAL"
  ) {
    const manualLocation =
      draft.location.manualLocation
        ?.trim();

    if (!manualLocation) {
      return {
        valid: false,

        title:
          "Manual Location Required",

        message:
          "Please enter an approximate location before submitting the report.",
      };
    }
  }

  /*
   * Evidence validation
   *
   * Evidence is optional,
   * but maximum is 5 images.
   */
  if (
    draft.evidence.length >
    MAX_EVIDENCE
  ) {
    return {
      valid: false,

      title:
        "Too Many Images",

      message:
        "You can attach a maximum of 5 evidence images.",
    };
  }

  for (
    let index = 0;
    index <
    draft.evidence.length;
    index++
  ) {
    const evidence =
      draft.evidence[index];

    if (
      !evidence.uri ||
      !evidence.uri.trim()
    ) {
      return {
        valid: false,

        title:
          "Invalid Evidence",

        message:
          `Evidence image ${
            index + 1
          } is not available. Please remove it and select the image again.`,
      };
    }

    if (
      !evidence.fileName ||
      !evidence.fileName.trim()
    ) {
      return {
        valid: false,

        title:
          "Invalid Evidence",

        message:
          `Evidence image ${
            index + 1
          } does not have a valid file name. Please select the image again.`,
      };
    }

    if (
      !evidence.mimeType ||
      !evidence.mimeType.startsWith(
        "image/"
      )
    ) {
      return {
        valid: false,

        title:
          "Invalid Evidence",

        message:
          `Evidence item ${
            index + 1
          } must be a valid image.`,
      };
    }
  }

  return {
    valid: true,
  };
}