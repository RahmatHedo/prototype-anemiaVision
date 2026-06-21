import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { getScreenings } from '../../utils/storage';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { LayoutDashboard, ShieldAlert, Award, Activity, HeartPulse } from 'lucide-react-native';

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

  const loadDashboardData = async () => {
    try {
      const data = await getScreenings();
      const total = data.length;
      
      const noAnemia = data.filter(item => item.result === 'No Anemia').length;
      const ringan = data.filter(item => item.result === 'Ringan').length;
      const sedang = data.filter(item => item.result === 'Sedang').length;
      const berat = data.filter(item => item.result === 'Berat').length;

      const anemiaCount = ringan + sedang + berat;
      const anemiaRate = total > 0 ? Math.round((anemiaCount / total) * 100) : 0;
      
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

      // Bar chart comparing sessions (Baseline vs Monitoring vs Evaluasi)
      // We calculate from historical data dates (Oct 2023 vs Jun 2026)
      const oct23Count = data.filter(item => item.date === '15/10/2023').length;
      const oct23Anemia = data.filter(item => item.date === '15/10/2023' && item.result !== 'No Anemia').length;
      const oct23Rate = oct23Count > 0 ? Math.round((oct23Anemia / oct23Count) * 100) : 60;

      const jun26Count = data.filter(item => item.date !== '15/10/2023').length;
      const jun26Anemia = data.filter(item => item.date !== '15/10/2023' && item.result !== 'No Anemia').length;
      const jun26Rate = jun26Count > 0 ? Math.round((jun26Anemia / jun26Count) * 100) : 40;

      setBarData({
        labels: ['Baseline (Okt 23)', 'Monitoring (Jun 26)', 'Target UKS'],
        datasets: [
          {
            data: [oct23Rate, jun26Rate, 10] // % Anemia rate per session
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
        <Text style={styles.headerSubtitle}>SMAN 1 Jakarta | Sesi Jun 2026</Text>
      </View>

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
});
