import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/glass';

function GlassCard({ children, style }) {
  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cardOverlay,
  },
  inner: {
    padding: 28,
  },
});

export default GlassCard;
