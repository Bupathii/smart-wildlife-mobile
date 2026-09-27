import {
    CheckCircle2,
    ClipboardList,
    Home,
    Link2,
    PlusCircle,
} from "lucide-react-native";

import {
    Pressable,
    Text,
    View,
} from "react-native";

import {
    router,
    useLocalSearchParams,
} from "expo-router";

import {
    useConflictReport,
} from "@/context/ConflictReportContext";

export default function SuccessScreen() {
  const {
    reportId,
    duplicate,
  } =
    useLocalSearchParams<{
      reportId?: string;
      duplicate?: string;
    }>();

  const {
    resetDraft,
  } = useConflictReport();

  const isPotentialDuplicate =
    duplicate === "true";

  function handleNewReport() {
    /*
     * Create a clean report draft
     * including a new clientReportId.
     */
    resetDraft();

    /*
     * Return to the first screen
     * of Report Conflict flow.
     */
    router.replace(
      "/community/report"
    );
  }

  function handleMyReports() {
    router.replace(
      "/community/reports"
    );
  }

  function handleHome() {
    router.replace(
      "/community"
    );
  }

  return (
    <View className="flex-1 bg-slate-50 px-5">
      <View className="flex-1 items-center justify-center">
        {/* Success icon */}

        <View className="h-24 w-24 items-center justify-center rounded-full bg-teal-100">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-teal-700">
            <CheckCircle2
              size={34}
              color="#FFFFFF"
              strokeWidth={2.5}
            />
          </View>
        </View>

        {/* Title */}

        <Text className="mt-7 text-center text-[27px] font-bold text-slate-900">
          Report submitted
        </Text>

        <Text className="mt-3 max-w-sm text-center text-sm leading-6 text-slate-500">
          Your human-wildlife conflict
          report has been submitted
          successfully and is available
          for wildlife personnel to
          review.
        </Text>

        {/* Reference */}

        {reportId && (
          <View className="mt-6 w-full rounded-2xl border border-slate-200 bg-white p-5">
            <Text className="text-center text-xs font-semibold text-slate-400">
              Report Reference
            </Text>

            <Text
              numberOfLines={1}
              className="mt-2 text-center text-sm font-bold text-slate-700"
            >
              {reportId}
            </Text>
          </View>
        )}

        {/* Duplicate information */}

        {isPotentialDuplicate && (
          <View className="mt-4 w-full flex-row rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <Link2
              size={18}
              color="#2563EB"
            />

            <Text className="ml-3 flex-1 text-xs leading-5 text-blue-700">
              A similar recent report was
              found. Your report was still
              submitted successfully and
              linked for staff review.
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}

      <View className="pb-7">
        {/* New Report */}

        <Pressable
          onPress={
            handleNewReport
          }
          className="h-14 flex-row items-center justify-center rounded-2xl bg-teal-700"
        >
          <PlusCircle
            size={20}
            color="#FFFFFF"
          />

          <Text className="ml-2 text-base font-bold text-white">
            Report Another Conflict
          </Text>
        </Pressable>

        {/* My Reports */}

        <Pressable
          onPress={
            handleMyReports
          }
          className="mt-3 h-14 flex-row items-center justify-center rounded-2xl border border-teal-200 bg-teal-50"
        >
          <ClipboardList
            size={19}
            color="#0F766E"
          />

          <Text className="ml-2 text-base font-bold text-teal-800">
            View My Reports
          </Text>
        </Pressable>

        {/* Home */}

        <Pressable
          onPress={
            handleHome
          }
          className="mt-3 h-14 flex-row items-center justify-center rounded-2xl border border-slate-200 bg-white"
        >
          <Home
            size={19}
            color="#475569"
          />

          <Text className="ml-2 text-base font-bold text-slate-700">
            Back to Home
          </Text>
        </Pressable>
      </View>
    </View>
  );
}