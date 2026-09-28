import {
  AlertCircle,
  ChevronRight,
  Clock3,
  CloudOff,
  FileText,
  MapPin,
  RefreshCw,
  RotateCw,
  Wifi,
} from "lucide-react-native";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import {
  useCallback,
  useState,
} from "react";

import NetInfo from "@react-native-community/netinfo";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  getMyConflictReports,
} from "@/services/conflict.service";

import {
  getPendingConflictReports,
  PendingConflictReport,
  syncPendingConflictReports,
} from "@/services/pendingConflict.service";

import {
  ConflictReport,
  ConflictStatus,
} from "@/types/conflict";

const FILTERS: {
  label: string;
  value:
    | ConflictStatus
    | null;
}[] = [
  {
    label: "All",
    value: null,
  },
  {
    label: "Submitted",
    value: "SUBMITTED",
  },
  {
    label: "Reviewing",
    value: "UNDER_REVIEW",
  },
  {
    label: "Responding",
    value: "RESPONDING",
  },
  {
    label: "Resolved",
    value: "RESOLVED",
  },
];

function getConflictLabel(
  type: string
) {
  switch (type) {
    case "ELEPHANT_SIGHTING":
      return "Elephant Sighting";

    case "CROP_RAIDING":
      return "Crop Raiding";

    default:
      return "Other Conflict";
  }
}

function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleString();
}

export default function MyReportsScreen() {
  const { token } =
    useAuth();

  const [
    reports,
    setReports,
  ] =
    useState<
      ConflictReport[]
    >([]);

  const [
    pendingReports,
    setPendingReports,
  ] =
    useState<
      PendingConflictReport[]
    >([]);

  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState<
      ConflictStatus | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    syncing,
    setSyncing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * ===================================================
   * LOAD PENDING LOCAL REPORTS
   * ===================================================
   */
  async function loadPendingReports() {
    try {
      const pending =
        await getPendingConflictReports();

      setPendingReports(
        pending
      );
    } catch {
      setPendingReports(
        []
      );
    }
  }

  /*
   * ===================================================
   * LOAD SERVER + LOCAL REPORTS
   * ===================================================
   */
  const loadReports =
    useCallback(
      async (
        showLoader = true
      ) => {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        /*
         * Always try local reports.
         * They should be visible even
         * when internet is unavailable.
         */
        await loadPendingReports();

        if (!token) {
          setLoading(false);
          setRefreshing(false);

          return;
        }

        try {
          const result =
            await getMyConflictReports(
              token,
              selectedStatus ||
                undefined
            );

          setReports(
            result.reports ||
              []
          );
        } catch (err: any) {
          /*
           * Do not remove pending local
           * reports when server cannot
           * be reached.
           */
          setReports([]);

          setError(
            err?.message ||
              "Unable to load online reports."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        token,
        selectedStatus,
      ]
    );

  /*
   * Reload when page becomes active.
   */
  useFocusEffect(
    useCallback(() => {
      loadReports();

      return undefined;
    }, [loadReports])
  );

  /*
   * ===================================================
   * PULL TO REFRESH
   * ===================================================
   */
  async function refresh() {
    setRefreshing(true);

    await loadReports(
      false
    );
  }

  /*
   * ===================================================
   * MANUAL SYNC
   * ===================================================
   */
  async function handleSync() {
    if (!token) {
      Alert.alert(
        "Session Required",
        "Please log in again."
      );

      return;
    }

    if (
      pendingReports.length ===
      0
    ) {
      Alert.alert(
        "Nothing to Sync",
        "There are no pending reports."
      );

      return;
    }

    try {
      setSyncing(true);

      const network =
        await NetInfo.fetch();

      const online =
        network.isConnected ===
          true &&
        network
          .isInternetReachable !==
          false;

      if (!online) {
        Alert.alert(
          "No Internet Connection",
          "Pending reports will remain saved on this device until internet access is available."
        );

        return;
      }

      const result =
        await syncPendingConflictReports(
          token
        );

      await loadReports(
        false
      );

      if (
        result.synced > 0 &&
        result.remaining === 0
      ) {
        Alert.alert(
          "Synchronization Complete",
          `${result.synced} report${
            result.synced === 1
              ? ""
              : "s"
          } synchronized successfully.`
        );

        return;
      }

      if (
        result.synced > 0
      ) {
        Alert.alert(
          "Partially Synchronized",
          `${result.synced} report${
            result.synced === 1
              ? ""
              : "s"
          } synchronized. ${result.remaining} report${
            result.remaining ===
            1
              ? ""
              : "s"
          } still pending.`
        );

        return;
      }

      Alert.alert(
        "Sync Pending",
        "The reports could not be synchronized yet. They are still saved safely on this device."
      );
    } catch (err: any) {
      Alert.alert(
        "Synchronization Failed",
        err?.message ||
          "Unable to synchronize pending reports."
      );
    } finally {
      setSyncing(false);
    }
  }

  const showPending =
    selectedStatus === null &&
    pendingReports.length > 0;

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              refresh
            }
            colors={[
              "#0F766E",
            ]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 50,
        }}
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* Header */}

        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[26px] font-bold text-slate-900">
              My Reports
            </Text>

            <Text className="mt-2 text-sm leading-6 text-slate-500">
              View your submitted
              reports and track their
              current response status.
            </Text>
          </View>

          {pendingReports.length >
            0 && (
            <Pressable
              disabled={
                syncing
              }
              onPress={
                handleSync
              }
              className={`h-11 w-11 items-center justify-center rounded-xl ${
                syncing
                  ? "bg-slate-200"
                  : "bg-teal-100"
              }`}
            >
              {syncing ? (
                <ActivityIndicator
                  size="small"
                  color="#0F766E"
                />
              ) : (
                <RotateCw
                  size={19}
                  color="#0F766E"
                />
              )}
            </Pressable>
          )}
        </View>

        {/* Pending summary */}

        {pendingReports.length >
          0 && (
          <View className="mt-5 flex-row rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <CloudOff
              size={20}
              color="#2563EB"
            />

            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-blue-900">
                {
                  pendingReports.length
                }{" "}
                report
                {pendingReports.length ===
                1
                  ? ""
                  : "s"}{" "}
                waiting to sync
              </Text>

              <Text className="mt-1 text-xs leading-5 text-blue-700">
                These reports are
                stored on this device
                and will synchronize
                automatically when
                internet access is
                available.
              </Text>

              <Pressable
                disabled={
                  syncing
                }
                onPress={
                  handleSync
                }
                className="mt-3 self-start flex-row items-center rounded-xl bg-blue-100 px-4 py-2.5"
              >
                <Wifi
                  size={15}
                  color="#1D4ED8"
                />

                <Text className="ml-2 text-xs font-bold text-blue-700">
                  {syncing
                    ? "Synchronizing..."
                    : "Sync Now"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Filters */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          className="mt-5"
        >
          <View className="flex-row gap-2">
            {FILTERS.map(
              (filter) => {
                const selected =
                  selectedStatus ===
                  filter.value;

                return (
                  <Pressable
                    key={
                      filter.label
                    }
                    onPress={() =>
                      setSelectedStatus(
                        filter.value
                      )
                    }
                    className={`rounded-full px-4 py-2.5 ${
                      selected
                        ? "bg-teal-700"
                        : "border border-slate-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selected
                          ? "text-white"
                          : "text-slate-600"
                      }`}
                    >
                      {
                        filter.label
                      }
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        </ScrollView>

        {/* Loading */}

        {loading && (
          <View className="items-center py-16">
            <ActivityIndicator
              size="large"
              color="#0F766E"
            />

            <Text className="mt-3 text-sm text-slate-500">
              Loading reports...
            </Text>
          </View>
        )}

        {/* Pending Reports */}

        {!loading &&
          showPending && (
            <View className="mt-6">
              <View className="mb-3 flex-row items-center">
                <CloudOff
                  size={17}
                  color="#2563EB"
                />

                <Text className="ml-2 text-sm font-bold text-slate-800">
                  Pending Sync
                </Text>
              </View>

              <View className="gap-3">
                {pendingReports.map(
                  (
                    pending
                  ) => (
                    <PendingReportCard
                      key={
                        pending
                          .draft
                          .clientReportId
                      }
                      pending={
                        pending
                      }
                    />
                  )
                )}
              </View>
            </View>
          )}

        {/* Online Error */}

        {!loading &&
          error && (
            <View className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <View className="flex-row">
                <AlertCircle
                  size={20}
                  color="#D97706"
                />

                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-amber-900">
                    Online reports unavailable
                  </Text>

                  <Text className="mt-1 text-xs leading-5 text-amber-700">
                    {error}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() =>
                  loadReports()
                }
                className="mt-4 self-start flex-row items-center rounded-xl bg-amber-100 px-4 py-2.5"
              >
                <RefreshCw
                  size={15}
                  color="#B45309"
                />

                <Text className="ml-2 text-xs font-bold text-amber-700">
                  Try Again
                </Text>
              </Pressable>
            </View>
          )}

        {/* Online reports title */}

        {!loading &&
          reports.length > 0 && (
            <Text className="mt-6 text-sm font-bold text-slate-800">
              {selectedStatus
                ? "Filtered Reports"
                : "Submitted Reports"}
            </Text>
          )}

        {/* Online Reports */}

        {!loading &&
          reports.length > 0 && (
            <View className="mt-3 gap-3">
              {reports.map(
                (report) => (
                  <ReportCard
                    key={
                      report._id
                    }
                    report={
                      report
                    }
                  />
                )
              )}
            </View>
          )}

        {/* Completely Empty */}

        {!loading &&
          !error &&
          reports.length === 0 &&
          (!showPending ||
            pendingReports.length ===
              0) && (
            <View className="mt-8 items-center rounded-2xl border border-slate-200 bg-white p-10">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FileText
                  size={25}
                  color="#64748B"
                />
              </View>

              <Text className="mt-4 text-base font-bold text-slate-800">
                No reports found
              </Text>

              <Text className="mt-2 text-center text-xs leading-5 text-slate-400">
                Your submitted
                human-wildlife conflict
                reports will appear
                here.
              </Text>
            </View>
          )}
      </ScrollView>
    </View>
  );
}

/*
 * =====================================================
 * OFFLINE PENDING REPORT CARD
 * =====================================================
 */
function PendingReportCard({
  pending,
}: {
  pending: PendingConflictReport;
}) {
  const {
    draft,
    savedAt,
  } = pending;

  return (
    <View className="rounded-2xl border border-blue-200 bg-white p-5">
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900">
            {getConflictLabel(
              draft.conflictType ||
                "OTHER"
            )}
          </Text>

          <View className="mt-2 self-start flex-row items-center rounded-full bg-blue-50 px-3 py-1.5">
            <CloudOff
              size={12}
              color="#2563EB"
            />

            <Text className="ml-1.5 text-[10px] font-bold text-blue-700">
              PENDING SYNC
            </Text>
          </View>
        </View>
      </View>

      <Text
        numberOfLines={2}
        className="mt-3 text-sm leading-5 text-slate-500"
      >
        {draft.description}
      </Text>

      <View className="mt-4 gap-2">
        <View className="flex-row items-center">
          <MapPin
            size={15}
            color="#64748B"
          />

          <Text
            numberOfLines={1}
            className="ml-2 flex-1 text-xs text-slate-500"
          >
            {draft.location
              .source ===
            "GPS"
              ? `${draft.location.latitude?.toFixed(
                  5
                )}, ${draft.location.longitude?.toFixed(
                  5
                )}`
              : draft.location
                  .manualLocation ||
                "Location unavailable"}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Clock3
            size={15}
            color="#64748B"
          />

          <Text className="ml-2 text-xs text-slate-500">
            Saved{" "}
            {formatDate(
              savedAt
            )}
          </Text>
        </View>
      </View>

      {draft.evidence.length >
        0 && (
        <Text className="mt-4 text-xs font-semibold text-violet-600">
          {
            draft.evidence
              .length
          }{" "}
          evidence image
          {draft.evidence
            .length === 1
            ? ""
            : "s"}{" "}
          saved locally
        </Text>
      )}

      <View className="mt-4 rounded-xl bg-blue-50 px-4 py-3">
        <Text className="text-xs leading-5 text-blue-700">
          This report has not reached
          wildlife personnel yet. It
          will be submitted when the
          device reconnects.
        </Text>
      </View>
    </View>
  );
}

/*
 * =====================================================
 * SERVER REPORT CARD
 * =====================================================
 */
function ReportCard({
  report,
}: {
  report: ConflictReport;
}) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname:
            "/community/reports/[id]",

          params: {
            id:
              report._id,
          },
        })
      }
      className="rounded-2xl border border-slate-200 bg-white p-5"
    >
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900">
            {getConflictLabel(
              report.conflictType
            )}
          </Text>

          <StatusBadge
            status={
              report.status
            }
          />
        </View>

        <ChevronRight
          size={21}
          color="#94A3B8"
        />
      </View>

      <Text
        numberOfLines={2}
        className="mt-3 text-sm leading-5 text-slate-500"
      >
        {report.description}
      </Text>

      <View className="mt-4 gap-2">
        <View className="flex-row items-center">
          <MapPin
            size={15}
            color="#64748B"
          />

          <Text
            numberOfLines={1}
            className="ml-2 flex-1 text-xs text-slate-500"
          >
            {report.location
              .source ===
            "GPS"
              ? `${report.location.latitude?.toFixed(
                  5
                )}, ${report.location.longitude?.toFixed(
                  5
                )}`
              : report.location
                  .manualLocation ||
                "Location unavailable"}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Clock3
            size={15}
            color="#64748B"
          />

          <Text className="ml-2 text-xs text-slate-500">
            {formatDate(
              report.createdAt
            )}
          </Text>
        </View>
      </View>

      {report.evidence?.length >
        0 && (
        <Text className="mt-4 text-xs font-semibold text-violet-600">
          {
            report.evidence
              .length
          }{" "}
          evidence image
          {report.evidence
            .length === 1
            ? ""
            : "s"}
        </Text>
      )}
    </Pressable>
  );
}

/*
 * =====================================================
 * STATUS BADGE
 * =====================================================
 */
function StatusBadge({
  status,
}: {
  status: ConflictStatus;
}) {
  const styles = {
    SUBMITTED: {
      label: "Submitted",
      container:
        "bg-blue-50",
      text: "text-blue-700",
    },

    UNDER_REVIEW: {
      label:
        "Under Review",
      container:
        "bg-amber-50",
      text: "text-amber-700",
    },

    RESPONDING: {
      label: "Responding",
      container:
        "bg-violet-50",
      text: "text-violet-700",
    },

    RESOLVED: {
      label: "Resolved",
      container:
        "bg-emerald-50",
      text: "text-emerald-700",
    },
  };

  const selected =
    styles[status];

  return (
    <View
      className={`mt-2 self-start rounded-full px-3 py-1 ${selected.container}`}
    >
      <Text
        className={`text-[10px] font-bold ${selected.text}`}
      >
        {selected.label}
      </Text>
    </View>
  );
}