import { MoonStar, Sun } from "lucide-react-native";
import { Text } from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";
import { SpringPressable } from "@/components/premium/Motion";

export function ThemeToggle({ compact = false, header = false }: { compact?: boolean; header?: boolean }) {
  const { dark, colors, toggle } = useAppTheme();
  const foreground = header ? "#F9FAF5" : colors.primary;
  return (
    <SpringPressable accessibilityRole="button" accessibilityLabel={`Switch to ${dark ? "light" : "dark"} mode`}
      accessibilityHint="Toggle the WildSentinel color theme" onPress={toggle}
      style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9,
        paddingHorizontal: compact ? 12 : 16, minWidth: compact ? 43 : undefined,
        height: 43, borderRadius: 15, backgroundColor: header ? "rgba(255,255,255,0.14)" : colors.surface,
        borderWidth: 1, borderColor: header ? "rgba(255,255,255,0.18)" : colors.border }}>
      {dark ? <Sun size={18} color={foreground} strokeWidth={2} /> : <MoonStar size={18} color={foreground} strokeWidth={2} />}
      {!compact && <Text style={{ color: foreground, fontSize: 12.5, fontWeight: "800" }}>
        {dark ? "Light mode" : "Dark mode"}
      </Text>}
    </SpringPressable>
  );
}
