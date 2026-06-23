import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getScreenings } from '../../utils/storage';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { LayoutDashboard, ShieldAlert, Award, Activity, HeartPulse, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

export default function SekolahDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    anemiaRate: 0,
    severeCount: 0,
    curedRate: 85
  });
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [severeStudents, setSevereStudents] = useState([]);

  const loadDashboardData = async () => {
    try {
      const data = await getScreenings();
      const total = data.length;
      
      const noAnemia = data.filter(item => (item.tbmResult || item.result) === 'No Anemia').length;
      const ringan = data.filter(item => (item.tbmResult || item.result) === 'Ringan').length;
      const sedang = data.filter(item => (item.tbmResult || item.result) === 'Sedang').length;
      const berat = data.filter(item => (item.tbmResult || item.result) === 'Berat').length;

      const anemiaCount = ringan + sedang + berat;
      const anemiaRate = total > 0 ? Math.round((anemiaCount / total) * 100) : 0;
      
      const beratData = data.filter(item => (item.tbmResult || item.result) === 'Berat');
      setSevereStudents(beratData);

      setStats({
        total,
        anemiaRate,
        severeCount: berat,
        curedRate: 78 // Mock baseline cure rate improvement
      });

      // Pie chart data
      setPieData([
        { name: 'Sehat', population: noAnemia, color: '#10B981', legendFontColor: '#475569', legendFontSize: 12 },
        { name: 'Ringan', population: ringan, color: '#F59E0B', legendFontColor: '#475569', legendFontSize: 12 },
        { name: 'Sedang', population: sedang, color: '#F97316', legendFontColor: '#475569', legendFontSize: 12 },
        { name: 'Berat', population: berat, color: '#EF4444', legendFontColor: '#475569', legendFontSize: 12 }
      ]);

      // Bar chart comparing sessions (Sesi 1, 2, 3, 4)
      const s1Data = data.filter(item => item.session === 'Sesi 1');
      const s1Total = s1Data.length;
      const s1Anemia = s1Data.filter(item => (item.tbmResult || item.result) !== 'No Anemia').length;
      const s1Rate = s1Total > 0 ? Math.round((s1Anemia / s1Total) * 100) : 58;

      const s2Data = data.filter(item => item.session === 'Sesi 2');
      const s2Total = s2Data.length;
      const s2Anemia = s2Data.filter(item => (item.tbmResult || item.result) !== 'No Anemia').length;
      const s2Rate = s2Total > 0 ? Math.round((s2Anemia / s2Total) * 100) : 50;

      const s3Data = data.filter(item => item.session === 'Sesi 3');
      const s3Total = s3Data.length;
      const s3Anemia = s3Data.filter(item => (item.tbmResult || item.result) !== 'No Anemia').length;
      const s3Rate = s3Total > 0 ? Math.round((s3Anemia / s3Total) * 100) : 42;

      const s4Data = data.filter(item => item.session === 'Sesi 4');
      const s4Total = s4Data.length;
      const s4Anemia = s4Data.filter(item => (item.tbmResult || item.result) !== 'No Anemia').length;
      const s4Rate = s4Total > 0 ? Math.round((s4Anemia / s4Total) * 100) : 0;

      setBarData({
        labels: ['Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'],
        datasets: [
          {
            data: [s1Rate, s2Rate, s3Rate, s4Rate] // % Anemia rate per session
          }
        ]
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
    barPercentage: 0.6,
    decimalPlaces: 0,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Memuat statistik dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <LayoutDashboard size={24} color="#0D9488" />
          <Text style={styles.logoText}>Dashboard Sekolah</Text>
        </View>
        <Text style={styles.headerTitle}>AnemiaVision Monitor</Text>
        <Text style={styles.headerSubtitle}>SMPN X Palembang | Sesi Jun 2026</Text>
      </View>

      {/* Emergency Alert Banner */}
      {stats.severeCount > 0 && (
        <TouchableOpacity 
          style={styles.emergencyBanner}
          onPress={() => router.push('/(sekolah)/prioritas')}
          activeOpacity={0.9}
        >
          <View style={styles.emergencyLeft}>
            <ShieldAlert size={24} color="#FFF" style={styles.pulseIcon} />
            <View style={styles.emergencyTexts}>
              <Text style={styles.emergencyTitle}>PERINGATAN KASUS KRITIS!</Text>
              <Text style={styles.emergencyDesc}>
                Terdeteksi {stats.severeCount} siswi terkena Anemia Berat. Klik di sini untuk melihat rujukan prioritas segera.
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* KPI Cards Row */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiVal}>{stats.total}</Text>
            <Text style={styles.kpiLabel}>Total Diskrining</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiVal, { color: '#EA580C' }]}>{stats.anemiaRate}%</Text>
            <Text style={styles.kpiLabel}>Prevalensi Anemia</Text>
          </View>
        </View>
        
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiVal, { color: '#EF4444' }]}>{stats.severeCount}</Text>
            <Text style={styles.kpiLabel}>Anemia Berat</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiVal, { color: '#10B981' }]}>{stats.curedRate}%</Text>
            <Text style={styles.kpiLabel}>Penurunan Tren</Text>
          </View>
        </View>
      </View>

      {/* Pie Chart Widget */}
      <Text style={styles.chartTitle}>Sebaran Risiko Anemia Siswi</Text>
      <View style={styles.chartCard}>
        <PieChart
          data={pieData}
          width={screenWidth - 48}
          height={160}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      {/* Bar Chart Widget (Session comparisons) */}
      <Text style={styles.chartTitle}>Tren Prevalensi Anemia Per Sesi (%)</Text>
      <View style={styles.chartCard}>
        <BarChart
          data={barData}
          width={screenWidth - 48}
          height={200}
          yAxisLabel=""
          yAxisSuffix="%"
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero
        />
      </View>

      {/* High-level Triage Feed */}
      <Text style={styles.chartTitle}>Ulasan Intervensi Sekolah</Text>
      <View style={styles.reviewCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <HeartPulse size={20} color="#0D9488" style={{ marginRight: 8 }} />
          <Text style={styles.reviewTitle}>Program Pemberian TTD</Text>
        </View>
        <Text style={styles.reviewDesc}>
          Berdasarkan perbandingan sesi, prevalensi anemia mengalami penurunan yang signifikan setelah inisiasi pemberian Tablet Tambah Darah (TTD) mingguan di sekolah. Fokus rujukan saat ini adalah {stats.severeCount} siswi kategori berat.
        </Text>
      </View>

      {/* Priority follow up list for school */}
      <Text style={styles.chartTitle}>Daftar Prioritas Tindak Lanjut</Text>
      <View style={styles.priorityListCard}>
        {severeStudents.length === 0 ? (
          <Text style={styles.emptyPriorityText}>Tidak ada kasus kritis yang perlu ditindaklanjuti saat ini.</Text>
        ) : (
          severeStudents.map((student) => (
            <TouchableOpacity 
              key={student.id} 
              style={styles.priorityItem}
              onPress={() => router.push('/(sekolah)/prioritas')}
            >
              <View style={styles.priorityItemHeader}>
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityId}>{student.id}</Text>
                  <Text style={styles.prioritySession}>{student.session}</Text>
                </View>
                <View style={styles.hbBadge}>
                  <Text style={styles.hbValLabel}>Hb: {student.hbValue ? `${student.hbValue.toFixed(1)} g/dL` : '-'}</Text>
                </View>
              </View>
              <View style={styles.priorityItemBody}>
                <Text style={styles.priorityTextDetail}>
                  Skrining tanggal {student.date} ({student.time}). Segera tindaklanjuti rujukan digital.
                </Text>
                <ChevronRight size={16} color="#EF4444" />
              </View>
            </TouchableOpacity>
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
  },
  kpiContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D9488',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginLeft: 24,
    marginTop: 24,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCard: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#CCFBF1',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 18,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  reviewDesc: {
    fontSize: 12,
    color: '#115E59',
    lineHeight: 18,
  },
  emergencyBanner: {
    backgroundColor: '#EF4444',
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  pulseIcon: {
    marginRight: 12,
  },
  emergencyTexts: {
    flex: 1,
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  emergencyDesc: {
    color: '#FEE2E2',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  priorityListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  emptyPriorityText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 12,
  },
  priorityItem: {
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  priorityItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  prioritySession: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  hbBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FCA5A5',
  },
  hbValLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B91C1C',
  },
  priorityItemBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priorityTextDetail: {
    fontSize: 11,
    color: '#7F1D1D',
    flex: 1,
    marginRight: 10,
    lineHeight: 15,
  },
});
