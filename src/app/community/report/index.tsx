import {
    Binoculars,
    ChevronRight,
    TriangleAlert,
    Wheat,
} from "lucide-react-native";

import {
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import {
    router,
} from "expo-router";

import {
    useConflictReport,
} from "@/context/ConflictReportContext";

import {
    ConflictType,
} from "@/types/conflict";

const conflictTypes: {
  value: ConflictType;
  title: string;
  description: string;
  icon: any;
  iconColor: string;
  iconBackground: string;
}[] = [
  {
    value:
      "ELEPHANT_SIGHTING",

    title:
      "Elephant Sighting",

    description:
      "Report an elephant seen near a village, road, farmland or community area.",

    icon:
      Binoculars,

    iconColor:
      "#2563EB",

    iconBackground:
      "#EFF6FF",
  },

  {
    value:
      "CROP_RAIDING",

    title:
      "Crop Raiding",

    description:
      "Report wildlife entering farmland or damaging crops.",

    icon:
      Wheat,

    iconColor:
      "#0F766E",

    iconBackground:
      "#ECFDF5",
  },

  {
    value:
      "OTHER",

    title:
      "Other Conflict",

    description:
      "Report another human-wildlife conflict or potential wildlife risk.",

    icon:
      TriangleAlert,

    iconColor:
      "#D97706",

    iconBackground:
      "#FFFBEB",
  },
];

export default function ConflictTypeScreen() {
  const {
    draft,
    setConflictType,
  } = useConflictReport();

  function handleContinue() {
    if (!draft.conflictType) {
      return;
    }

    router.push(
      "/community/report/location"
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text className="text-[26px] font-bold text-slate-900">
          What happened?
        </Text>

        <Text className="mt-2 text-sm leading-6 text-slate-500">
          Select the type of
          human-wildlife conflict you
          want to report.
        </Text>

        <StepIndicator
          current={1}
        />

        <View className="mt-6 gap-3">
          {conflictTypes.map(
            (item) => {
              const selected =
                draft.conflictType ===
                item.value;

              const Icon =
                item.icon;

              return (
                <Pressable
                  key={
                    item.value
                  }
                  onPress={() =>
                    setConflictType(
                      item.value
                    )
                  }
                  className={`rounded-2xl border p-4 ${
                    selected
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <View className="flex-row items-center">
                    <View
                      style={{
                        backgroundColor:
                          selected
                            ? "#0F766E"
                            : item.iconBackground,
                      }}
                      className="h-12 w-12 items-center justify-center rounded-xl"
                    >
                      <Icon
                        size={22}
                        color={
                          selected
                            ? "#FFFFFF"
                            : item.iconColor
                        }
                        strokeWidth={
                          2
                        }
                      />
                    </View>

                    <View className="ml-4 flex-1">
                      <Text
                        className={`text-base font-bold ${
                          selected
                            ? "text-teal-900"
                            : "text-slate-800"
                        }`}
                      >
                        {
                          item.title
                        }
                      </Text>

                      <Text className="mt-1 text-xs leading-5 text-slate-500">
                        {
                          item.description
                        }
                      </Text>
                    </View>

                    <ChevronRight
                      size={20}
                      color={
                        selected
                          ? "#0F766E"
                          : "#94A3B8"
                      }
                    />
                  </View>
                </Pressable>
              );
            }
          )}
        </View>

        <View className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <View className="flex-row">
            <TriangleAlert
              size={19}
              color="#2563EB"
            />

            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-blue-900">
                Stay safe
              </Text>

              <Text className="mt-1 text-xs leading-5 text-blue-700">
                Do not approach
                wildlife. Report the
                incident from a safe
                location.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 pb-5 pt-4">
        <Pressable
          disabled={
            !draft.conflictType
          }
          onPress={
            handleContinue
          }
          className={`h-14 items-center justify-center rounded-2xl ${
            draft.conflictType
              ? "bg-teal-700"
              : "bg-slate-300"
          }`}
        >
          <Text className="text-base font-bold text-white">
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function StepIndicator({
  current,
}: {
  current: number;
}) {
  const steps = [
    "Type",
    "Location",
    "Details",
    "Evidence",
    "Review",
  ];

  return (
    <View className="mt-7 flex-row items-start">
      {steps.map(
        (step, index) => {
          const number =
            index + 1;

          const active =
            number <= current;

          return (
            <View
              key={step}
              className="flex-1 items-center"
            >
              <View className="w-full flex-row items-center">
                {index > 0 && (
                  <View
                    className={`h-[2px] flex-1 ${
                      number <=
                      current
                        ? "bg-teal-500"
                        : "bg-slate-200"
                    }`}
                  />
                )}

                <View
                  className={`h-7 w-7 items-center justify-center rounded-full ${
                    active
                      ? "bg-teal-700"
                      : "bg-slate-200"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      active
                        ? "text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {number}
                  </Text>
                </View>

                {index <
                  steps.length -
                    1 && (
                  <View
                    className={`h-[2px] flex-1 ${
                      number <
                      current
                        ? "bg-teal-500"
                        : "bg-slate-200"
                    }`}
                  />
                )}
              </View>

              <Text
                className={`mt-1 text-[9px] ${
                  number ===
                  current
                    ? "font-bold text-teal-700"
                    : "text-slate-400"
                }`}
              >
                {step}
              </Text>
            </View>
          );
        }
      )}
    </View>
  );
}