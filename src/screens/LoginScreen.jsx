import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import GlassBackground from '../components/GlassBackground';
import GlassCard from '../components/GlassCard';
import GlassField from '../components/GlassField';
import GlassButton from '../components/GlassButton';
import { colors } from '../theme/glass';

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Authentication will be wired up to POST /api/auth/login in a later phase.
    navigation.replace('RangerDashboard');
  };

  return (
    <GlassBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <GlassCard>
          <Text style={styles.eyebrow}>Conservation Platform</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your ranger duties.</Text>

          <View>
            <GlassField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <GlassField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <GlassButton onPress={handleLogin} style={styles.button}>
            Sign In
          </GlassButton>
        </GlassCard>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.eyebrow,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.whiteMuted,
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
});

export default LoginScreen;
