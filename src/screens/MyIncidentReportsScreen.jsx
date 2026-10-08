import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import GlassBackground from '../components/GlassBackground';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import { colors } from '../theme/glass';
import { getAllIncidents, SyncStatus } from '../services/IncidentStorage';
import { retrySynchronization } from '../services/SyncManager';
import { INCIDENT_TYPE_LABELS } from '../services/incidentService';
import { useFocusEffect } from '@react-navigation/native';

function MyIncidentReportsScreen({ navigation }) {
  const [incidents, setIncidents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const loadIncidents = useCallback(async () => {
    const all = await getAllIncidents();
    // Newest first
    setIncidents(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, []);

  // Reload each time the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadIncidents();
    }, [loadIncidents])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadIncidents();
    setRefreshing(false);
  }, [loadIncidents]);

  const handleRetrySync = useCallback(async () => {
    setRetrying(true);
    await retrySynchronization();
    await loadIncidents();
    setRetrying(false);
  }, [loadIncidents]);

  const renderItem = useCallback(({ item }) => {
    const isSynced = item.syncStatus === SyncStatus.SYNCHRONIZED;
    const label = INCIDENT_TYPE_LABELS[item.incidentType] || item.incidentType;
    const date = new Date(item.createdAt).toLocaleDateString();

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportRow}>
          <Text style={styles.reportType}>{label}</Text>
          <View style={[styles.badge, isSynced ? styles.badgeSynced : styles.badgePending]}>
            <Text style={styles.badgeText}>
              {isSynced ? '● Synchronized' : '● Pending'}
            </Text>
          </View>
        </View>
        <Text style={styles.reportDate}>{date}</Text>
        <Text style={styles.reportDesc} numberOfLines={2}>{item.description}</Text>
      </View>
    );
  }, []);

  return (
    <GlassBackground>
      <View style={styles.container}>
        <Text style={styles.heading}>My Incident Reports</Text>

        {incidents.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>No incident reports yet.</Text>
            <GlassButton
              onPress={() => navigation.navigate('ReportIncident')}
              style={styles.newBtn}
            >
              Report an Incident
            </GlassButton>
          </GlassCard>
        ) : (
          <>
            <GlassButton
              onPress={handleRetrySync}
              loading={retrying}
              style={styles.syncBtn}
            >
              Sync Pending Reports
            </GlassButton>

            <FlatList
              data={incidents}
              keyExtractor={(item) => item.clientIncidentId}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.accent}
                />
              }
              contentContainerStyle={styles.list}
            />
          </>
        )}
      </View>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  heading: { fontSize: 20, fontWeight: '700', color: colors.white, marginBottom: 14 },
  emptyCard: { alignItems: 'center' },
  emptyText: { color: colors.whiteMuted, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  newBtn: { width: '100%' },
  syncBtn: { marginBottom: 12, paddingVertical: 10 },
  list: { paddingBottom: 24 },
  reportCard: {
    backgroundColor: colors.cardOverlay,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reportType: { fontSize: 15, fontWeight: '600', color: colors.white },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeSynced: { backgroundColor: 'rgba(52,211,153,0.15)' },
  badgePending: { backgroundColor: 'rgba(251,191,36,0.15)' },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.accent },
  reportDate: { fontSize: 11, color: colors.whiteFaint, marginBottom: 6 },
  reportDesc: { fontSize: 13, color: colors.whiteMuted },
});

export default MyIncidentReportsScreen;
