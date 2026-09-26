import { StyleSheet, Text } from 'react-native';
import GlassBackground from '../components/GlassBackground';
import GlassCard from '../components/GlassCard';
import { colors } from '../theme/glass';

function PlaceholderScreen({ route }) {
  const title = route?.name || 'Screen';

  return (
    <GlassBackground>
      <GlassCard>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>This screen will be implemented in a later phase.</Text>
      </GlassCard>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.whiteMuted,
    textAlign: 'center',
  },
});

export default PlaceholderScreen;
