import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    View
} from "react-native";

import {
    AlertCircle,
    CalendarDays,
    FileText,
    ImageIcon,
    Link2,
    MapPin,
    MessageSquareText,
    ShieldCheck,
    UserRound,
} from "lucide-react-native";

import {
    useLocalSearchParams,
} from "expo-router";

import {
    useEffect,
    useState,
} from "react";

import {
    useAuth,
} from "@/context/AuthContext";

import {
    getConflictReportById,
} from "@/services/conflict.service";

import {
    ConflictReport,
} from "@/types/conflict";

function getConflictTypeLabel(
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
  value?: string | null
) {
  if (!value) {
    return "Not available";
  }

  return new Date(
    value
  ).toLocaleString();
}

export default function ReportDetailsScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const { token } =
    useAuth();

  const [
    report,
    setReport,
  ] =
    useState<
      ConflictReport | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  async function loadReport() {
    if (
      !id ||
      !token
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await getConflictReportById(
          id,
          token
        );

      setReport(
        result.report
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load report."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [id, token]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator
          size="large"
          color="#0F766E"
        />

        <Text className="mt-3 text-sm text-slate-500">
          Loading report...
        </Text>
      </View>
    );
  }

  if (
    error ||
    !report
  ) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <AlertCircle
          size={40}
          color="#DC2626"
        />

        <Text className="mt-4 text-center text-sm text-red-700">
          {error ||
            "Report not found."}
        </Text>

        <Pressable
          onPress={loadReport}
          className="mt-5 rounded-xl bg-teal-700 px-5 py-3"
        >
          <Text className="font-bold text-white">
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 50,
      }}
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* Header */}

      <View className="rounded-2xl bg-teal-800 p-5">
        <Text className="text-xs font-semibold uppercase tracking-wider text-teal-100">
          Conflict Report
        </Text>

        <Text className="mt-2 text-xl font-bold text-white">
          {getConflictTypeLabel(
            report.conflictType
          )}
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <InfoBadge
            text={report.status.replaceAll(
              "_",
              " "
            )}
          />

          <InfoBadge
            text={`${report.urgencyLevel} Urgency`}
          />
        </View>
      </View>

      {/* Basic details */}

      <DetailCard
        icon={FileText}
        iconColor="#0F766E"
        title="Description"
        value={
          report.description
        }
      />

      <DetailCard
        icon={MapPin}
        iconColor="#2563EB"
        title="Conflict Location"
        value={
          report.location
            .source === "GPS"
            ? `Latitude: ${report.location.latitude}\nLongitude: ${report.location.longitude}`
            : report.location
                .manualLocation ||
              "Not available"
        }
        subtitle={
          report.location
            .source === "GPS"
            ? "GPS Location"
            : "Manual Location"
        }
      />

      <DetailCard
        icon={CalendarDays}
        iconColor="#7C3AED"
        title="Reported On"
        value={formatDate(
          report.createdAt
        )}
      />

      {/* Duplicate */}

      {report.duplicateInfo
        ?.isPotentialDuplicate && (
        <View className="mt-4 flex-row rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <Link2
            size={19}
            color="#2563EB"
          />

          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold text-blue-900">
              Similar report found
            </Text>

            <Text className="mt-1 text-xs leading-5 text-blue-700">
              This report was linked
              with a similar recent
              report for staff review.
              Your report remains
              submitted.
            </Text>
          </View>
        </View>
      )}

      {/* Evidence */}

      <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <View className="flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
            <ImageIcon
              size={19}
              color="#7C3AED"
            />
          </View>

          <View className="ml-3">
            <Text className="text-xs font-semibold text-slate-400">
              Supporting Evidence
            </Text>

            <Text className="mt-1 text-sm font-bold text-slate-800">
              {report.evidence?.length ||
                0}{" "}
              image
              {report.evidence
                ?.length === 1
                ? ""
                : "s"}
            </Text>
          </View>
        </View>

        {report.evidence?.length >
        0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            className="mt-4"
          >
            <View className="flex-row gap-3">
              {report.evidence.map(
                (
                  evidence,
                  index
                ) => (
                  <Image
                    key={
                      evidence._id ||
                      `${evidence.url}-${index}`
                    }
                    source={{
                      uri:
                        evidence.url,
                    }}
                    className="h-36 w-36 rounded-xl bg-slate-100"
                    resizeMode="cover"
                  />
                )
              )}
            </View>
          </ScrollView>
        ) : (
          <Text className="mt-4 text-xs text-slate-400">
            No supporting evidence
            was attached to this
            report.
          </Text>
        )}
      </View>

      {/* Assigned Staff */}

      {report.assignedTo && (
        <DetailCard
          icon={UserRound}
          iconColor="#0F766E"
          title="Assigned Wildlife Personnel"
          value={
            report.assignedTo
              .name ||
            "Assigned Staff Member"
          }
          subtitle={
            report.assignedTo
              .role
              ?.replaceAll(
                "_",
                " "
              ) ||
            undefined
          }
        />
      )}

      {/* Response */}

      {report.response?.note && (
        <View className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <MessageSquareText
                size={19}
                color="#047857"
              />
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-xs font-semibold text-emerald-700">
                Wildlife Personnel Response
              </Text>

              {report.response
                .respondedBy
                ?.name && (
                <Text className="mt-1 text-xs text-emerald-600">
                  By{" "}
                  {
                    report
                      .response
                      .respondedBy
                      .name
                  }
                </Text>
              )}
            </View>
          </View>

          <Text className="mt-4 text-sm leading-6 text-emerald-900">
            {
              report.response
                .note
            }
          </Text>

          {report.response
            .respondedAt && (
            <Text className="mt-3 text-xs text-emerald-600">
              {formatDate(
                report.response
                  .respondedAt
              )}
            </Text>
          )}
        </View>
      )}

      <View className="mt-4 flex-row rounded-2xl border border-slate-200 bg-white p-4">
        <ShieldCheck
          size={19}
          color="#0F766E"
        />

        <Text className="ml-3 flex-1 text-xs leading-5 text-slate-500">
          Report status and response
          information will update when
          authorized wildlife personnel
          review the report.
        </Text>
      </View>
    </ScrollView>
  );
}

function DetailCard({
  icon: Icon,
  iconColor,
  title,
  value,
  subtitle,
}: {
  icon: any;
  iconColor: string;
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
      <View className="flex-row items-start">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
          <Icon
            size={19}
            color={
              iconColor
            }
          />
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-xs font-semibold text-slate-400">
            {title}
          </Text>

          {subtitle && (
            <Text className="mt-1 text-[11px] font-semibold text-blue-600">
              {subtitle}
            </Text>
          )}

          <Text className="mt-1 text-sm leading-6 text-slate-800">
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}

function InfoBadge({
  text,
}: {
  text: string;
}) {
  return (
    <View className="rounded-full bg-white/15 px-3 py-1.5">
      <Text className="text-[10px] font-bold uppercase text-white">
        {text}
      </Text>
    </View>
  );
}