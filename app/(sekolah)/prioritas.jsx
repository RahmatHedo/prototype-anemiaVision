import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getScreenings } from '../../utils/storage';
import { AlertTriangle, Phone, Send, CheckCircle2, ChevronRight } from 'lucide-react-native';

export default function SekolahPrioritasScreen() {
  const [criticalCases, setCriticalCases] = useState([]);

  const loadData = async () => {
    const data = await getScreenings();
    const severeCases = data.filter(item => item.result === 'Berat');
    setCriticalCases(severeCases);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleContactPuskesmas = (item) => {
    Alert.alert(
      'Hubungi Puskesmas',
      `Menghubungi Puskesmas Kecamatan terkait rujukan darurat untuk siswi ${item.id}.`,
      [{ text: 'Tutup' }]
    );
  };

  const handleSendReferral = (item) => {
    Alert.alert(
      'Kirim Rujukan',
      `Surat rujukan digital untuk siswi ${item.id} berhasil dikirim ke Puskesmas Mitra.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <AlertTriangle size={24} color="#EF4444" />
          <Text style={styles.logoText}>Notifikasi Triage Prioritas</Text>
        </View>
        <Text style={styles.headerTitle}>Kasus Kritis Sekolah</Text>
        <Text style={styles.headerSubtitle}>
          Siswi dengan hasil screening Anemia Berat terdeteksi. Harap segera koordinasikan rujukan.
        </Text>
      </View>

      {/* Critical cases list */}
      <FlatList
        data={criticalCases}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>{item.id}</Text>
              <Text style={styles.cardTime}>{item.time} | {item.date}</Text>
            </View>

            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>⚠️ INDIKASI ANEMIA BERAT</Text>
              <Text style={styles.alertDesc}>
                Confidence score model AI: {item.confidence}%. Gejala klinis yang dilaporkan kader menunjukkan kondisi lemas akut dan kelopak mata sangat pucat.
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.btnContact} onPress={() => handleContactPuskesmas(item)}>
                <Phone size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>Hubungi Puskesmas</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btnReferral} onPress={() => handleSendReferral(item)}>
                <Send size={14} color="#0D9488" style={{ marginRight: 6 }} />
                <Text style={styles.btnReferralText}>Kirim Rujukan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={48} color="#10B981" />
            <Text style={styles.emptyText}>Semua Aman!</Text>
            <Text style={styles.emptySubText}>Tidak ada kasus anemia berat yang belum ditindaklanjuti.</Text>
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
    fontSize: 13,
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardTime: {
    fontSize: 12,
    color: '#64748B',
  },
  alertContent: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnContact: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnReferral: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0D9488',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnReferralText: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
