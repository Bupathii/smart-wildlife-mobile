import { useThemedStyles } from "@/theme/useThemedStyles";
import { router } from "expo-router";
import { ChevronRight, FileWarning, FolderOpen } from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";

/** Simple SVG wildlife silhouette banner matching the green theme */
function WildlifeBanner() {
  const themedStyles = useThemedStyles(styles);
  return (
    <View style={themedStyles.bannerContainer}>
      {/* gradient-ish background */}
      <View style={themedStyles.bannerBg} />
      {/* decorative SVG scene */}
      <Svg
        width="100%"
        height="160"
        viewBox="0 0 340 160"
        style={StyleSheet.absoluteFill}
      >
        {/* sky */}
        <Path d="M0 0h340v160H0z" fill="#c8e6c8" />
        {/* sun */}
        <Circle cx="280" cy="38" r="22" fill="#e8f5e8" />
        {/* birds */}
        <Path
          d="M230 28 c3-3 6-3 9 0 M244 24 c3-3 6-3 9 0 M258 20 c3-3 6-3 9 0"
          stroke="#6aab6a"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* far hills */}
        <Path d="M0 90 Q60 55 120 80 Q180 55 240 78 Q290 55 340 75 L340 160 L0 160Z" fill="#8fbb8f" />
        {/* near hills */}
        <Path d="M0 110 Q70 80 140 100 Q210 78 280 98 Q310 86 340 95 L340 160 L0 160Z" fill="#5a9a5a" />
        {/* trees left */}
        <G>
          <Path d="M18 160 L18 130" stroke="#3d7a3d" strokeWidth="3" />
          <Path d="M8 140 Q18 110 28 140Z" fill="#3d7a3d" />
          <Path d="M10 132 Q18 105 26 132Z" fill="#4e8b4e" />
        </G>
        <G>
          <Path d="M42 160 L42 125" stroke="#3d7a3d" strokeWidth="3" />
          <Path d="M30 138 Q42 105 54 138Z" fill="#3d7a3d" />
          <Path d="M32 128 Q42 100 52 128Z" fill="#4e8b4e" />
        </G>
        {/* trees right */}
        <G>
          <Path d="M298 160 L298 128" stroke="#3d7a3d" strokeWidth="3" />
          <Path d="M286 142 Q298 108 310 142Z" fill="#3d7a3d" />
          <Path d="M288 132 Q298 104 308 132Z" fill="#4e8b4e" />
        </G>
        <G>
          <Path d="M320 160 L320 132" stroke="#3d7a3d" strokeWidth="3" />
          <Path d="M310 144 Q320 114 330 144Z" fill="#3d7a3d" />
          <Path d="M312 135 Q320 108 328 135Z" fill="#4e8b4e" />
        </G>
        {/* deer */}
        <G>
          {/* body */}
          <Ellipse cx="188" cy="128" rx="18" ry="10" fill="#2d6a2d" />
          {/* neck */}
          <Path d="M198 120 Q202 108 200 100" stroke="#2d6a2d" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* head */}
          <Ellipse cx="200" cy="98" rx="7" ry="6" fill="#2d6a2d" />
          {/* antlers */}
          <Path d="M198 93 Q194 83 190 78 M198 93 Q202 82 206 77" stroke="#2d6a2d" strokeWidth="2" strokeLinecap="round" fill="none" />
          <Path d="M190 78 Q187 74 184 74 M190 78 Q191 73 194 71" stroke="#2d6a2d" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* legs */}
          <Path d="M178 135 L175 155 M184 135 L182 155 M192 135 L192 155 M198 135 L200 155" stroke="#2d6a2d" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* tail */}
          <Path d="M170 126 Q165 122 168 118" stroke="#2d6a2d" strokeWidth="3" strokeLinecap="round" fill="none" />
        </G>
        {/* ground */}
        <Path d="M0 150 Q85 140 170 148 Q255 140 340 148 L340 160 L0 160Z" fill="#3d7a3d" />
      </Svg>

      {/* text overlay */}
      <View style={themedStyles.bannerTextWrap}>
        <Text style={themedStyles.bannerTitle}>Ranger Dashboard</Text>
        <Text style={themedStyles.bannerSubtitle}>Wildlife Incident Reporting</Text>
      </View>
    </View>
  );
}

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function MenuCard({ icon, title, subtitle, onPress }: MenuCardProps) {
  const themedStyles = useThemedStyles(styles);
  return (
    <Pressable
      style={({ pressed }) => [themedStyles.card, pressed && themedStyles.cardPressed]}
      onPress={onPress}
    >
      <View style={themedStyles.cardIconWrap}>{icon}</View>
      <View style={themedStyles.cardText}>
        <Text style={themedStyles.cardTitle}>{title}</Text>
        <Text style={themedStyles.cardSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color="#0F766E" strokeWidth={2.2} />
    </Pressable>
  );
}

export default function IncidentDashboard() {
  const themedStyles = useThemedStyles(styles);
  return (
    <View style={themedStyles.root}>
      {/* decorative circles */}
      <View style={[themedStyles.circle, themedStyles.circleTopLeft]} />
      <View style={[themedStyles.circle, themedStyles.circleBottomRight]} />

      <ScrollView
        contentContainerStyle={themedStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
       
        <MenuCard
          icon={<FileWarning size={26} color="#0F766E" strokeWidth={2} />}
          title="Report an Incident"
          subtitle="Report wildlife or poaching incidents with location and evidence"
          onPress={() => router.push("/ranger/incident-report")}
        />

        <MenuCard
          icon={<FolderOpen size={26} color="#0F766E" strokeWidth={2} />}
          title="My Incident Reports"
          subtitle="View your submitted incident reports and their status"
          onPress={() => router.push("/ranger/my-incidents")}
        />
      </ScrollView>
    </View>
  );
}

const CARD_BG = "#ffffff";
const BG = "#EEF7EE";
const PRIMARY = "#0F766E";
const CIRCLE_COLOR = "rgba(15,118,110,0.07)";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: CIRCLE_COLOR,
  },
  circleTopLeft: {
    width: 200,
    height: 200,
    top: -60,
    left: -60,
  },
  circleBottomRight: {
    width: 260,
    height: 260,
    bottom: -80,
    right: -80,
  },
  scroll: {
    padding: 18,
    paddingBottom: 48,
    gap: 14,
  },

  /* Banner */
  bannerContainer: {
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 4,
  },
  bannerBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#b8ddb8",
  },
  bannerTextWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#14532d",
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "500",
    marginTop: 2,
  },

  /* Cards */
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14532d",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 17,
  },
  cardChevron: {
    color: PRIMARY,
  },
});