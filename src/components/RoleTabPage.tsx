import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface RoleTabPageProps {
  title: string;
  subtitle: string;
  items?: string[];
}

export default function RoleTabPage({
  title,
  subtitle,
  items = [],
}: RoleTabPageProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>

        <Text style={styles.subtitle}>
          {subtitle}
        </Text>

        {items.length > 0 && (
          <View style={styles.cardContainer}>
            {items.map((item, index) => (
              <View
                style={styles.card}
                key={`${item}-${index}`}
              >
                <View style={styles.number}>
                  <Text style={styles.numberText}>
                    {index + 1}
                  </Text>
                </View>

                <Text style={styles.cardText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7f5",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#14532d",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 22,
    marginBottom: 22,
  },

  cardContainer: {
    gap: 12,
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  number: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },

  numberText: {
    color: "#166534",
    fontWeight: "700",
  },

  cardText: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
});