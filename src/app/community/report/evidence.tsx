import {
    Camera,
    ImagePlus,
    Images,
    Info,
    Trash2,
} from "lucide-react-native";

import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import {
    router,
} from "expo-router";

import * as ImagePicker from "expo-image-picker";

import {
    useConflictReport,
} from "@/context/ConflictReportContext";

import {
    EvidenceItem,
} from "@/types/conflict";

const MAX_EVIDENCE = 5;

export default function EvidenceScreen() {
  const {
    draft,
    setEvidence,
  } = useConflictReport();

  const remaining =
    MAX_EVIDENCE -
    draft.evidence.length;

  function convertAsset(
    asset:
      ImagePicker.ImagePickerAsset
  ): EvidenceItem {
    const fallbackName =
      `evidence-${Date.now()}.jpg`;

    return {
      uri: asset.uri,

      fileName:
        asset.fileName ||
        fallbackName,

      mimeType:
        asset.mimeType ||
        "image/jpeg",
    };
  }

  async function selectFromGallery() {
    if (remaining <= 0) {
      Alert.alert(
        "Maximum Reached",
        "You can attach up to 5 evidence images."
      );

      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (
      permission.status !==
      "granted"
    ) {
      Alert.alert(
        "Permission Required",
        "Photo library permission is required to select evidence."
      );

      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes: [
            "images",
          ],

          allowsMultipleSelection:
            true,

          selectionLimit:
            remaining,

          quality: 0.8,
        }
      );

    if (result.canceled) {
      return;
    }

    const newItems =
      result.assets.map(
        convertAsset
      );

    const existingUris =
      new Set(
        draft.evidence.map(
          (item) =>
            item.uri
        )
      );

    const uniqueItems =
      newItems.filter(
        (item) =>
          !existingUris.has(
            item.uri
          )
      );

    setEvidence([
      ...draft.evidence,
      ...uniqueItems,
    ].slice(0, MAX_EVIDENCE));
  }

  async function takePhoto() {
    if (remaining <= 0) {
      Alert.alert(
        "Maximum Reached",
        "You can attach up to 5 evidence images."
      );

      return;
    }

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (
      permission.status !==
      "granted"
    ) {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take an evidence photo."
      );

      return;
    }

    const result =
      await ImagePicker.launchCameraAsync(
        {
          mediaTypes: [
            "images",
          ],

          allowsEditing: false,

          quality: 0.8,
        }
      );

    if (result.canceled) {
      return;
    }

    const asset =
      result.assets[0];

    if (!asset) {
      return;
    }

    setEvidence([
      ...draft.evidence,
      convertAsset(asset),
    ].slice(0, MAX_EVIDENCE));
  }

  function removeEvidence(
    index: number
  ) {
    const updated =
      draft.evidence.filter(
        (_, itemIndex) =>
          itemIndex !== index
      );

    setEvidence(updated);
  }

  function handleContinue() {
    router.push(
      "/community/report/review"
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 125,
        }}
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text className="text-[26px] font-bold text-slate-900">
          Add supporting evidence
        </Text>

        <Text className="mt-2 text-sm leading-6 text-slate-500">
          Add photos if available.
          Evidence is optional and you
          can continue without adding
          any images.
        </Text>

        <View className="mt-6 flex-row rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <Info
            size={18}
            color="#2563EB"
          />

          <Text className="ml-3 flex-1 text-xs leading-5 text-blue-700">
            You can add up to 5 images.
            Only add evidence when it is
            safe to capture or select it.
          </Text>
        </View>

        {/* Actions */}

        <View className="mt-5 flex-row gap-3">
          <Pressable
            onPress={
              selectFromGallery
            }
            disabled={
              remaining <= 0
            }
            className={`flex-1 rounded-2xl border p-4 ${
              remaining > 0
                ? "border-teal-200 bg-white"
                : "border-slate-200 bg-slate-100"
            }`}
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
              <Images
                size={21}
                color="#0F766E"
              />
            </View>

            <Text className="mt-3 text-sm font-bold text-slate-800">
              Gallery
            </Text>

            <Text className="mt-1 text-xs leading-4 text-slate-500">
              Select one or multiple
              photos
            </Text>
          </Pressable>

          <Pressable
            onPress={takePhoto}
            disabled={
              remaining <= 0
            }
            className={`flex-1 rounded-2xl border p-4 ${
              remaining > 0
                ? "border-blue-200 bg-white"
                : "border-slate-200 bg-slate-100"
            }`}
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Camera
                size={21}
                color="#2563EB"
              />
            </View>

            <Text className="mt-3 text-sm font-bold text-slate-800">
              Camera
            </Text>

            <Text className="mt-1 text-xs leading-4 text-slate-500">
              Capture a new evidence
              photo
            </Text>
          </Pressable>
        </View>

        {/* Counter */}

        <View className="mt-6 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-slate-800">
            Selected evidence
          </Text>

          <Text className="text-xs font-semibold text-slate-500">
            {draft.evidence.length}/
            {MAX_EVIDENCE}
          </Text>
        </View>

        {/* Empty */}

        {draft.evidence.length ===
          0 && (
          <View className="mt-3 items-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <ImagePlus
                size={22}
                color="#64748B"
              />
            </View>

            <Text className="mt-3 text-sm font-bold text-slate-700">
              No evidence added
            </Text>

            <Text className="mt-1 text-center text-xs leading-5 text-slate-400">
              Evidence is optional.
              You can continue to review
              the report.
            </Text>
          </View>
        )}

        {/* Image grid */}

        {draft.evidence.length >
          0 && (
          <View className="mt-3 flex-row flex-wrap gap-3">
            {draft.evidence.map(
              (
                item,
                index
              ) => (
                <View
                  key={`${item.uri}-${index}`}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  style={{
                    width:
                      "47%",
                  }}
                >
                  <Image
                    source={{
                      uri:
                        item.uri,
                    }}
                    resizeMode="cover"
                    className="h-32 w-full"
                  />

                  <View className="p-3">
                    <Text
                      numberOfLines={
                        1
                      }
                      className="text-xs font-semibold text-slate-700"
                    >
                      {
                        item.fileName
                      }
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      removeEvidence(
                        index
                      )
                    }
                    className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full bg-slate-900/80"
                  >
                    <Trash2
                      size={16}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </View>
              )
            )}
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 pb-5 pt-4">
        <Pressable
          onPress={
            handleContinue
          }
          className="h-14 items-center justify-center rounded-2xl bg-teal-700"
        >
          <Text className="text-base font-bold text-white">
            {draft.evidence.length >
            0
              ? "Continue"
              : "Continue Without Evidence"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}