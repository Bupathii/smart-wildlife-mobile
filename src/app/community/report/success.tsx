import {
    Text,
    View,
} from "react-native";

export default function SuccessScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-teal-700">
        Report Submitted
      </Text>
    </View>
  );
}