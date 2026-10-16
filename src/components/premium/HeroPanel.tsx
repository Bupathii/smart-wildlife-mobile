import { type ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { Reveal } from "@/components/premium/Motion";

/** SVG vector ambience: text is laid out above the decoration and never overlaps it. */
export function HeroPanel({ eyebrow, title, description, footer, compact = false }: {
  eyebrow: string; title: string; description: string; footer?: ReactNode; compact?: boolean;
}) {
  return (
    <Reveal>
      <View style={{ borderRadius: 28, overflow: "hidden", backgroundColor: "#0B372F", minHeight: compact ? 180 : 226,
        shadowColor: "#0E493B", shadowOffset: { width: 0, height: 12 }, shadowRadius: 22,
        shadowOpacity: .2, elevation: 7 }}>
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 360 235" preserveAspectRatio="xMidYMid slice">
          <Defs><LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#145A48" /><Stop offset="0.55" stopColor="#0A382F" />
            <Stop offset="1" stopColor="#061F1C" /></LinearGradient></Defs>
          <Rect width="360" height="235" fill="url(#hero)" />
          <Circle cx="341" cy="37" r="101" fill="#5DBF92" opacity="0.085" />
          <Circle cx="329" cy="61" r="78" stroke="#B8DDC9" strokeWidth="1" opacity=".23" fill="none" />
          <Circle cx="329" cy="61" r="58" stroke="#EBC889" strokeWidth="1.5" opacity=".28" fill="none" />
          <Circle cx="329" cy="61" r="7" fill="#EBC889" opacity=".85" />
          <Path d="M0 202 C80 162 142 240 215 196 S324 185 360 145" fill="none" stroke="#B9CF9B" strokeWidth="1" opacity=".18" />
          <Path d="M0 213 C90 175 158 248 250 212 S336 198 360 180" fill="none" stroke="#8FD6B3" strokeWidth="2" opacity=".12" />
          <Circle cx="290" cy="201" r="2" fill="#EAC482" />
          <Circle cx="304" cy="182" r="2" fill="#EAC482" opacity=".6" />
        </Svg>
        <View style={{ paddingHorizontal: 23, paddingVertical: compact ? 21 : 25, position: "relative" }}>
          <View style={{ alignSelf: "flex-start", paddingHorizontal: 11, paddingVertical: 7,
            borderRadius: 99, borderWidth: 1, borderColor: "rgba(234,196,130,.35)",
            backgroundColor: "rgba(234,196,130,.10)", marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 7 }}>
            <View style={{ backgroundColor: "#EAC482", width: 5, height: 5, borderRadius: 3 }} />
            <Text style={{ color: "#F0D9AA", fontSize: 9, fontWeight: "900", letterSpacing: 2 }}>{eyebrow.toUpperCase()}</Text>
          </View>
          <Text style={{ color: "#FFFDF7", fontSize: compact ? 24 : 29, fontWeight: "900", maxWidth: "93%", letterSpacing: -1.1,
            lineHeight: compact ? 30 : 35 }}>{title}</Text>
          <Text style={{ color: "#C1D8CB", fontSize: 12.5, lineHeight: 20, marginTop: 11, maxWidth: "85%" }}>{description}</Text>
          {footer ? <View style={{ marginTop: 19 }}>{footer}</View> : null}
        </View>
        <Image source={require("../../../assets/brand/wildsentinel-mark.png")}
          style={{ position: "absolute", right: 3, bottom: -48, width: 98, height: 100, opacity: .15 }} resizeMode="contain" />
      </View>
    </Reveal>
  );
}
