import {
    Text,
    View,
} from "react-native";

export default function EvidenceScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <Text className="text-xl font-bold text-slate-800">
        Supporting Evidence
      </Text>

      <Text className="mt-2 text-center text-sm text-slate-500">
        Multiple evidence upload will
        be added in the next step.
      </Text>
    </View>
  );
}