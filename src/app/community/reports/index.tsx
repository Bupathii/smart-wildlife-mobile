import {
    AlertCircle,
    ChevronRight,
    Clock3,
    FileText,
    MapPin,
    RefreshCw,
} from "lucide-react-native";

import {
    ActivityIndicator,
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

import {
    useAuth,
} from "@/context/AuthContext";

import {
    getMyConflictReports,
} from "@/services/conflict.service";

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
  ] = useState<
    ConflictReport[]
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
    error,
    setError,
  ] = useState("");

  const loadReports =
    useCallback(
      async (
        showLoader = true
      ) => {
        if (!token) {
          return;
        }

        try {
          if (showLoader) {
            setLoading(true);
          }

          setError("");

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
          setError(
            err?.message ||
              "Unable to load reports."
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

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  async function refresh() {
    setRefreshing(true);

    await loadReports(
      false
    );
  }

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
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text className="text-[26px] font-bold text-slate-900">
          My Reports
        </Text>

        <Text className="mt-2 text-sm leading-6 text-slate-500">
          View your submitted
          human-wildlife conflict
          reports and their current
          response status.
        </Text>

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
          <View className="items-center py-20">
            <ActivityIndicator
              size="large"
              color="#0F766E"
            />

            <Text className="mt-3 text-sm text-slate-500">
              Loading reports...
            </Text>
          </View>
        )}

        {/* Error */}

        {!loading &&
          error && (
            <View className="mt-6 items-center rounded-2xl border border-red-100 bg-red-50 p-6">
              <AlertCircle
                size={28}
                color="#DC2626"
              />

              <Text className="mt-3 text-center text-sm text-red-700">
                {error}
              </Text>

              <Pressable
                onPress={() =>
                  loadReports()
                }
                className="mt-4 flex-row items-center rounded-xl bg-red-100 px-4 py-3"
              >
                <RefreshCw
                  size={16}
                  color="#B91C1C"
                />

                <Text className="ml-2 text-sm font-bold text-red-700">
                  Try Again
                </Text>
              </Pressable>
            </View>
          )}

        {/* Empty */}

        {!loading &&
          !error &&
          reports.length ===
            0 && (
            <View className="mt-6 items-center rounded-2xl border border-slate-200 bg-white p-10">
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
                Submitted conflict
                reports will appear
                here.
              </Text>
            </View>
          )}

        {/* Reports */}

        {!loading &&
          !error && (
            <View className="mt-5 gap-3">
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
      </ScrollView>
    </View>
  );
}

function ReportCard({
  report,
}: {
  report: ConflictReport;
}) {
  return (
    <Pressable
      onPress={() =>
        router.push(
          `/community/reports/${report._id}`
        )
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
                  .manualLocation}
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
          {report.evidence.length}{" "}
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