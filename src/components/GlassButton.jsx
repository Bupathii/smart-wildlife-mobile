import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../theme/glass';

function GlassButton({ children, loading, disabled, style, ...touchableProps }) {
  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.disabled, style]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...touchableProps}
    >
      {loading ? (
        <ActivityIndicator color={colors.accentText} />
      ) : (
        <Text style={styles.text}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: colors.accentText,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default GlassButton;
