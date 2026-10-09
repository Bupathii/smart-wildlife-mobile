const mockStorage =
  new Map();

const mockGetItem =
  jest.fn(
    async (key) =>
      mockStorage.has(key)
        ? mockStorage.get(
            key
          )
        : null
  );

const mockSetItem =
  jest.fn(
    async (
      key,
      value
    ) => {
      mockStorage.set(
        key,
        value
      );
    }
  );

const mockSubmitConflictReport =
  jest.fn();

const mockFileExists =
  new Map();

const mockDeletedUris =
  [];

const mockCopiedFiles =
  [];

let mockDirectoryExists =
  false;

jest.mock(
  '@react-native-async-storage/async-storage',
  () => ({
    __esModule: true,

    default: {
      getItem: (
        ...args
      ) =>
        mockGetItem(
          ...args
        ),

      setItem: (
        ...args
      ) =>
        mockSetItem(
          ...args
        ),
    },
  })
);

jest.mock(
  'expo-file-system',
  () => {
    class Directory {
      constructor(
        base,
        name
      ) {
        this.uri =
          `${base}/${name}`;
      }

      get exists() {
        return (
          mockDirectoryExists
        );
      }

      create() {
        mockDirectoryExists =
          true;
      }
    }

    class File {
      constructor(
        baseOrUri,
        name
      ) {
        this.uri =
          name ===
          undefined
            ? baseOrUri
            : `${baseOrUri.uri}/${name}`;
      }

      get exists() {
        return (
          mockFileExists.get(
            this.uri
          ) ?? true
        );
      }

      async delete() {
        mockDeletedUris.push(
          this.uri
        );

        mockFileExists.set(
          this.uri,
          false
        );
      }

      async copy(
        destination
      ) {
        mockCopiedFiles.push(
          {
            from:
              this.uri,

            to:
              destination.uri,
          }
        );

        mockFileExists.set(
          destination.uri,
          true
        );
      }
    }

    return {
      Directory,
      File,

      Paths: {
        document:
          'file:///documents',
      },
    };
  }
);

jest.mock(
  '@/services/conflict.service',
  () => {
    class ConflictApiError
      extends Error {
      constructor(
        message,
        status,
        data
      ) {
        super(
          message
        );

        this.name =
          'ConflictApiError';

        this.status =
          status;

        this.data =
          data;
      }
    }

    return {
      ConflictApiError,

      submitConflictReport:
        (...args) =>
          mockSubmitConflictReport(
            ...args
          ),
    };
  }
);

const {
  ConflictApiError,
} =
  require(
    '@/services/conflict.service'
  );

const {
  getPendingConflictReports,
  savePendingConflictReport,
  syncPendingConflictReports,
} =
  require(
    '@/services/pendingConflict.service'
  );

const STORAGE_KEY =
  'pending_conflict_reports_v1';

function makeDraft(
  overrides = {}
) {
  return {
    clientReportId:
      'client-report-001',

    conflictType:
      'ELEPHANT_SIGHTING',

    description:
      'Elephant near village boundary.',

    location: {
      source:
        'GPS',

      latitude:
        6.1,

      longitude:
        80.1,
    },

    evidence: [],

    ...overrides,
  };
}

function seedQueue(
  items
) {
  mockStorage.set(
    STORAGE_KEY,
    JSON.stringify(
      items
    )
  );
}

describe(
  'pendingConflict.service offline queue',
  () => {
    beforeEach(() => {
      mockStorage.clear();

      mockGetItem.mockClear();

      mockSetItem.mockClear();

      mockSubmitConflictReport.mockReset();

      mockFileExists.clear();

      mockDeletedUris.length =
        0;

      mockCopiedFiles.length =
        0;

      mockDirectoryExists =
        false;
    });

    test(
      'returns empty queue when nothing has been saved',
      async () => {
        await expect(
          getPendingConflictReports()
        ).resolves.toEqual(
          []
        );

        expect(
          mockGetItem
        ).toHaveBeenCalledWith(
          STORAGE_KEY
        );
      }
    );

    test(
      'returns empty queue for invalid stored JSON instead of crashing',
      async () => {
        mockStorage.set(
          STORAGE_KEY,
          '{not-valid-json'
        );

        const consoleSpy =
          jest
            .spyOn(
              console,
              'log'
            )
            .mockImplementation(
              () => {}
            );

        await expect(
          getPendingConflictReports()
        ).resolves.toEqual(
          []
        );

        expect(
          consoleSpy
        ).toHaveBeenCalled();

        consoleSpy.mockRestore();
      }
    );

    test(
      'returns empty queue when stored value is not an array',
      async () => {
        mockStorage.set(
          STORAGE_KEY,

          JSON.stringify({
            unexpected:
              true,
          })
        );

        await expect(
          getPendingConflictReports()
        ).resolves.toEqual(
          []
        );
      }
    );

    test(
      'saves a new report locally when offline',
      async () => {
        const draft =
          makeDraft();

        await savePendingConflictReport(
          draft
        );

        expect(
          mockSetItem
        ).toHaveBeenCalledTimes(
          1
        );

        const saved =
          JSON.parse(
            mockStorage.get(
              STORAGE_KEY
            )
          );

        expect(
          saved
        ).toHaveLength(
          1
        );

        expect(
          saved[0].draft
        ).toEqual(
          draft
        );

        expect(
          saved[0].savedAt
        ).toEqual(
          expect.any(
            String
          )
        );
      }
    );

    test(
      'does not queue the same clientReportId twice',
      async () => {
        const draft =
          makeDraft();

        seedQueue([
          {
            draft,

            savedAt:
              '2026-10-07T00:00:00.000Z',
          },
        ]);

        await savePendingConflictReport(
          draft
        );

        expect(
          mockSetItem
        ).not.toHaveBeenCalled();

        expect(
          JSON.parse(
            mockStorage.get(
              STORAGE_KEY
            )
          )
        ).toHaveLength(
          1
        );
      }
    );

    test(
      'copies evidence into persistent storage with a safe filename',
      async () => {
        mockFileExists.set(
          'file:///temporary/photo 1?.jpg',
          true
        );

        await savePendingConflictReport(
          makeDraft({
            evidence: [
              {
                uri:
                  'file:///temporary/photo 1?.jpg',

                fileName:
                  'photo 1?.jpg',

                mimeType:
                  'image/jpeg',
              },
            ],
          })
        );

        expect(
          mockCopiedFiles
        ).toEqual([
          {
            from:
              'file:///temporary/photo 1?.jpg',

            to:
              'file:///documents/pending-conflict-evidence/client-report-001-0-photo_1_.jpg',
          },
        ]);

        const saved =
          JSON.parse(
            mockStorage.get(
              STORAGE_KEY
            )
          );

        expect(
          saved[0]
            .draft
            .evidence[0]
        ).toEqual({
          uri:
            'file:///documents/pending-conflict-evidence/client-report-001-0-photo_1_.jpg',

          fileName:
            'photo 1?.jpg',

          mimeType:
            'image/jpeg',
        });
      }
    );

    test(
      'rejects offline save when temporary evidence is missing',
      async () => {
        mockFileExists.set(
          'file:///temporary/missing.jpg',
          false
        );

        await expect(
          savePendingConflictReport(
            makeDraft({
              evidence: [
                {
                  uri:
                    'file:///temporary/missing.jpg',

                  fileName:
                    'missing.jpg',

                  mimeType:
                    'image/jpeg',
                },
              ],
            })
          )
        ).rejects.toThrow(
          'Evidence image 1 is no longer available'
        );

        expect(
          mockSetItem
        ).not.toHaveBeenCalled();
      }
    );

    test(
      'returns zero counts when there are no pending reports to sync',
      async () => {
        await expect(
          syncPendingConflictReports(
            'token-123'
          )
        ).resolves.toEqual({
          synced: 0,
          remaining: 0,
        });

        expect(
          mockSubmitConflictReport
        ).not.toHaveBeenCalled();
      }
    );

    test(
      'successful sync removes the report and cleans persistent evidence',
      async () => {
        const evidenceUri =
          'file:///documents/pending-conflict-evidence/report-photo.jpg';

        const pending = {
          draft:
            makeDraft({
              evidence: [
                {
                  uri:
                    evidenceUri,

                  fileName:
                    'report-photo.jpg',

                  mimeType:
                    'image/jpeg',
                },
              ],
            }),

          savedAt:
            '2026-10-07T00:00:00.000Z',
        };

        seedQueue([
          pending,
        ]);

        mockFileExists.set(
          evidenceUri,
          true
        );

        mockSubmitConflictReport.mockResolvedValue(
          {
            success:
              true,
          }
        );

        await expect(
          syncPendingConflictReports(
            'token-123'
          )
        ).resolves.toEqual({
          synced: 1,
          remaining: 0,
        });

        expect(
          mockSubmitConflictReport
        ).toHaveBeenCalledWith(
          pending.draft,
          'token-123'
        );

        expect(
          mockDeletedUris
        ).toContain(
          evidenceUri
        );

        expect(
          JSON.parse(
            mockStorage.get(
              STORAGE_KEY
            )
          )
        ).toEqual([]);
      }
    );

    test(
      'treats server 409 as already synchronized and removes local copy',
      async () => {
        const pending = {
          draft:
            makeDraft(),

          savedAt:
            '2026-10-07T00:00:00.000Z',
        };

        seedQueue([
          pending,
        ]);

        mockSubmitConflictReport.mockRejectedValue(
          new ConflictApiError(
            'Already exists',
            409
          )
        );

        await expect(
          syncPendingConflictReports(
            'token-123'
          )
        ).resolves.toEqual({
          synced: 1,
          remaining: 0,
        });

        expect(
          JSON.parse(
            mockStorage.get(
              STORAGE_KEY
            )
          )
        ).toEqual([]);
      }
    );

    test(
      'keeps a report in queue when synchronization fails for another reason',
      async () => {
        const pending = {
          draft:
            makeDraft(),

          savedAt:
            '2026-10-07T00:00:00.000Z',
        };

        seedQueue([
          pending,
        ]);

        mockSubmitConflictReport.mockRejectedValue(
          new Error(
            'Network unavailable'
          )
        );

        await expect(
          syncPendingConflictReports(
            'token-123'
          )
        ).resolves.toEqual({
          synced: 0,
          remaining: 1,
        });

        expect(
          JSON.parse(
            mockStorage.get(
              STORAGE_KEY
            )
          )
        ).toEqual([
          pending,
        ]);
      }
    );
  }
);