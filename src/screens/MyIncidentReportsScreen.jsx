import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
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
    setIncidents(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, []);

  useFocusEffect(useCallback(() => { loadIncidents(); }, [loadIncidents]));

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

  const pendingCount = incidents.filter((i) => i.syncStatus === SyncStatus.PENDING_SYNC).length;

  const renderItem = useCallback(({ item }) => {
    const isSynced = item.syncStatus === SyncStatus.SYNCHRONIZED;
    const label = INCIDENT_TYPE_LABELS[item.incidentType] || item.incidentType;
    const date = new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardType}>{label}</Text>
          <View style={[styles.badge, isSynced ? styles.badgeSynced : styles.badgePending]}>
            <Text style={styles.badgeText}>{isSynced ? '● Synchronized' : '● Pending'}</Text>
          </View>
        </View>
        <Text style={styles.cardDate}>{date}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      {pendingCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={handleRetrySync} disabled={retrying}>
          {retrying
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.syncBannerText}>⟳ Sync {pendingCount} pending report{pendingCount > 1 ? 's' : ''}</Text>
          }
        </TouchableOpacity>
      )}

      {incidents.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No incident reports yet.</Text>
          <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('ReportIncident')}>
            <Text style={styles.newBtnText}>Report an Incident</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.clientIncidentId}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0F766E" />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f5' },
  syncBanner: {
    backgroundColor: '#0F766E', paddingVertical: 10,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  syncBannerText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardType: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeSynced: { backgroundColor: '#D1FAE5' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#111827' },
  cardDate: { fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontWeight: '500' },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: '#94A3B8', marginBottom: 20 },
  newBtn: { backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 13, paddingHorizontal: 28 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default MyIncidentReportsScreen;
