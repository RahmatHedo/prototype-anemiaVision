import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { getScreenings } from '../../utils/storage';
import { Beaker, Camera, BarChart2, Clock, Activity, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

export default function TbmDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalScreened, setTotalScreened] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [mismatchCount, setMismatchCount] = useState(0);

  const loadDashboardData = async () => {
    try {
      const data = await getScreenings();
      setTotalScreened(data.length);

      // Verified represents screenings where Hb value lab is filled
      const verified = data.filter(item => item.hbValue !== undefined && item.hbValue !== null).length;
      setVerifiedCount(verified);

      // Mismatch count where AI result does not match TBM override / lab result
      const mismatch = data.filter(item => {
        const finalRes = item.tbmResult || item.result;
        return item.isConsistent === false || (item.result !== finalRes);
      }).length;
      setMismatchCount(mismatch);

    } catch (e) {
      console.error('Error loading simplified TBM dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Memuat Dashboard TBMs...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Beaker size={26} color="#0D9488" />
          <Text style={styles.logoText}>Laboratorium TBMs</Text>
        </View>
        <Text style={styles.headerTitle}>Pusat Kendali Skrining</Text>
        <Text style={styles.headerSubtitle}>
          Kelola pemeriksaan, masukkan data lab Hb, dan pantau validasi diagnosis.
        </Text>
      </View>

      {/* Welcome operational card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Selamat Bekerja, Tim TBMs! 👋</Text>
        <Text style={styles.welcomeText}>
          Gunakan aplikasi ini untuk mendeteksi konjungtiva kelopak mata siswi, menginput data hemoglobin standar emas lab, dan mengevaluasi kinerja model AI.
        </Text>
      </View>

      {/* Stats Cards Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{totalScreened}</Text>
          <Text style={styles.statLabel}>Total Skrining</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#0D9488' }]}>{verifiedCount}</Text>
          <Text style={styles.statLabel}>Validasi Lab Selesai</Text>
        </View>
      </View>

      {/* Active Session Status banner */}
      <View style={styles.sessionStatusBanner}>
        <Activity size={20} color="#0D9488" style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sessionStatusTitle}>Sesi Skrining Aktif: Sesi 3</Text>
          <Text style={styles.sessionStatusText}>
            Pemeriksaan saat ini dialokasikan ke Sesi 3. Anda dapat merubah sesi secara manual pada form pemeriksaan.
          </Text>
        </View>
      </View>

      {/* Quick Actions (Core Operations) */}
      <Text style={styles.sectionTitle}>Aksi Cepat & Navigasi Utama</Text>
      
      {/* 1. Camera Screen */}
      <TouchableOpacity 
        style={styles.actionCard}
        onPress={() => router.push('/(tbms)/camera')}
      >
        <View style={[styles.iconWrapper, { backgroundColor: '#CCFBF1' }]}>
          <Camera size={24} color="#0D9488" />
        </View>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Cek Kelopak Mata & Lab</Text>
          <Text style={styles.actionDesc}>Buka kamera preview untuk mendeteksi kelopak mata dan isi data Hb lab.</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 2. Analytics Screen */}
      <TouchableOpacity 
        style={styles.actionCard}
        onPress={() => router.push('/(tbms)/analitik')}
      >
        <View style={[styles.iconWrapper, { backgroundColor: '#E0F2FE' }]}>
          <BarChart2 size={24} color="#0284C7" />
        </View>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Analisis Laporan Detail</Text>
          <Text style={styles.actionDesc}>Lihat perbandingan prevalensi tiap sesi, grafik volume, dan tabel per ID siswi.</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* 3. History Screen */}
      <TouchableOpacity 
        style={styles.actionCard}
        onPress={() => router.push('/(tbms)/riwayat')}
      >
        <View style={[styles.iconWrapper, { backgroundColor: '#F1F5F9' }]}>
          <Clock size={24} color="#475569" />
        </View>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Riwayat Log Validasi</Text>
          <Text style={styles.actionDesc}>Daftar lengkap data skrining beserta kesesuaian AI vs Gold Standard.</Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* Operational guidelines */}
      <View style={styles.guidelineCard}>
        <Text style={styles.guidelineHeader}>Panduan Operasional Lab:</Text>
        <View style={styles.guidelineRow}>
          <CheckCircle size={14} color="#0D9488" style={{ marginRight: 6, marginTop: 2 }} />
          <Text style={styles.guidelineItem}>Pastikan senter preview aktif saat pemeriksaan mata untuk penerangan kelopak bawah.</Text>
        </View>
        <View style={styles.guidelineRow}>
          <CheckCircle size={14} color="#0D9488" style={{ marginRight: 6, marginTop: 2 }} />
          <Text style={styles.guidelineItem}>Masukkan Hb dengan rentang valid (3.0 - 22.0 g/dL) dari lab Puskesmas.</Text>
        </View>
        <View style={styles.guidelineRow}>
          <CheckCircle size={14} color="#0D9488" style={{ marginRight: 6, marginTop: 2 }} />
          <Text style={styles.guidelineItem}>Sesuaikan status override diagnosis jika model AI menunjukkan ketidaksesuaian dengan standar emas lab.</Text>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 12,
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
    color: '#0D9488',
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
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  welcomeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: (screenWidth - 52) / 2,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  statVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#475569',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  sessionStatusBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
  },
  sessionStatusTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0D9488',
    marginBottom: 2,
  },
  sessionStatusText: {
    fontSize: 11,
    color: '#0D9488',
    lineHeight: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginLeft: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionInfo: {
    flex: 1,
    marginRight: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  guidelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guidelineHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 10,
  },
  guidelineRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  guidelineItem: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    flex: 1,
  }
});
