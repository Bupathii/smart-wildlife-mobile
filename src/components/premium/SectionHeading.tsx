import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";
export function SectionHeading({ title, caption, aside }: { title: string; caption?: string; aside?: ReactNode }) {
  const { colors } = useAppTheme();
  return <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900", letterSpacing: -.65 }}>{title}</Text>
      {caption ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 5, lineHeight: 18 }}>{caption}</Text> : null}
    </View>
    {aside}
  </View>;
}
