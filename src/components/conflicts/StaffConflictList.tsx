import {
    AlertTriangle,
    ChevronRight,
    Clock3,
    FileText,
    MapPin,
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
    getStaffConflictReports,
} from "@/services/conflict.service";

import {
    ConflictReport,
    ConflictStatus,
} from "@/types/conflict";

interface Props {
  role:
    | "RANGER"
    | "COMMUNITY_LIAISON_OFFICER";
}

const filters: {
  label: string;
  value: ConflictStatus | null;
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

function getTypeLabel(
  type: string
) {
  if (
    type ===
    "ELEPHANT_SIGHTING"
  ) {
    return "Elephant Sighting";
  }

  if (
    type === "CROP_RAIDING"
  ) {
    return "Crop Raiding";
  }

  return "Other Conflict";
}

export default function StaffConflictList({
  role,
}: Props) {
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
            await getStaffConflictReports(
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

      return undefined;
    }, [loadReports])
  );

  function openReport(
    reportId: string
  ) {
    if (role === "RANGER") {
      router.push({
        pathname:
          "/ranger/conflicts/[id]",

        params: {
          id: reportId,
        },
      });

      return;
    }

    router.push({
      pathname:
        "/liaison/conflicts/[id]",

      params: {
        id: reportId,
      },
    });
  }

  return (
    <View className="flex-1 bg-[#F2F6F2] dark:bg-[#081A17]">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() => {
              setRefreshing(true);

              loadReports(
                false
              );
            }}
            colors={[
              "#0F766E",
            ]}
          />
        }
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 45,
        }}
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text className="text-[26px] font-bold text-[#172F28] dark:text-[#F1F7F1]">
          Conflict Reports
        </Text>

        <Text className="mt-2 text-sm leading-6 text-[#6D7D73] dark:text-[#A3B9B0]">
          Review community
          human-wildlife conflict
          reports and coordinate an
          appropriate response.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          className="mt-5"
        >
          <View className="flex-row gap-2">
            {filters.map(
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
                        ? "bg-[#14785D]"
                        : "border border-[#E0E9E2] bg-white"
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

        {loading && (
          <View className="items-center py-20">
            <ActivityIndicator
              size="large"
              color="#0F766E"
            />

            <Text className="mt-3 text-sm text-[#6D7D73] dark:text-[#A3B9B0]">
              Loading reports...
            </Text>
          </View>
        )}

        {!loading &&
          error && (
            <View className="mt-6 items-center rounded-2xl border border-red-100 bg-red-50 p-6">
              <AlertTriangle
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
                className="mt-4 rounded-xl bg-red-100 px-5 py-3"
              >
                <Text className="font-bold text-red-700">
                  Try Again
                </Text>
              </Pressable>
            </View>
          )}

        {!loading &&
          !error &&
          reports.length ===
            0 && (
            <View className="mt-6 items-center rounded-2xl border border-[#E0E9E2] bg-white p-10 dark:bg-[#102923] dark:border-[#28493D]">
              <FileText
                size={30}
                color="#64748B"
              />

              <Text className="mt-4 font-bold text-slate-800 dark:text-[#F1F7F1]">
                No conflict reports
              </Text>
            </View>
          )}

        {!loading &&
          !error && (
            <View className="mt-5 gap-3">
              {reports.map(
                (report) => (
                  <Pressable
                    key={
                      report._id
                    }
                    onPress={() =>
                      openReport(
                        report._id
                      )
                    }
                    className="rounded-2xl border border-[#E0E9E2] bg-white p-5 dark:bg-[#102923] dark:border-[#28493D]"
                  >
                    <View className="flex-row items-start">
                      <View className="flex-1">
                        <Text className="text-base font-bold text-[#172F28] dark:text-[#F1F7F1]">
                          {getTypeLabel(
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
                      numberOfLines={
                        2
                      }
                      className="mt-3 text-sm leading-5 text-[#6D7D73] dark:text-[#A3B9B0]"
                    >
                      {
                        report.description
                      }
                    </Text>

                    <View className="mt-4 gap-2">
                      <View className="flex-row items-center">
                        <MapPin
                          size={15}
                          color="#64748B"
                        />

                        <Text
                          numberOfLines={
                            1
                          }
                          className="ml-2 flex-1 text-xs text-[#6D7D73] dark:text-[#A3B9B0]"
                        >
                          {report
                            .location
                            .source ===
                          "GPS"
                            ? `${report.location.latitude?.toFixed(
                                5
                              )}, ${report.location.longitude?.toFixed(
                                5
                              )}`
                            : report
                                .location
                                .manualLocation}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Clock3
                          size={15}
                          color="#64748B"
                        />

                        <Text className="ml-2 text-xs text-[#6D7D73] dark:text-[#A3B9B0]">
                          {new Date(
                            report.createdAt
                          ).toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    {report
                      .duplicateInfo
                      ?.isPotentialDuplicate && (
                      <View className="mt-4 self-start rounded-lg bg-blue-50 px-3 py-2">
                        <Text className="text-[10px] font-bold text-blue-700">
                          POTENTIAL DUPLICATE
                        </Text>
                      </View>
                    )}
                  </Pressable>
                )
              )}
            </View>
          )}
      </ScrollView>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: ConflictStatus;
}) {
  const config = {
    SUBMITTED: {
      text: "Submitted",
      bg: "bg-blue-50",
      color:
        "text-blue-700",
    },

    UNDER_REVIEW: {
      text: "Under Review",
      bg: "bg-amber-50",
      color:
        "text-amber-700",
    },

    RESPONDING: {
      text: "Responding",
      bg: "bg-violet-50",
      color:
        "text-violet-700",
    },

    RESOLVED: {
      text: "Resolved",
      bg: "bg-emerald-50",
      color:
        "text-emerald-700",
    },
  };

  const item =
    config[status];

  return (
    <View
      className={`mt-2 self-start rounded-full px-3 py-1 ${item.bg}`}
    >
      <Text
        className={`text-[10px] font-bold ${item.color}`}
      >
        {item.text}
      </Text>
    </View>
  );
}