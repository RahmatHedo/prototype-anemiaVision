import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { getScreenings } from '../../utils/storage';
import { Droplet, Search, Eye, User, Activity } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function KaderHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [screenings, setScreenings] = useState([]);
  const [mayaScreenings, setMayaScreenings] = useState([]);
  const [latestCheck, setLatestCheck] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await getScreenings();
      setScreenings(data);
      // Filter screenings belonging to Maya (ID starts with AV-0012)
      const filtered = data.filter(item => item.id.startsWith('AV-0012'));
      setMayaScreenings(filtered);
      setLatestCheck(filtered[0] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusDotColor = (item) => {
    if (item.result === 'No Anemia') return '#10B981';
    if (item.result === 'Ringan') return '#F59E0B';
    if (item.result === 'Sedang') return '#F97316';
    if (item.result === 'Berat') return '#EF4444';
    return '#94A3B8';
  };

  const getResultDisplay = (result) => {
    if (result === 'No Anemia') return 'No Anemia';
    return `Anemia: ${result}`;
  };

  const getSyncText = (status) => {
    if (status === 'synced') return 'Tersinkronisasi';
    return 'Pending';
  };

  const getResultBannerColor = (result) => {
    if (result === 'No Anemia') return '#ECFDF5';
    if (result === 'Ringan') return '#FEF3C7';
    if (result === 'Sedang') return '#FFEDD5';
    if (result === 'Berat') return '#FEE2E2';
    return '#F1F5F9';
  };

  const getResultTextColor = (result) => {
    if (result === 'No Anemia') return '#10B981';
    if (result === 'Ringan') return '#D97706';
    if (result === 'Sedang') return '#EA580C';
    if (result === 'Berat') return '#EF4444';
    return '#64748B';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.logoContainer}>
          <View style={styles.logoGraphic}>
            <Eye size={36} color="#0EA5E9" style={{ position: 'absolute', top: 2, left: 2 }} />
            <Droplet size={18} color="#EF4444" fill="#EF4444" style={{ position: 'absolute', top: 11, left: 11 }} />
            <Search size={14} color="#1E293B" strokeWidth={2.5} style={{ position: 'absolute', bottom: 2, right: 2 }} />
          </View>
          <View style={styles.logoTextWrapper}>
            <Text style={styles.logoTextMain}>Anemia</Text>
            <Text style={styles.logoTextSub}>Vision</Text>
          </View>
        </View>
        
        {/* User Profile Avatar */}
        <View style={styles.profileAvatar}>
          <User size={24} color="#0284C7" />
        </View>
      </View>

      {/* Greeting Title */}
      <Text style={styles.greetingTitle}>Selamat Pagi, Maya!</Text>

      {/* Personal Health Status Card */}
      <View style={styles.summaryCard}>
        {/* Sync Badge */}
        {latestCheck && (
          <View style={[styles.syncBadge, { backgroundColor: latestCheck.syncStatus === 'synced' ? '#DCFCE7' : '#FEF3C7' }]}>
            <Text style={[styles.syncBadgeText, { color: latestCheck.syncStatus === 'synced' ? '#15803D' : '#D97706' }]}>
              {latestCheck.syncStatus === 'synced' ? '✓ Tersinkronisasi' : '⏳ Pending'}
            </Text>
          </View>
        )}

        <Text style={styles.cardHeaderTitle}>Status Kesehatan</Text>
        <Text style={styles.cardHeaderSubtitle}>Pemeriksaan Mandiri Terakhir</Text>

        {latestCheck ? (
          <View style={{ marginTop: 12 }}>
            <View style={[styles.statusBanner, { backgroundColor: getResultBannerColor(latestCheck.result) }]}>
              <Activity size={16} color={getResultTextColor(latestCheck.result)} style={{ marginRight: 8 }} />
              <Text style={[styles.statusBannerText, { color: getResultTextColor(latestCheck.result) }]}>
                Diagnosis AI: Anemia {latestCheck.result === 'No Anemia' ? 'Negatif (Sehat)' : latestCheck.result}
              </Text>
            </View>

            <View style={styles.metaInfoRow}>
              <Text style={styles.metaInfoText}>
                ID Siswi: <Text style={styles.boldText}>AV-0012</Text>
              </Text>
              <Text style={styles.metaInfoText}>
                Waktu Periksa: <Text style={styles.boldText}>{latestCheck.date} | {latestCheck.time}</Text>
              </Text>
              <Text style={styles.metaInfoText}>
                Tingkat Keyakinan: <Text style={styles.boldText}>{latestCheck.confidence}%</Text>
              </Text>
            </View>

            {/* Recommendation Box */}
            <View style={styles.personalRecommBox}>
              <Text style={styles.personalRecommText}>
                {latestCheck.result === 'No Anemia' 
                  ? 'Kondisi Anda baik! Tetap makan makanan bergizi kaya zat besi dan vitamin C.'
                  : latestCheck.result === 'Ringan'
                  ? 'Minum 1 Tablet Tambah Darah (TTD) seminggu sekali & konsumsi bayam/daging merah.'
                  : latestCheck.result === 'Sedang'
                  ? 'Dianjurkan berkonsultasi dengan UKS sekolah atau Puskesmas terdekat.'
                  : '⚠️ KASUS KRITIS. Segera laporkan ke UKS sekolah atau kunjungi Puskesmas terdekat.'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noCheckContainer}>
            <Text style={styles.noCheckText}>Belum ada riwayat skrining mandiri.</Text>
            <TouchableOpacity style={styles.ctaCekMataBtn} onPress={() => router.push('/(kader)/camera')}>
              <Text style={styles.ctaCekMataText}>Mulai Cek Sekarang</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Pagination dots */}
      <View style={styles.paginationDots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>Riwayat Skrining Saya (ID: AV-0012)</Text>

      {/* Screenings List */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="small" color="#0D9488" style={{ marginTop: 20 }} />
        ) : mayaScreenings.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada riwayat skrining mandiri.</Text>
        ) : (
          mayaScreenings.slice(0, 5).map((item, index) => (
            <View key={item.id + '-' + index} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemMainText}>
                  {item.id} | {item.time} | {item.date}
                </Text>
                <Text style={styles.listItemSubText}>
                  Hasil: Anemia {item.result === 'No Anemia' ? 'Negatif' : item.result} | Keyakinan: {item.confidence}%
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: getStatusDotColor(item) }]} />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoGraphic: {
    width: 44,
    height: 44,
    position: 'relative',
    marginRight: 8,
  },
  logoTextWrapper: {
    justifyContent: 'center',
  },
  logoTextMain: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
  },
  logoTextSub: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  syncBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  cardHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    width: '60%',
    lineHeight: 28,
  },
  cardHeaderSubtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    lineHeight: 26,
    marginBottom: 16,
  },
  boldText: {
    fontWeight: 'bold',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusBannerText: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  metaInfoRow: {
    marginBottom: 14,
  },
  metaInfoText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  personalRecommBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  personalRecommText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  noCheckContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noCheckText: {
    fontSize: 13.5,
    color: '#64748B',
    marginBottom: 12,
  },
  ctaCekMataBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  ctaCekMataText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#0D9488',
    width: 14,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  listContainer: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listItemLeft: {
    flex: 1,
  },
  listItemMainText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
  },
  listItemSubText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
