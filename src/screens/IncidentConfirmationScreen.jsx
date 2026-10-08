import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import GlassBackground from '../components/GlassBackground';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import { colors } from '../theme/glass';
import { SyncStatus } from '../services/IncidentStorage';

// Sequence diagram: displaySuccessMessage / displayPendingSyncMessage
function IncidentConfirmationScreen({ route, navigation }) {
  const { syncStatus, clientIncidentId } = route.params || {};

  const isSynchronized = syncStatus === SyncStatus.SYNCHRONIZED;

  return (
    <GlassBackground>
      <View style={styles.container}>
        <GlassCard style={styles.card}>
          <Text style={styles.icon}>{isSynchronized ? '✅' : '⏳'}</Text>

          <Text style={styles.title}>
            {isSynchronized ? 'Report Submitted' : 'Report Saved Offline'}
          </Text>

          <Text style={styles.message}>
            {isSynchronized
              ? 'Your incident report has been successfully synchronized with the central database.'
              : 'Your incident report has been saved on this device and is pending synchronization. It will be sent automatically when a network connection is available.'}
          </Text>

          <View style={styles.badge}>
            <Text style={[styles.badgeText, isSynchronized ? styles.badgeSynced : styles.badgePending]}>
              {isSynchronized ? '● Synchronized' : '● Pending Synchronization'}
            </Text>
          </View>

          {clientIncidentId ? (
            <Text style={styles.idLabel}>
              ID: <Text style={styles.idValue}>{clientIncidentId.slice(0, 8)}...</Text>
            </Text>
          ) : null}

          <GlassButton
            onPress={() => navigation.navigate('MyIncidentReports')}
            style={styles.viewBtn}
          >
            My Reports
          </GlassButton>

          <TouchableOpacity
            onPress={() => navigation.replace('RangerDashboard')}
            style={styles.dashLink}
          >
            <Text style={styles.dashLinkText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { alignItems: 'center' },
  icon: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.whiteMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
    backgroundColor: colors.fieldBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
  badgeSynced: { color: colors.accent },
  badgePending: { color: '#fbbf24' },
  idLabel: { fontSize: 11, color: colors.whiteFaint, marginBottom: 24 },
  idValue: { color: colors.whiteMuted },
  viewBtn: { width: '100%', marginBottom: 12 },
  dashLink: { paddingVertical: 8 },
  dashLinkText: { color: colors.whiteMuted, fontSize: 14, textAlign: 'center' },
});

export default IncidentConfirmationScreen;
