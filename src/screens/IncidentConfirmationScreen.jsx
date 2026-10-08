import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SyncStatus } from '../services/IncidentStorage';

function IncidentConfirmationScreen({ route, navigation }) {
  const { syncStatus, clientIncidentId } = route.params || {};
  const isSynchronized = syncStatus === SyncStatus.SYNCHRONIZED;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>{isSynchronized ? '✅' : '⏳'}</Text>

        <Text style={styles.title}>
          {isSynchronized ? 'Report Submitted' : 'Report Saved Offline'}
        </Text>

        <Text style={styles.message}>
          {isSynchronized
            ? 'Your incident report has been successfully synchronized with the central database.'
            : 'Your incident report has been saved on this device and is pending synchronization. It will be sent automatically when a network connection is available.'}
        </Text>

        <View style={[styles.badge, isSynchronized ? styles.badgeSynced : styles.badgePending]}>
          <Text style={styles.badgeText}>
            {isSynchronized ? '● Synchronized' : '● Pending Synchronization'}
          </Text>
        </View>

        {clientIncidentId ? (
          <Text style={styles.idLabel}>
            ID: <Text style={styles.idValue}>{clientIncidentId.slice(0, 8)}...</Text>
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('MyIncidentReports')}
        >
          <Text style={styles.primaryBtnText}>My Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.replace('RangerDashboard')}
          style={styles.dashLink}
        >
          <Text style={styles.dashLinkText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f5', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  badge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 12 },
  badgeSynced: { backgroundColor: '#D1FAE5' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#111827' },
  idLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 24 },
  idValue: { color: '#6B7280' },
  primaryBtn: { width: '100%', backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dashLink: { paddingVertical: 8 },
  dashLinkText: { color: '#6B7280', fontSize: 14, textAlign: 'center' },
});

export default IncidentConfirmationScreen;
