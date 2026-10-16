import { useMemo } from "react";
import { useAppTheme } from "@/theme/ThemeContext";

/** Purely visual palette adapter for established StyleSheet-based workflows.
 * Buttons, validation, navigation and every domain action remain unchanged.
 */
export function useThemedStyles<T extends Record<string, any>>(styles: T): T {
  const { colors, dark } = useAppTheme();
  return useMemo(() => {
    const backgroundMap: Record<string, string> = {
      "#ffffff": colors.surface, "#fff": colors.surface,
      "#f8fafc": colors.background, "#f5f7f5": colors.background,
      "#f1f5f9": colors.surfaceAlt, "#eef7ee": colors.background,
      "#f0fdf4": colors.surfaceAlt, "#ecfdf5": colors.surfaceAlt,
      "#eff6ff": colors.surfaceAlt, "#e2e8f0": colors.surfaceAlt,
      "#dcfce7": colors.softGreen, "#f0fdfa": colors.surfaceAlt,
      "#f9fafb": colors.background, "#f1f8f3": colors.surfaceAlt,
    };
    const foregroundMap: Record<string, string> = {
      "#0f172a": colors.text, "#1e293b": colors.text,
      "#334155": colors.text, "#14532d": colors.text,
      "#166534": colors.primary, "#0f766e": colors.primary,
      "#64748b": colors.muted, "#475569": colors.muted,
      "#94a3b8": colors.muted,
    };
    const borderMap: Record<string, string> = {
      "#e2e8f0": colors.border, "#cbd5e1": colors.border,
      "#e5e7eb": colors.border, "#d1d5db": colors.border,
      "#bbf7d0": colors.border,
    };
    const updated: Record<string, any> = {};
    for (const [name, style] of Object.entries(styles)) {
      const mapped: Record<string, any> = { ...style };
      for (const [key, val] of Object.entries(mapped)) {
        if (typeof val !== "string") continue;
        const lower = val.toLowerCase();
        if (key === "backgroundColor" && backgroundMap[lower]) mapped[key] = backgroundMap[lower];
        if (key === "color" && foregroundMap[lower]) mapped[key] = foregroundMap[lower];
        if (key.toLowerCase().includes("border") && key.toLowerCase().includes("color") && borderMap[lower]) mapped[key] = borderMap[lower];
      }
      if (/card|tile|panel/i.test(name) && typeof mapped.borderRadius === "number" && mapped.borderRadius >= 10 && mapped.borderRadius <= 20) {
        mapped.borderRadius += 3;
      }
      if (/card$/i.test(name) && mapped.backgroundColor === colors.surface && !dark) {
        mapped.shadowColor ??= colors.shadow;
        mapped.shadowOpacity ??= .04;
        mapped.shadowRadius ??= 12;
        mapped.shadowOffset ??= { width: 0, height: 4 };
        mapped.elevation ??= 2;
      }
      updated[name] = mapped;
    }
    return updated as T;
  }, [styles, colors, dark]);
}
