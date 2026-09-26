import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/glass';

function GlassBackground({ children }) {
  return (
    <LinearGradient colors={colors.gradient} style={styles.container}>
      <View pointerEvents="none" style={[styles.glow, styles.glowTopLeft, { backgroundColor: colors.glowEmerald }]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBottomRight, { backgroundColor: colors.glowTeal }]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowMidRight, { backgroundColor: colors.glowLime }]} />
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  glow: {
    position: 'absolute',
    borderRadius: 9999,
  },
  glowTopLeft: {
    top: -100,
    left: -80,
    width: 260,
    height: 260,
  },
  glowBottomRight: {
    bottom: -120,
    right: -80,
    width: 300,
    height: 300,
  },
  glowMidRight: {
    top: '30%',
    right: '15%',
    width: 140,
    height: 140,
  },
});

export default GlassBackground;
