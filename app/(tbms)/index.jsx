import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getScreenings } from '../../utils/storage';
import { BarChart } from 'react-native-chart-kit';
import { Beaker, Users, ChevronRight, BarChart2, HeartPulse, Activity } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

export default function TbmDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [screenings, setScreenings] = useState([]);
  const [sessionStats, setSessionStats] = useState([]);
  const [totalScreened, setTotalScreened] = useState(0);
  const [barData, setBarData] = useState({ labels: [], datasets: [{ data: [] }] });

  const loadStats = async () => {
    try {
      const data = await getScreenings();
      setScreenings(data);
      setTotalScreened(data.length);

      const sessionNames = ['Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'];
      const stats = sessionNames.map(session => {
        const sessionData = data.filter(item => item.session === session);
        const total = sessionData.length;
        // Count anemia based on final tbmResult, fallback to result if null
        const anemiaCount = sessionData.filter(item => {
          const finalRes = item.tbmResult || item.result;
          return finalRes && finalRes !== 'No Anemia';
        }).length;
        const severeCount = sessionData.filter(item => {
          const finalRes = item.tbmResult || item.result;
          return finalRes === 'Berat';
        }).length;
        const rate = total > 0 ? Math.round((anemiaCount / total) * 100) : 0;
        
        return {
          session,
          total,
          anemiaCount,
          severeCount,
          rate
        };
      });

      setSessionStats(stats);

      // Set Bar Chart data comparing total screened per session
      setBarData({
        labels: ['Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'],
        datasets: [
          {
            data: stats.map(s => s.total)
          }
        ]
      });

    } catch (e) {
      console.error('Error loading TBM dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 4000);
    return () => clearInterval(interval);
  }, []);

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
    barPercentage: 0.5,
    decimalPlaces: 0,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Memuat dashboard TBMs...</Text>
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
        <Text style={styles.headerTitle}>Pusat Data Skrining</Text>
        <Text style={styles.headerSubtitle}>Pantau dan validasi diagnosis anemia siswi di 4 sesi skrining.</Text>
      </View>

      {/* Overview Stat Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <Users size={24} color="#0D9488" style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.overviewTitle}>Akumulasi Skrining</Text>
            <Text style={styles.overviewSubtitle}>Total siswi yang telah diperiksa</Text>
          </View>
        </View>
        <Text style={styles.overviewValue}>{totalScreened} Siswi</Text>
        
        <TouchableOpacity 
          style={styles.ctaBtn}
          onPress={() => router.push('/(tbms)/camera')}
        >
          <Text style={styles.ctaBtnText}>Mulai Skrining Sesi</Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Analytics chart */}
      <Text style={styles.sectionTitle}>Perbandingan Volume Skrining per Sesi</Text>
      <View style={styles.chartCard}>
        <BarChart
          data={barData}
          width={screenWidth - 48}
          height={200}
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero
          yAxisLabel=""
          yAxisSuffix=""
        />
      </View>

      {/* Session Comparison Grid */}
      <Text style={styles.sectionTitle}>Detail Analitik Sesi</Text>
      {sessionStats.map((stat, idx) => (
        <View key={stat.session} style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionName}>{stat.session}</Text>
            <View style={[styles.rateBadge, { backgroundColor: stat.rate > 40 ? '#FEF2F2' : '#ECFDF5' }]}>
              <Text style={[styles.rateBadgeText, { color: stat.rate > 40 ? '#EF4444' : '#10B981' }]}>
                Prevalensi: {stat.rate}%
              </Text>
            </View>
          </View>
          
          <View style={styles.statGrid}>
            <View style={styles.statCol}>
              <Text style={styles.statColVal}>{stat.total}</Text>
              <Text style={styles.statColLabel}>Total Diperiksa</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statColVal, { color: '#EA580C' }]}>{stat.anemiaCount}</Text>
              <Text style={styles.statColLabel}>Kasus Anemia</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statColVal, { color: '#EF4444' }]}>{stat.severeCount}</Text>
              <Text style={styles.statColLabel}>Anemia Berat</Text>
            </View>
          </View>
        </View>
      ))}

      {/* Methodology note */}
      <View style={styles.infoBox}>
        <Activity size={18} color="#0D9488" style={{ marginRight: 8, marginTop: 2 }} />
        <Text style={styles.infoBoxText}>
          TBMs bertindak sebagai supervisor klinis untuk mencatat data laboratorium hemoglobin (Gold Standard) guna mengevaluasi ketepatan model AI.
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
    lineHeight: 18,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  overviewSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  overviewValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D9488',
    marginBottom: 20,
  },
  ctaBtn: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginLeft: 24,
    marginTop: 28,
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
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 10,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statColVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D9488',
  },
  statColLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  infoBoxText: {
    fontSize: 12,
    color: '#0D9488',
    lineHeight: 18,
    flex: 1,
  },
});
