import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    CheckCircle2,
    FileText,
    ImageIcon,
    MapPin,
    MessageSquareText,
    ShieldAlert,
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
    updateConflictResponse,
} from "@/services/conflict.service";
import { resolveApiAssetUrl } from "@/services/api";

import {
    ConflictReport,
    ConflictStatus,
    UrgencyLevel,
} from "@/types/conflict";

const urgencyOptions: UrgencyLevel[] =
  [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ];

export default function StaffConflictDetails() {
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
    saving,
    setSaving,
  ] = useState(false);

  const [
    responseNote,
    setResponseNote,
  ] = useState("");

  const [
    urgency,
    setUrgency,
  ] =
    useState<UrgencyLevel>(
      "MEDIUM"
    );

  async function loadReport() {
    if (!token || !id) {
      return;
    }

    try {
      setLoading(true);

      const result =
        await getConflictReportById(
          id,
          token
        );

      setReport(
        result.report
      );

      setUrgency(
        result.report
          .urgencyLevel
      );

      setResponseNote(
        result.report.response
          ?.note || ""
      );
    } catch (error: any) {
      Alert.alert(
        "Unable to Load",
        error?.message ||
          "Unable to load the report."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [id, token]);

  async function updateStatus(
    status: Exclude<
      ConflictStatus,
      "SUBMITTED"
    >
  ) {
    if (!token || !id) {
      return;
    }

    try {
      setSaving(true);

      const result =
        await updateConflictResponse(
          id,
          token,
          {
            status,
            urgencyLevel:
              urgency,

            ...(responseNote.trim()
              ? {
                  responseNote:
                    responseNote.trim(),
                }
              : {}),
          }
        );

      setReport(
        result.report
      );

      Alert.alert(
        "Updated",
        "Conflict report updated successfully."
      );
    } catch (error: any) {
      Alert.alert(
        "Update Failed",
        error?.message ||
          "Unable to update report."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator
          size="large"
          color="#0F766E"
        />
      </View>
    );
  }

  if (!report) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-500">
          Report not found.
        </Text>
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
    >
      <View className="rounded-2xl bg-teal-800 p-5">
        <Text className="text-xs font-semibold text-teal-100">
          COMMUNITY CONFLICT REPORT
        </Text>

        <Text className="mt-2 text-xl font-bold text-white">
          {report.conflictType.replaceAll(
            "_",
            " "
          )}
        </Text>

        <Text className="mt-2 text-sm text-teal-100">
          {report.status.replaceAll(
            "_",
            " "
          )}
        </Text>
      </View>

      {/* Reporter */}

      <InfoCard
        icon={UserRound}
        title="Reported By"
        value={
          report.reporter
            ?.name ||
          "Community Member"
        }
      />

      {/* Description */}

      <InfoCard
        icon={FileText}
        title="Description"
        value={
          report.description
        }
      />

      {/* Location */}

      <InfoCard
        icon={MapPin}
        title="Location"
        value={
          report.location
            .source === "GPS"
            ? `${report.location.latitude}, ${report.location.longitude}`
            : report.location
                .manualLocation ||
              "Not available"
        }
      />

      {/* Evidence */}

      <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <View className="flex-row items-center">
          <ImageIcon
            size={19}
            color="#7C3AED"
          />

          <Text className="ml-3 font-bold text-slate-800">
            Supporting Evidence
          </Text>
        </View>

        {report.evidence
          ?.length > 0 ? (
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
                    key={`${evidence.url}-${index}`}
                    source={{
                      uri:
                        resolveApiAssetUrl(evidence.url),
                    }}
                    className="h-36 w-36 rounded-xl"
                    resizeMode="cover"
                  />
                )
              )}
            </View>
          </ScrollView>
        ) : (
          <Text className="mt-3 text-xs text-slate-400">
            No evidence attached.
          </Text>
        )}
      </View>

      {/* Urgency */}

      <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <View className="flex-row items-center">
          <ShieldAlert
            size={19}
            color="#D97706"
          />

          <Text className="ml-3 font-bold text-slate-800">
            Urgency Level
          </Text>
        </View>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {urgencyOptions.map(
            (item) => (
              <Pressable
                key={item}
                onPress={() =>
                  setUrgency(
                    item
                  )
                }
                className={`rounded-full px-4 py-2.5 ${
                  urgency === item
                    ? "bg-amber-600"
                    : "bg-slate-100"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    urgency ===
                    item
                      ? "text-white"
                      : "text-slate-600"
                  }`}
                >
                  {item}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      {/* Response */}

      <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <View className="flex-row items-center">
          <MessageSquareText
            size={19}
            color="#0F766E"
          />

          <Text className="ml-3 font-bold text-slate-800">
            Response Note
          </Text>
        </View>

        <TextInput
          value={responseNote}
          onChangeText={
            setResponseNote
          }
          multiline
          textAlignVertical="top"
          placeholder="Add a response or field action note..."
          placeholderTextColor="#94A3B8"
          className="mt-4 min-h-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
        />
      </View>

      {/* Actions */}

      <Text className="mt-6 text-sm font-bold text-slate-800">
        Update Status
      </Text>

      <View className="mt-3 gap-3">
        <ActionButton
          title="Mark Under Review"
          disabled={
            saving
          }
          background="bg-amber-600"
          onPress={() =>
            updateStatus(
              "UNDER_REVIEW"
            )
          }
        />

        <ActionButton
          title="Start Responding"
          disabled={
            saving
          }
          background="bg-violet-600"
          onPress={() =>
            updateStatus(
              "RESPONDING"
            )
          }
        />

        <Pressable
          disabled={saving}
          onPress={() =>
            updateStatus(
              "RESOLVED"
            )
          }
          className="h-14 flex-row items-center justify-center rounded-2xl bg-emerald-700"
        >
          <CheckCircle2
            size={19}
            color="#FFFFFF"
          />

          <Text className="ml-2 font-bold text-white">
            Mark Resolved
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: string;
}) {
  return (
    <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
      <View className="flex-row items-start">
        <Icon
          size={19}
          color="#0F766E"
        />

        <View className="ml-3 flex-1">
          <Text className="text-xs font-semibold text-slate-400">
            {title}
          </Text>

          <Text className="mt-1 text-sm leading-6 text-slate-800">
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ActionButton({
  title,
  background,
  disabled,
  onPress,
}: {
  title: string;
  background: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`h-14 items-center justify-center rounded-2xl ${background} ${
        disabled
          ? "opacity-50"
          : ""
      }`}
    >
      <Text className="font-bold text-white">
        {title}
      </Text>
    </Pressable>
  );
}