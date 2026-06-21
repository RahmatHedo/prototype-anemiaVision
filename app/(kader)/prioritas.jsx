import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { getScreenings, updateScreeningSync } from '../../utils/storage';
import { ShieldAlert, CheckCircle2, ChevronRight, Phone, Send, Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function PrioritasScreen() {
  const [criticalCases, setCriticalCases] = useState([]);

  const loadData = async () => {
    const data = await getScreenings();
    // Filter only severe cases
    const severeCases = data.filter(item => item.result === 'Berat');
    setCriticalCases(severeCases);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const markAsReferred = (item) => {
    Alert.alert(
      'Konfirmasi Rujukan',
      `Tandai siswi ${item.id} sudah dirujuk ke Puskesmas untuk pemeriksaan darah lengkap?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Tandai', 
          onPress: async () => {
            // Update local state (simulate referred by changing syncStatus or result)
            await updateScreeningSync(item.id, 'synced'); // Sync immediately / update status
            Alert.alert('Sukses', 'Status rujukan berhasil diperbarui.');
            loadData();
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <ShieldAlert size={26} color="#EF4444" />
          <Text style={styles.logoText}>Kasus Prioritas Tinggi</Text>
        </View>
        <Text style={styles.headerTitle}>Triage Rujukan Siswi</Text>
        <Text style={styles.headerSubtitle}>Daftar siswi terindikasi anemia berat yang membutuhkan rujukan segera.</Text>
      </View>

      {/* Critical List */}
      <FlatList
        data={criticalCases}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardId}>{item.id}</Text>
              <Text style={styles.cardTime}>{item.time} | {item.date}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailBox}>
              <View style={styles.alertIndicator}>
                <Text style={styles.alertLabel}>Risiko:</Text>
                <Text style={styles.alertValue}>ANEMIA BERAT</Text>
              </View>
              <Text style={styles.alertDesc}>
                Hasil analisis AI menunjukkan tingkat keyakinan {item.confidence}%. Siswi terindikasi lesu berat dan kelopak mata sangat pucat.
              </Text>
            </View>

            {/* Recommendations Banner */}
            <View style={styles.recommBox}>
              <Info size={14} color="#B91C1C" style={{ marginRight: 6 }} />
              <Text style={styles.recommText}>Segera berikan rujukan Puskesmas dan hubungi orang tua.</Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtnReferred} onPress={() => markAsReferred(item)}>
                <CheckCircle2 size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Sudah Dirujuk</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtnContact} onPress={() => Alert.alert('Koneksi', 'Menghubungi nomor darurat Puskesmas / UKS...')}>
                <Phone size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnContactText}>Hubungi UKS</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={48} color="#10B981" />
            <Text style={styles.emptyText}>Bagus sekali! Tidak ada kasus kritis saat ini.</Text>
            <Text style={styles.emptySubText}>Semua siswi terindikasi anemia berat telah dirujuk.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardTime: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  detailBox: {
    marginBottom: 12,
  },
  alertIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
  },
  alertValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
  alertDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  recommBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  recommText: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtnReferred: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10B981',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBtnContact: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnContactText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});
