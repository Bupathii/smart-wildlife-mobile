import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import {
    CheckCircle2,
    FileText,
    ImageIcon,
    LoaderCircle,
    MapPin,
    Pencil,
    ShieldCheck,
    TriangleAlert,
} from "lucide-react-native";

import {
    router,
} from "expo-router";

import {
    useState,
} from "react";

import {
    useAuth,
} from "@/context/AuthContext";

import {
    useConflictReport,
} from "@/context/ConflictReportContext";

import {
    submitConflictReport,
} from "@/services/conflict.service";

function getConflictTypeLabel(
  type: string | null
) {
  switch (type) {
    case "ELEPHANT_SIGHTING":
      return "Elephant Sighting";

    case "CROP_RAIDING":
      return "Crop Raiding";

    case "OTHER":
      return "Other Conflict";

    default:
      return "Not selected";
  }
}

export default function ReviewScreen() {
  const { token } =
    useAuth();

  const {
    draft,
    resetDraft,
  } = useConflictReport();

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  async function handleSubmit() {
    if (!token) {
      Alert.alert(
        "Session Expired",
        "Please log in again."
      );

      return;
    }

    if (
      !draft.conflictType ||
      !draft.location.source ||
      !draft.description.trim()
    ) {
      Alert.alert(
        "Incomplete Report",
        "Please complete the required report information."
      );

      return;
    }

    try {
      setSubmitting(true);

      const result =
        await submitConflictReport(
          draft,
          token
        );

      const reportId =
        result.report?._id ||
        "";

      const duplicate =
        result.potentialDuplicate
          ? "true"
          : "false";

      resetDraft();

      router.replace({
        pathname:
          "/community/report/success",

        params: {
          reportId,
          duplicate,
        },
      });
    } catch (error: any) {
      Alert.alert(
        "Submission Failed",
        error?.message ||
          "Unable to submit the report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 130,
        }}
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text className="text-[26px] font-bold text-slate-900">
          Review your report
        </Text>

        <Text className="mt-2 text-sm leading-6 text-slate-500">
          Check the information below
          before submitting it to
          wildlife personnel.
        </Text>

        {/* Conflict Type */}

        <ReviewCard
          icon={
            TriangleAlert
          }
          iconColor="#D97706"
          title="Conflict Type"
          value={getConflictTypeLabel(
            draft.conflictType
          )}
          onEdit={() =>
            router.push(
              "/community/report"
            )
          }
        />

        {/* Location */}

        <ReviewCard
          icon={MapPin}
          iconColor="#2563EB"
          title="Location"
          value={
            draft.location.source ===
            "GPS"
              ? `${draft.location.latitude?.toFixed(
                  6
                )}, ${draft.location.longitude?.toFixed(
                  6
                )}`
              : draft.location
                  .manualLocation ||
                "Not provided"
          }
          secondaryValue={
            draft.location.source ===
            "GPS"
              ? "GPS Location"
              : "Manual Location"
          }
          onEdit={() =>
            router.push(
              "/community/report/location"
            )
          }
        />

        {/* Description */}

        <ReviewCard
          icon={FileText}
          iconColor="#0F766E"
          title="Conflict Details"
          value={
            draft.description
          }
          onEdit={() =>
            router.push(
              "/community/report/details"
            )
          }
        />

        {/* Evidence */}

        <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
              <ImageIcon
                size={19}
                color="#7C3AED"
              />
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-xs font-semibold text-slate-400">
                Supporting Evidence
              </Text>

              <Text className="mt-1 text-sm font-bold text-slate-800">
                {
                  draft.evidence
                    .length
                }{" "}
                image
                {draft.evidence
                  .length ===
                1
                  ? ""
                  : "s"}
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push(
                  "/community/report/evidence"
                )
              }
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
            >
              <Pencil
                size={16}
                color="#475569"
              />
            </Pressable>
          </View>

          {draft.evidence.length >
            0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              className="mt-4"
            >
              <View className="flex-row gap-3">
                {draft.evidence.map(
                  (
                    item,
                    index
                  ) => (
                    <Image
                      key={`${item.uri}-${index}`}
                      source={{
                        uri:
                          item.uri,
                      }}
                      className="h-24 w-24 rounded-xl"
                    />
                  )
                )}
              </View>
            </ScrollView>
          )}

          {draft.evidence.length ===
            0 && (
            <Text className="mt-3 text-xs text-slate-400">
              No evidence was
              attached. This is
              optional.
            </Text>
          )}
        </View>

        {/* Submission notice */}

        <View className="mt-5 flex-row rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <ShieldCheck
            size={20}
            color="#0F766E"
          />

          <Text className="ml-3 flex-1 text-xs leading-5 text-teal-800">
            After submission, the
            report will be available
            to authorized wildlife
            personnel for review and
            response.
          </Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 pb-5 pt-4">
        <Pressable
          onPress={
            handleSubmit
          }
          disabled={
            submitting
          }
          className={`h-14 flex-row items-center justify-center rounded-2xl ${
            submitting
              ? "bg-teal-500"
              : "bg-teal-700"
          }`}
        >
          {submitting ? (
            <>
              <LoaderCircle
                size={20}
                color="#FFFFFF"
              />

              <Text className="ml-2 text-base font-bold text-white">
                Submitting...
              </Text>
            </>
          ) : (
            <>
              <CheckCircle2
                size={20}
                color="#FFFFFF"
              />

              <Text className="ml-2 text-base font-bold text-white">
                Submit Report
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function ReviewCard({
  icon: Icon,
  iconColor,
  title,
  value,
  secondaryValue,
  onEdit,
}: {
  icon: any;
  iconColor: string;
  title: string;
  value: string;
  secondaryValue?: string;
  onEdit: () => void;
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

          {secondaryValue && (
            <Text className="mt-1 text-[11px] font-semibold text-blue-600">
              {
                secondaryValue
              }
            </Text>
          )}

          <Text className="mt-1 text-sm leading-6 text-slate-800">
            {value}
          </Text>
        </View>

        <Pressable
          onPress={onEdit}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
        >
          <Pencil
            size={16}
            color="#475569"
          />
        </Pressable>
      </View>
    </View>
  );
}