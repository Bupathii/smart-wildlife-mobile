import { useMemo } from "react";
import { useAppTheme } from "@/theme/ThemeContext";

/**
 * Applies the WildSentinel palette to pre-existing React Native StyleSheet screens.
 * Only neutral backgrounds, borders and foreground text are remapped; bright
 * severity colors and functional button states remain unchanged.
 */
export function useThemedStyles<T extends Record<string, any>>(styles: T): T {
  const { dark, colors } = useAppTheme();
  return useMemo(() => {
    if (!dark) return styles;
    const backgroundMap: Record<string, string> = {
      "#ffffff": colors.surface, "#fff": colors.surface,
      "#f8fafc": colors.background, "#f5f7f5": colors.background,
      "#f1f5f9": colors.surfaceAlt, "#eef7ee": colors.background,
      "#f0fdf4": colors.surfaceAlt, "#ecfdf5": colors.surfaceAlt,
      "#eff6ff": colors.surfaceAlt, "#e2e8f0": colors.surfaceAlt,
      "#dcfce7": colors.softGreen, "#f0fdfa": colors.surfaceAlt,
    };
    const foregroundMap: Record<string, string> = {
      "#0f172a": colors.text, "#1e293b": colors.text,
      "#334155": colors.text, "#14532d": colors.primary,
      "#166534": colors.primary, "#0f766e": colors.primary,
      "#64748b": colors.muted, "#475569": colors.muted,
      "#94a3b8": colors.muted,
    };
    const borderMap: Record<string, string> = {
      "#e2e8f0": colors.border, "#cbd5e1": colors.border,
      "#e5e7eb": colors.border, "#d1d5db": colors.border,
      "#bbf7d0": colors.border,
    };
    const out: Record<string, any> = {};
    for (const [name, style] of Object.entries(styles)) {
      const remapped = { ...style };
      for (const [key, value] of Object.entries(remapped)) {
        if (typeof value !== "string") continue;
        const normalized = value.toLowerCase();
        if (key === "backgroundColor" && backgroundMap[normalized]) remapped[key] = backgroundMap[normalized];
        if (key === "color" && foregroundMap[normalized]) remapped[key] = foregroundMap[normalized];
        if (key.toLowerCase().includes("border") && key.toLowerCase().includes("color") && borderMap[normalized]) remapped[key] = borderMap[normalized];
      }
      out[name] = remapped;
    }
    return out as T;
  }, [styles, dark, colors]);
}
