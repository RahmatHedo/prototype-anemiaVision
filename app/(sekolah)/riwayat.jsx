import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { getScreenings } from '../../utils/storage';
import { LineChart } from 'react-native-chart-kit';
import { Search, User, Info, Calendar, ChevronRight, Activity } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

export default function SekolahRiwayatScreen() {
  const [query, setQuery] = useState('');
  const [screenings, setScreenings] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [lineChartData, setLineChartData] = useState(null);

  const loadData = async () => {
    const data = await getScreenings();
    setScreenings(data);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (!query) return;
    
    // In this offline demo, we group screenings by student ID.
    // For example, if a student ID is 'AV-0007', we can mock multiple records or check history
    const match = screenings.filter(item => item.id.toLowerCase() === query.trim().toLowerCase());
    
    if (match.length > 0) {
      setSelectedStudent(match[0]);
      
      // Let's generate a history progress sequence.
      // If there is only one entry in database, we can mock a baseline entry for simulation
      let history = [...match];
      if (history.length === 1) {
        // Mock a previous baseline entry to make the progress chart interesting
        const finalRes = match[0].tbmResult || match[0].result || 'No Anemia';
        const baselineResult = finalRes === 'No Anemia' || finalRes === 'Ringan' ? 'Sedang' : 'Berat';
        history.push({
          id: match[0].id,
          date: '15/10/2023',
          time: '09:00 WIB',
          result: baselineResult,
          tbmResult: baselineResult,
          confidence: 81.2,
          answers: { q1: 'Ya', q2: 'Ya', q3: 'Tidak', q4: 'Tidak', q5: 'Ya', q6: 'Tidak', q7: 'Tidak' }
        });
      }

      // Sort by date (oldest first for line chart)
      history.sort((a, b) => {
        const partsA = a.date.split('/');
        const partsB = b.date.split('/');
        return new Date(partsA[2], partsA[1] - 1, partsA[0]) - new Date(partsB[2], partsB[1] - 1, partsB[0]);
      });

      setStudentHistory(history);

      // Convert result strings to numeric values for the LineChart
      // No Anemia = 12.5 g/dL (simulated Hb), Ringan = 11.5 g/dL, Sedang = 10.5 g/dL, Berat = 7.5 g/dL
      const hbPoints = history.map(item => {
        if (item.hbValue) return item.hbValue;
        const res = item.tbmResult || item.result;
        if (res === 'No Anemia') return 12.5;
        if (res === 'Ringan') return 11.5;
        if (res === 'Sedang') return 10.0;
        return 7.5;
      });

      const labels = history.map(item => item.date === '15/10/2023' ? 'Baseline' : 'Monitoring');

      setLineChartData({
        labels,
        datasets: [
          {
            data: hbPoints,
            color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
            strokeWidth: 3
          }
        ]
      });
    } else {
      alert(`Siswa dengan ID ${query.toUpperCase()} tidak ditemukan.`);
      setSelectedStudent(null);
      setLineChartData(null);
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'No Anemia': return '#10B981';
      case 'Ringan': return '#F59E0B';
      case 'Sedang': return '#F97316';
      case 'Berat': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <User size={24} color="#0D9488" />
          <Text style={styles.logoText}>Riwayat Longitudinal Siswi</Text>
        </View>
        <Text style={styles.headerTitle}>Perkembangan Siswi</Text>
        <Text style={styles.headerSubtitle}>Pantau perkembangan kadar Hb & tingkat risiko siswi per sesi.</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchCard}>
        <Text style={styles.cardLabel}>Cari ID Anonim Siswi:</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Masukkan ID, contoh: AV-0007"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Search size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {/* Suggestion tip */}
        {!selectedStudent && (
          <View style={styles.tipBox}>
            <Info size={14} color="#0D9488" style={{ marginRight: 6 }} />
            <Text style={styles.tipText}>
              Tips: Cari **AV-0021** (Kasus Anemia Berat - Sesi 4 AI) atau **AV-0009** (Kasus Anemia Berat - Sesi 2 Manual) untuk simulasi perkembangan longitudinal.
            </Text>
          </View>
        )}
      </View>

      {/* Student Details & Progress Chart */}
      {selectedStudent && (
        <View style={styles.detailContainer}>
          <Text style={styles.sectionTitle}>Profil Kesehatan Siswi ({selectedStudent.id})</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Status Terkini</Text>
              <Text style={[styles.statVal, { color: getResultColor(selectedStudent.tbmResult || selectedStudent.result) }]}>
                {selectedStudent.tbmResult || selectedStudent.result || 'No Anemia'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Jumlah Tes</Text>
              <Text style={[styles.statVal, { color: '#0F172A' }]}>
                {studentHistory.length} Kali
              </Text>
            </View>
          </View>

          {/* Line Chart showing progress */}
          {lineChartData && (
            <View style={styles.chartCard}>
              <Text style={styles.chartHeader}>Grafik Tren Kadar Hemoglobin (g/dL)</Text>
              <LineChart
                data={lineChartData}
                width={screenWidth - 48}
                height={200}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                  decimalPlaces: 1,
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#0D9488'
                  }
                }}
                bezier
                style={styles.lineChart}
              />
              <Text style={styles.chartFooter}>
                *Nilai di luar hasil lab TBM merupakan estimasi konversi model AI.
              </Text>
            </View>
          )}

          {/* Session details history timeline */}
          <Text style={styles.sectionTitle}>Timeline Skrining</Text>
          {studentHistory.map((item, idx) => (
            <View key={`${item.date}_${idx}`} style={styles.timelineCard}>
              <View style={styles.timelineHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Calendar size={16} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.timelineDate}>{item.date} ({item.time})</Text>
                </View>
                <View style={[styles.statusIndicator, { backgroundColor: getResultColor(item.tbmResult || item.result || 'No Anemia') + '15' }]}>
                  <Text style={[styles.statusIndicatorText, { color: getResultColor(item.tbmResult || item.result || 'No Anemia') }]}>
                    Anemia {(item.tbmResult || item.result || 'No Anemia') === 'No Anemia' ? 'Negatif' : (item.tbmResult || item.result)}
                  </Text>
                </View>
              </View>
              {item.hbValue ? (
                <Text style={styles.timelineHbText}>
                  🔬 Uji Laboratorium Hb: **{item.hbValue} g/dL** (Quik-Check) {item.confidence ? `| Keyakinan AI: ${item.confidence}%` : '| Diagnosis Manual TBMs'}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
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
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  searchRow: {
    flexDirection: 'row',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: '#F0FDFA',
    padding: 10,
    borderRadius: 10,
  },
  tipText: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '500',
    flex: 1,
  },
  detailContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginLeft: 24,
    marginTop: 24,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  chartHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  chartFooter: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  statusIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusIndicatorText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  timelineHbText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 10,
  },
});
