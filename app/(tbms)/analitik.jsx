import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { getScreenings } from '../../utils/storage';
import { BarChart } from 'react-native-chart-kit';
import { BarChart2, Beaker, HeartPulse, Check, X, ShieldAlert, AlertTriangle, Calendar, TrendingUp } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

export default function TbmAnalitikScreen() {
  const [loading, setLoading] = useState(true);
  const [screenings, setScreenings] = useState([]);
  const [sessionStats, setSessionStats] = useState([]);
  const [totalScreened, setTotalScreened] = useState(0);
  const [totalAiScreened, setTotalAiScreened] = useState(0);
  const [anemiaCount, setAnemiaCount] = useState(0);
  const [severeCount, setSevereCount] = useState(0);
  const [consistentCount, setConsistentCount] = useState(0);
  const [barData, setBarData] = useState({ labels: [], datasets: [{ data: [] }] });

  const loadAnalyticsData = async () => {
    try {
      const data = await getScreenings();
      // Sort screenings by date or ID descending
      const sortedData = [...data].sort((a, b) => b.id.localeCompare(a.id));
      setScreenings(sortedData);
      setTotalScreened(sortedData.length);

      // Counts
      const totalAnemic = sortedData.filter(item => {
        const finalRes = item.tbmResult || item.result;
        return finalRes && finalRes !== 'No Anemia';
      }).length;
      setAnemiaCount(totalAnemic);

      const totalSevere = sortedData.filter(item => {
        const finalRes = item.tbmResult || item.result;
        return finalRes === 'Berat';
      }).length;
      setSevereCount(totalSevere);

      // AI-evaluated screenings only (Sesi 4) for consistency rate
      const aiScreenings = sortedData.filter(item => item.result !== null && item.result !== undefined);
      setTotalAiScreened(aiScreenings.length);

      const totalConsistent = aiScreenings.filter(item => {
        if (item.isConsistent !== undefined && item.isConsistent !== null) {
          return item.isConsistent;
        }
        return item.tbmResult === item.result;
      }).length;
      setConsistentCount(totalConsistent);

      // Sesi Stats
      const sessionNames = ['Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'];
      const stats = sessionNames.map(session => {
        const sessionData = sortedData.filter(item => item.session === session);
        const total = sessionData.length;
        const sessionAnemia = sessionData.filter(item => {
          const finalRes = item.tbmResult || item.result;
          return finalRes && finalRes !== 'No Anemia';
        }).length;
        const sessionSevere = sessionData.filter(item => {
          const finalRes = item.tbmResult || item.result;
          return finalRes === 'Berat';
        }).length;
        const rate = total > 0 ? Math.round((sessionAnemia / total) * 100) : 0;
        
        return {
          session,
          total,
          anemiaCount: sessionAnemia,
          severeCount: sessionSevere,
          rate
        };
      });
      setSessionStats(stats);

      // Bar Chart Data
      setBarData({
        labels: ['Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'],
        datasets: [
          {
            data: stats.map(s => s.total)
          }
        ]
      });

    } catch (e) {
      console.error('Error loading TBM detailed analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 4000);
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
        <Text style={styles.loadingText}>Memuat Analitik Detil...</Text>
      </View>
    );
  }

  // Calculate consistency rate percentage (only for AI-evaluated Session 4)
  const consistencyRate = totalAiScreened > 0 ? Math.round((consistentCount / totalAiScreened) * 100) : 100;
  const anemiaRate = totalScreened > 0 ? Math.round((anemiaCount / totalScreened) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <BarChart2 size={26} color="#0D9488" />
          <Text style={styles.logoText}>Analitik Detail</Text>
        </View>
        <Text style={styles.headerTitle}>Laporan Skrining Lengkap</Text>
        <Text style={styles.headerSubtitle}>
          Analisis perbandingan sesi, volume, prevalensi anemia, dan hasil verifikasi kecocokan AI vs Lab.
        </Text>
      </View>

      {/* Grid KPI Metrics */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{totalScreened}</Text>
          <Text style={styles.kpiLabel}>Total Skrining</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: '#EA580C' }]}>{anemiaRate}%</Text>
          <Text style={styles.kpiLabel}>Prevalensi Anemia</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: '#EF4444' }]}>{severeCount}</Text>
          <Text style={styles.kpiLabel}>Kasus Berat</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>{consistencyRate}%</Text>
          <Text style={styles.kpiLabel}>Akurasi AI (Sesi 4)</Text>
        </View>
      </View>

      {/* Rujukan Prioritas (Anemia Berat) */}
      <Text style={styles.sectionTitle}>⚠️ Rujukan Prioritas (Anemia Berat)</Text>
      <View style={styles.priorityListCard}>
        {screenings.filter(item => (item.tbmResult || item.result) === 'Berat').length === 0 ? (
          <Text style={styles.emptyPriorityText}>Tidak ada kasus anemia berat yang memerlukan tindak lanjut rujukan.</Text>
        ) : (
          screenings.filter(item => (item.tbmResult || item.result) === 'Berat').map(item => (
            <View key={item.id} style={styles.priorityItem}>
              <View style={styles.priorityItemHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.priorityId}>{item.id}</Text>
                  <Text style={styles.prioritySession}>{item.session}</Text>
                </View>
                <View style={styles.hbBadge}>
                  <Text style={styles.hbValLabel}>Hb: {item.hbValue ? `${item.hbValue.toFixed(1)} g/dL` : '-'}</Text>
                </View>
              </View>
              <Text style={styles.priorityDate}>{item.date} | {item.time}</Text>
              <Text style={styles.priorityDesc}>
                Terdeteksi Anemia Berat. Segera rekomendasikan rujukan darurat ke puskesmas.
              </Text>
              <View style={styles.priorityActionRow}>
                <TouchableOpacity 
                  style={styles.btnContact} 
                  onPress={() => alert(`Menghubungi Puskesmas Kecamatan terkait rujukan darurat untuk siswi ${item.id}.`)}
                >
                  <Text style={styles.btnContactText}>Hubungi Puskesmas</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Volume Chart */}
      <Text style={styles.sectionTitle}>Volume Skrining per Sesi</Text>
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
        <Text style={styles.chartNote}>Jumlah total siswi yang diperiksa per sesi</Text>
      </View>

      {/* Sesi Detail Comparer */}
      <Text style={styles.sectionTitle}>Perbandingan Metrik antar Sesi</Text>
      {sessionStats.map((stat) => (
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

      {/* ID Sebaran Siswi Table */}
      <Text style={styles.sectionTitle}>Tabel Hasil Skrining & Lab (per ID)</Text>
      <View style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: 100 }]}>ID Siswi</Text>
              <Text style={[styles.tableHeaderCell, { width: 80 }]}>Sesi</Text>
              <Text style={[styles.tableHeaderCell, { width: 90 }]}>Hb Lab</Text>
              <Text style={[styles.tableHeaderCell, { width: 100 }]}>Diagnosis AI</Text>
              <Text style={[styles.tableHeaderCell, { width: 120 }]}>Kategori Akhir</Text>
              <Text style={[styles.tableHeaderCell, { width: 90, textAlign: 'center' }]}>Kesesuaian</Text>
            </View>

            {/* Table Rows */}
            {screenings.length === 0 ? (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyTableText}>Belum ada data pemeriksaan.</Text>
              </View>
            ) : (
              screenings.map((item, index) => {
                const finalCategory = item.tbmResult || item.result;
                const isConsistent = item.isConsistent !== undefined ? item.isConsistent : finalCategory === item.result;

                return (
                  <View key={item.id} style={[styles.tableRow, index % 2 === 1 && { backgroundColor: '#F8FAFC' }]}>
                    <Text style={[styles.tableCell, { width: 100, fontWeight: 'bold' }]}>{item.id}</Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>{item.session || 'Sesi 3'}</Text>
                    <Text style={[styles.tableCell, { width: 90, color: '#0F172A', fontWeight: '500' }]}>
                      {item.hbValue ? `${item.hbValue.toFixed(1)} g/dL` : '-'}
                    </Text>
                    
                    {/* Diagnosis AI Badge */}
                    <View style={{ width: 100, justifyContent: 'center' }}>
                      {item.result ? (
                        <View style={[styles.smallBadge, { 
                          backgroundColor: item.result === 'No Anemia' ? '#ECFDF5' : item.result === 'Ringan' ? '#FFFBEB' : item.result === 'Sedang' ? '#FFF7ED' : '#FEF2F2'
                        }]}>
                          <Text style={[styles.smallBadgeText, { 
                            color: item.result === 'No Anemia' ? '#10B981' : item.result === 'Ringan' ? '#D97706' : item.result === 'Sedang' ? '#EA580C' : '#EF4444'
                          }]}>
                            {item.result}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.smallBadge, { backgroundColor: '#F1F5F9' }]}>
                          <Text style={[styles.smallBadgeText, { color: '#64748B' }]}>-</Text>
                        </View>
                      )}
                    </View>

                    {/* Final Category (TBM Override) Badge */}
                    <View style={{ width: 120, justifyContent: 'center' }}>
                      <View style={[styles.smallBadge, { 
                        backgroundColor: finalCategory === 'No Anemia' ? '#ECFDF5' : finalCategory === 'Ringan' ? '#FFFBEB' : finalCategory === 'Sedang' ? '#FFF7ED' : '#FEF2F2'
                      }]}>
                        <Text style={[styles.smallBadgeText, { 
                          color: finalCategory === 'No Anemia' ? '#10B981' : finalCategory === 'Ringan' ? '#D97706' : finalCategory === 'Sedang' ? '#EA580C' : '#EF4444'
                        }]}>
                          {finalCategory === 'No Anemia' ? 'No Anemia' : finalCategory}
                        </Text>
                      </View>
                    </View>

                    {/* Match Badge */}
                    <View style={{ width: 90, alignItems: 'center', justifyContent: 'center' }}>
                      {item.result !== null && item.result !== undefined ? (
                        <View style={[styles.matchBadge, { 
                          backgroundColor: isConsistent ? '#ECFDF5' : '#FEF2F2'
                        }]}>
                          {isConsistent ? (
                            <Check size={12} color="#10B981" style={{ marginRight: 2 }} />
                          ) : (
                            <X size={12} color="#EF4444" style={{ marginRight: 2 }} />
                          )}
                          <Text style={[styles.matchBadgeText, { color: isConsistent ? '#10B981' : '#EF4444' }]}>
                            {isConsistent ? 'Sesuai' : 'Beda'}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.matchBadge, { backgroundColor: '#F1F5F9' }]}>
                          <Text style={[styles.matchBadgeText, { color: '#64748B' }]}>N/A</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
        <Text style={styles.tableScrollTip}>Geser ke kanan untuk melihat rincian kolom secara lengkap ➔</Text>
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    marginTop: 20,
    justifyContent: 'space-between',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    width: (screenWidth - 48) / 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D9488',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginLeft: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  chartNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '500',
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
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableContainer: {
    flexDirection: 'column',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingBottom: 10,
    marginBottom: 6,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 12,
    color: '#475569',
  },
  smallBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  smallBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyTable: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  tableScrollTip: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  priorityListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    marginBottom: 10,
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
  priorityDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  priorityDesc: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 6,
    lineHeight: 16,
  },
  priorityActionRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  btnContact: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnContactText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
