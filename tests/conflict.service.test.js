const mockFetch =
  jest.fn();

const mockFileExists =
  new Map();

jest.mock(
  'expo/fetch',
  () => ({
    fetch: (...args) =>
      mockFetch(...args),
  })
);

jest.mock(
  'expo-file-system',
  () => ({
    File: jest
      .fn()
      .mockImplementation(
        (uri) => ({
          uri,

          get exists() {
            return (
              mockFileExists.get(
                uri
              ) ?? true
            );
          },
        })
      ),
  })
);

jest.mock(
  '@/services/api',
  () => ({
    API_BASE_URL:
      'http://test.local/api',
  })
);

const {
  ConflictApiError,
  getConflictReportById,
  getMyConflictReports,
  getStaffConflictReports,
  submitConflictReport,
  updateConflictResponse,
} =
  require(
    '@/services/conflict.service'
  );

class MockFormData {
  constructor() {
    this.items = [];
  }

  append(
    key,
    value
  ) {
    this.items.push([
      key,
      value,
    ]);
  }

  get(key) {
    return this.items.find(
      ([itemKey]) =>
        itemKey === key
    )?.[1];
  }

  getAll(key) {
    return this.items
      .filter(
        ([itemKey]) =>
          itemKey === key
      )
      .map(
        ([, value]) =>
          value
      );
  }
}

function makeResponse({
  ok = true,
  status = 200,
  data = {},
  jsonError,
} = {}) {
  return {
    ok,
    status,

    json: jest
      .fn()
      .mockImplementation(
        async () => {
          if (jsonError) {
            throw jsonError;
          }

          return data;
        }
      ),
  };
}

function makeDraft(
  overrides = {}
) {
  return {
    clientReportId:
      'client-report-001',

    conflictType:
      'ELEPHANT_SIGHTING',

    description:
      'Elephant seen close to farmland.',

    location: {
      source: 'GPS',
      latitude: 6.12345,
      longitude: 80.12345,
    },

    evidence: [],

    ...overrides,
  };
}

describe(
  'mobile conflict.service',
  () => {
    beforeEach(() => {
      mockFetch.mockReset();

      mockFileExists.clear();

      global.FormData =
        MockFormData;
    });

    test(
      'submits a valid GPS conflict report with bearer token',
      async () => {
        const responseData = {
          success: true,

          message:
            'Conflict report submitted.',

          report: {
            _id: 'report-1',
          },
        };

        mockFetch.mockResolvedValue(
          makeResponse({
            data:
              responseData,
          })
        );

        const result =
          await submitConflictReport(
            makeDraft(),
            'token-123'
          );

        expect(
          result
        ).toEqual(
          responseData
        );

        expect(
          mockFetch
        ).toHaveBeenCalledTimes(
          1
        );

        const [
          url,
          options,
        ] =
          mockFetch.mock
            .calls[0];

        expect(
          url
        ).toBe(
          'http://test.local/api/conflicts'
        );

        expect(
          options.method
        ).toBe(
          'POST'
        );

        expect(
          options.headers
        ).toEqual({
          Authorization:
            'Bearer token-123',
        });

        expect(
          options.body.get(
            'clientReportId'
          )
        ).toBe(
          'client-report-001'
        );

        expect(
          options.body.get(
            'conflictType'
          )
        ).toBe(
          'ELEPHANT_SIGHTING'
        );

        expect(
          options.body.get(
            'description'
          )
        ).toBe(
          'Elephant seen close to farmland.'
        );

        expect(
          options.body.get(
            'locationSource'
          )
        ).toBe(
          'GPS'
        );

        expect(
          options.body.get(
            'latitude'
          )
        ).toBe(
          '6.12345'
        );

        expect(
          options.body.get(
            'longitude'
          )
        ).toBe(
          '80.12345'
        );

        expect(
          options.body.getAll(
            'evidence'
          )
        ).toEqual([]);
      }
    );

    test(
      'submits manual location when GPS is not used',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({
            data: {
              success: true,

              report: {
                _id:
                  'report-2',
              },
            },
          })
        );

        await submitConflictReport(
          makeDraft({
            conflictType:
              'CROP_RAIDING',

            location: {
              source:
                'MANUAL',

              manualLocation:
                'North boundary near village road',
            },
          }),

          'token-123'
        );

        const [
          ,
          options,
        ] =
          mockFetch.mock
            .calls[0];

        expect(
          options.body.get(
            'locationSource'
          )
        ).toBe(
          'MANUAL'
        );

        expect(
          options.body.get(
            'manualLocation'
          )
        ).toBe(
          'North boundary near village road'
        );

        expect(
          options.body.get(
            'latitude'
          )
        ).toBeUndefined();

        expect(
          options.body.get(
            'longitude'
          )
        ).toBeUndefined();
      }
    );

    test(
      'adds available evidence files to the multipart request',
      async () => {
        mockFileExists.set(
          'file:///photo-1.jpg',
          true
        );

        mockFetch.mockResolvedValue(
          makeResponse({
            data: {
              success: true,

              report: {
                _id:
                  'report-3',
              },
            },
          })
        );

        await submitConflictReport(
          makeDraft({
            evidence: [
              {
                uri:
                  'file:///photo-1.jpg',

                fileName:
                  'photo-1.jpg',

                mimeType:
                  'image/jpeg',
              },
            ],
          }),

          'token-123'
        );

        const [
          ,
          options,
        ] =
          mockFetch.mock
            .calls[0];

        const evidence =
          options.body.getAll(
            'evidence'
          );

        expect(
          evidence
        ).toHaveLength(
          1
        );

        expect(
          evidence[0].uri
        ).toBe(
          'file:///photo-1.jpg'
        );
      }
    );

    test(
      'rejects submission when an evidence file no longer exists',
      async () => {
        mockFileExists.set(
          'file:///missing.jpg',
          false
        );

        await expect(
          submitConflictReport(
            makeDraft({
              evidence: [
                {
                  uri:
                    'file:///missing.jpg',

                  fileName:
                    'missing.jpg',

                  mimeType:
                    'image/jpeg',
                },
              ],
            }),

            'token-123'
          )
        ).rejects.toThrow(
          'Evidence file "missing.jpg" is not available'
        );

        expect(
          mockFetch
        ).not.toHaveBeenCalled();
      }
    );

    test(
      'throws ConflictApiError with server message for failed submit',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({
            ok: false,

            status: 400,

            data: {
              message:
                'Conflict type is required.',
            },
          })
        );

        await expect(
          submitConflictReport(
            makeDraft(),
            'token-123'
          )
        ).rejects.toMatchObject({
          name:
            'ConflictApiError',

          message:
            'Conflict type is required.',

          status: 400,

          data: {
            message:
              'Conflict type is required.',
          },
        });
      }
    );

    test(
      'uses fallback API error message when response body is not JSON',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({
            ok: false,

            status: 500,

            jsonError:
              new Error(
                'invalid json'
              ),
          })
        );

        await expect(
          getMyConflictReports(
            'token-123'
          )
        ).rejects.toEqual(
          expect.objectContaining(
            {
              name:
                'ConflictApiError',

              message:
                'Unable to load reports',

              status: 500,
            }
          )
        );
      }
    );

    test(
      'loads community member reports without a status filter',
      async () => {
        const data = {
          success: true,

          count: 1,

          reports: [
            {
              _id:
                'report-1',
            },
          ],
        };

        mockFetch.mockResolvedValue(
          makeResponse({
            data,
          })
        );

        const result =
          await getMyConflictReports(
            'community-token'
          );

        expect(
          result
        ).toEqual(
          data
        );

        expect(
          mockFetch
        ).toHaveBeenCalledWith(
          'http://test.local/api/conflicts/my',
          {
            method:
              'GET',

            headers: {
              Authorization:
                'Bearer community-token',
            },
          }
        );
      }
    );

    test(
      'adds an encoded status filter when loading own reports',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({
            data: {
              success: true,

              count: 0,

              reports: [],
            },
          })
        );

        await getMyConflictReports(
          'community-token',
          'UNDER_REVIEW'
        );

        expect(
          mockFetch.mock
            .calls[0][0]
        ).toBe(
          'http://test.local/api/conflicts/my?status=UNDER_REVIEW'
        );
      }
    );

    test(
      'loads one conflict report by id',
      async () => {
        const data = {
          success: true,

          report: {
            _id:
              '507f1f77bcf86cd799439011',
          },
        };

        mockFetch.mockResolvedValue(
          makeResponse({
            data,
          })
        );

        const result =
          await getConflictReportById(
            '507f1f77bcf86cd799439011',
            'staff-token'
          );

        expect(
          result
        ).toEqual(
          data
        );

        expect(
          mockFetch
        ).toHaveBeenCalledWith(
          'http://test.local/api/conflicts/507f1f77bcf86cd799439011',
          {
            method:
              'GET',

            headers: {
              Authorization:
                'Bearer staff-token',
            },
          }
        );
      }
    );

    test(
      'throws API error when single report cannot be loaded',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({
            ok: false,

            status: 404,

            data: {
              message:
                'Conflict report not found.',
            },
          })
        );

        await expect(
          getConflictReportById(
            'missing-report',
            'staff-token'
          )
        ).rejects.toMatchObject({
          name:
            'ConflictApiError',

          message:
            'Conflict report not found.',

          status: 404,
        });
      }
    );

    test(
      'loads staff reports without an optional status filter',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({
            data: {
              success: true,

              pagination: {
                page: 1,
                limit: 50,

                totalReports:
                  0,

                totalPages:
                  0,
              },

              reports: [],
            },
          })
        );

        await getStaffConflictReports(
          'staff-token'
        );

        expect(
          mockFetch.mock
            .calls[0][0]
        ).toBe(
          'http://test.local/api/conflicts?page=1&limit=50'
        );
      }
    );

    test(
      'loads staff reports with pagination and optional status',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({
            data: {
              success: true,

              pagination: {
                page: 1,
                limit: 50,

                totalReports:
                  0,

                totalPages:
                  0,
              },

              reports: [],
            },
          })
        );

        await getStaffConflictReports(
          'staff-token',
          'RESPONDING'
        );

        expect(
          mockFetch.mock
            .calls[0][0]
        ).toBe(
          'http://test.local/api/conflicts?page=1&limit=50&status=RESPONDING'
        );

        expect(
          mockFetch.mock
            .calls[0][1]
            .headers
            .Authorization
        ).toBe(
          'Bearer staff-token'
        );
      }
    );

    test(
      'throws API error when staff report list fails',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({
            ok: false,

            status: 503,

            data: {},
          })
        );

        await expect(
          getStaffConflictReports(
            'staff-token'
          )
        ).rejects.toMatchObject({
          name:
            'ConflictApiError',

          message:
            'Unable to load conflict reports',

          status: 503,
        });
      }
    );

    test(
      'updates ranger or CLO response using JSON payload',
      async () => {
        const data = {
          success: true,

          message:
            'Updated.',

          report: {
            _id:
              'report-1',

            status:
              'RESPONDING',
          },
        };

        mockFetch.mockResolvedValue(
          makeResponse({
            data,
          })
        );

        const payload = {
          status:
            'RESPONDING',

          urgencyLevel:
            'HIGH',

          responseNote:
            'Ranger dispatched.',
        };

        const result =
          await updateConflictResponse(
            'report-1',
            'ranger-token',
            payload
          );

        expect(
          result
        ).toEqual(
          data
        );

        expect(
          mockFetch
        ).toHaveBeenCalledWith(
          'http://test.local/api/conflicts/report-1/response',
          {
            method:
              'PATCH',

            headers: {
              Authorization:
                'Bearer ranger-token',

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );
      }
    );

    test(
      'throws API error when response update is rejected',
      async () => {
        mockFetch.mockResolvedValue(
          makeResponse({
            ok: false,

            status: 403,

            data: {
              message:
                'Not authorized to update this report.',
            },
          })
        );

        await expect(
          updateConflictResponse(
            'report-1',

            'researcher-token',

            {
              status:
                'RESPONDING',
            }
          )
        ).rejects.toMatchObject({
          name:
            'ConflictApiError',

          message:
            'Not authorized to update this report.',

          status: 403,
        });
      }
    );

    test(
      'ConflictApiError exposes status and data',
      () => {
        const error =
          new ConflictApiError(
            'Conflict',
            409,
            {
              code:
                'DUPLICATE',
            }
          );

        expect(
          error
        ).toBeInstanceOf(
          Error
        );

        expect(
          error.name
        ).toBe(
          'ConflictApiError'
        );

        expect(
          error.status
        ).toBe(
          409
        );

        expect(
          error.data
        ).toEqual({
          code:
            'DUPLICATE',
        });
      }
    );
  }
);