import {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";

import {
    ConflictLocation,
    ConflictReportDraft,
    ConflictType,
    EvidenceItem,
} from "@/types/conflict";

interface ConflictReportContextType {
  draft: ConflictReportDraft;

  setConflictType: (
    type: ConflictType
  ) => void;

  setLocation: (
    location: ConflictLocation
  ) => void;

  setDescription: (
    description: string
  ) => void;

  setEvidence: (
    evidence: EvidenceItem[]
  ) => void;

  resetDraft: () => void;
}

const initialDraft: ConflictReportDraft = {
  conflictType: null,

  description: "",

  location: {
    source: null,
  },

  evidence: [],
};

const ConflictReportContext =
  createContext<
    ConflictReportContextType | undefined
  >(undefined);

export function ConflictReportProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [draft, setDraft] =
    useState<ConflictReportDraft>(
      initialDraft
    );

  function setConflictType(
    type: ConflictType
  ) {
    setDraft((current) => ({
      ...current,
      conflictType: type,
    }));
  }

  function setLocation(
    location: ConflictLocation
  ) {
    setDraft((current) => ({
      ...current,
      location,
    }));
  }

  function setDescription(
    description: string
  ) {
    setDraft((current) => ({
      ...current,
      description,
    }));
  }

  function setEvidence(
    evidence: EvidenceItem[]
  ) {
    setDraft((current) => ({
      ...current,
      evidence,
    }));
  }

  function resetDraft() {
    setDraft({
      conflictType: null,
      description: "",

      location: {
        source: null,
      },

      evidence: [],
    });
  }

  return (
    <ConflictReportContext.Provider
      value={{
        draft,
        setConflictType,
        setLocation,
        setDescription,
        setEvidence,
        resetDraft,
      }}
    >
      {children}
    </ConflictReportContext.Provider>
  );
}

export function useConflictReport() {
  const context =
    useContext(
      ConflictReportContext
    );

  if (!context) {
    throw new Error(
      "useConflictReport must be used inside ConflictReportProvider"
    );
  }

  return context;
}