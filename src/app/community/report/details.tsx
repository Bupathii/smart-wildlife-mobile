import {
    FileText,
    Info,
} from "lucide-react-native";

import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    router,
} from "expo-router";

import {
    useState,
} from "react";

import {
    useConflictReport,
} from "@/context/ConflictReportContext";

const MAX_LENGTH = 1500;

export default function ConflictDetailsScreen() {
  const {
    draft,
    setDescription,
  } = useConflictReport();

  const [
    description,
    setLocalDescription,
  ] = useState(
    draft.description
  );

  function handleContinue() {
    const cleaned =
      description.trim();

    if (cleaned.length < 5) {
      Alert.alert(
        "More Details Required",
        "Please provide a short description of what happened."
      );

      return;
    }

    setDescription(cleaned);

    router.push(
      "/community/report/evidence"
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text className="text-[26px] font-bold text-slate-900">
          Tell us what happened
        </Text>

        <Text className="mt-2 text-sm leading-6 text-slate-500">
          Provide clear information
          that can help wildlife
          personnel understand the
          situation.
        </Text>

        <View className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <FileText
                size={20}
                color="#2563EB"
              />
            </View>

            <View className="ml-3">
              <Text className="text-sm font-bold text-slate-800">
                Conflict description
              </Text>

              <Text className="mt-0.5 text-xs text-slate-400">
                Minimum 5 characters
              </Text>
            </View>
          </View>

          <TextInput
            value={description}
            onChangeText={(value) => {
              if (
                value.length <=
                MAX_LENGTH
              ) {
                setLocalDescription(
                  value
                );
              }
            }}
            multiline
            textAlignVertical="top"
            placeholder="Example: An elephant was seen close to houses near the village road..."
            placeholderTextColor="#94A3B8"
            className="mt-4 min-h-40 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-800"
          />

          <Text className="mt-2 text-right text-xs text-slate-400">
            {description.length}/
            {MAX_LENGTH}
          </Text>
        </View>

        <View className="mt-4 flex-row rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <Info
            size={18}
            color="#2563EB"
          />

          <Text className="ml-3 flex-1 text-xs leading-5 text-blue-700">
            Include useful details such
            as what the animal was
            doing, whether crops or
            property were affected, and
            whether the animal is still
            nearby.
          </Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 pb-5 pt-4">
        <Pressable
          onPress={
            handleContinue
          }
          className={`h-14 items-center justify-center rounded-2xl ${
            description.trim()
              .length >= 5
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