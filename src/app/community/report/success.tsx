import {
  CheckCircle2,
  ClipboardList,
  CloudOff,
  Home,
  Link2,
  PlusCircle,
  RefreshCw,
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
    offline,
  } =
    useLocalSearchParams<{
      reportId?: string;
      duplicate?: string;
      offline?: string;
    }>();

  const {
    resetDraft,
  } = useConflictReport();

  const isPotentialDuplicate =
    duplicate === "true";

  const savedOffline =
    offline === "true";

  function handleNewReport() {
    resetDraft();

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
        {/* Icon */}

        <View
          className={`h-24 w-24 items-center justify-center rounded-full ${
            savedOffline
              ? "bg-blue-100"
              : "bg-teal-100"
          }`}
        >
          <View
            className={`h-16 w-16 items-center justify-center rounded-full ${
              savedOffline
                ? "bg-blue-700"
                : "bg-teal-700"
            }`}
          >
            {savedOffline ? (
              <CloudOff
                size={32}
                color="#FFFFFF"
                strokeWidth={2.3}
              />
            ) : (
              <CheckCircle2
                size={34}
                color="#FFFFFF"
                strokeWidth={2.5}
              />
            )}
          </View>
        </View>

        {/* Title */}

        <Text className="mt-7 text-center text-[27px] font-bold text-slate-900">
          {savedOffline
            ? "Report saved offline"
            : "Report submitted"}
        </Text>

        {/* Description */}

        <Text className="mt-3 max-w-sm text-center text-sm leading-6 text-slate-500">
          {savedOffline
            ? "Internet access is currently unavailable. Your report has been stored safely on this device and will synchronize automatically when connectivity returns."
            : "Your human-wildlife conflict report has been submitted successfully and is available for wildlife personnel to review."}
        </Text>

        {/* Offline information */}

        {savedOffline && (
          <View className="mt-6 w-full flex-row rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <RefreshCw
              size={19}
              color="#2563EB"
            />

            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-blue-900">
                Waiting to synchronize
              </Text>

              <Text className="mt-1 text-xs leading-5 text-blue-700">
                You can view this report
                under My Reports with a
                Pending Sync status.
                Internet connectivity is
                required before wildlife
                personnel can receive it.
              </Text>
            </View>
          </View>
        )}

        {/* Online reference */}

        {reportId &&
          !savedOffline && (
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

        {/* Potential duplicate */}

        {isPotentialDuplicate &&
          !savedOffline && (
            <View className="mt-4 w-full flex-row rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <Link2
                size={18}
                color="#2563EB"
              />

              <Text className="ml-3 flex-1 text-xs leading-5 text-blue-700">
                A similar recent report
                was found. Your report
                was still submitted and
                linked with the related
                report for staff review.
              </Text>
            </View>
          )}
      </View>

      {/* Buttons */}

      <View className="pb-7">
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