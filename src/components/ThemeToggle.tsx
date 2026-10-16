import { Moon, Sun } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";

export function ThemeToggle({ compact = false, header = false }: { compact?: boolean; header?: boolean }) {
  const { dark, colors, toggle } = useAppTheme();
  const foreground = header ? "#FFFFFF" : colors.text;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Switch to ${dark ? "light" : "dark"} mode`}
      onPress={toggle}
      style={{ flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: compact ? 10 : 15,
        paddingVertical: 11, borderRadius: 14, backgroundColor: header ? "rgba(255,255,255,0.15)" : colors.surfaceAlt,
        borderWidth: header ? 0 : 1, borderColor: colors.border }}>
      {dark ? <Sun size={19} color={foreground} /> : <Moon size={19} color={foreground} />}
      {!compact && <Text style={{ color: foreground, fontSize: 13, fontWeight: "700" }}>
        {dark ? "Light mode" : "Dark mode"}
      </Text>}
    </Pressable>
  );
}
