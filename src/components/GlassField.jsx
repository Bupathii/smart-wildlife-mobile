import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/glass';

function GlassField({ label, ...inputProps }) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput placeholderTextColor={colors.whiteFaint} style={styles.input} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.whiteLabel,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    backgroundColor: colors.fieldBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.white,
  },
});

export default GlassField;
