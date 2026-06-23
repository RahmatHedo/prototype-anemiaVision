import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { getScreenings } from '../../utils/storage';
import { Search, Beaker, CheckCircle2, AlertTriangle, Filter, ClipboardList } from 'lucide-react-native';

export default function TbmHistoryScreen() {
  const [screenings, setScreenings] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState('Semua'); // 'Semua', 'Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'

  const loadData = async () => {
    const data = await getScreenings();
    setScreenings(data);
    applyFilter(data, searchQuery, selectedSession);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const applyFilter = (data, searchVal, sessionVal) => {
    let filtered = data;
    
    // Search query filter
    if (searchVal) {
      filtered = filtered.filter(item => 
        item.id.toLowerCase().includes(searchVal.toLowerCase())
      );
    }
    
    // Session filter
    if (sessionVal !== 'Semua') {
      filtered = filtered.filter(item => item.session === sessionVal);
    }
    
    setFilteredList(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilter(screenings, text, selectedSession);
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    applyFilter(screenings, searchQuery, session);
  };

  const getSeverityColor = (result) => {
    if (result === 'No Anemia') return '#10B981'; // Green
    if (result === 'Ringan') return '#F59E0B'; // Yellow
    if (result === 'Sedang') return '#F97316'; // Orange
    if (result === 'Berat') return '#EF4444'; // Red
    return '#94A3B8';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Beaker size={24} color="#0D9488" />
          <Text style={styles.logoText}>Riwayat Pemeriksaan Lab</Text>
        </View>
        <Text style={styles.headerTitle}>Daftar Hasil Skrining</Text>
        <Text style={styles.headerSubtitle}>Tinjau seluruh perbandingan data AI vs TBM & kadar Hb laboratorium.</Text>
      </View>

      {/* Search Bar & Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari ID Anonim..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        
        {/* Horizontal Session Selector */}
        <Text style={styles.filterLabel}>Filter per Sesi:</Text>
        <View style={styles.sessionTabsRow}>
          {['Semua', 'Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'].map(sess => (
            <TouchableOpacity
              key={sess}
              style={[
                styles.sessionTab, 
                selectedSession === sess && styles.sessionTabActive
              ]}
              onPress={() => handleSessionSelect(sess)}
            >
              <Text style={[
                styles.sessionTabText, 
                selectedSession === sess && styles.sessionTabTextActive
              ]}>
                {sess}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Screenings list */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const finalResult = item.tbmResult || item.result;
          const isMatch = item.isConsistent !== false;

          return (
            <View style={styles.card}>
              <View style={styles.leftCol}>
                <View style={styles.idRow}>
                  <Text style={styles.studentId}>{item.id}</Text>
                  <View style={styles.sessionTag}>
                    <Text style={styles.sessionTagText}>{item.session || 'Sesi 3'}</Text>
                  </View>
                </View>
                <Text style={styles.dateText}>{item.date} | {item.time}</Text>
                
                {/* AI vs TBM comparison message */}
                <View style={styles.comparisonRow}>
                  {item.result !== null && item.result !== undefined ? (
                    isMatch ? (
                      <View style={styles.matchBadge}>
                        <CheckCircle2 size={12} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={styles.matchBadgeText}>Sesuai AI ({item.result})</Text>
                      </View>
                    ) : (
                      <View style={styles.mismatchBadge}>
                        <AlertTriangle size={12} color="#EF4444" style={{ marginRight: 4 }} />
                        <Text style={styles.mismatchBadgeText}>
                          AI: {item.result} ➔ TBM: {finalResult}
                        </Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.dataCollectionBadge}>
                      <Text style={styles.dataCollectionBadgeText}>Diagnosis Akhir: {finalResult}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.rightCol}>
                {/* Hb Value display */}
                {item.hbValue ? (
                  <View style={[styles.hbBadge, { borderColor: getSeverityColor(finalResult) }]}>
                    <Text style={[styles.hbValText, { color: getSeverityColor(finalResult) }]}>
                      {item.hbValue.toFixed(1)}
                    </Text>
                    <Text style={[styles.hbUnitText, { color: getSeverityColor(finalResult) }]}>g/dL</Text>
                  </View>
                ) : (
                  <View style={[styles.hbBadge, { borderColor: '#94A3B8' }]}>
                    <Text style={[styles.hbValText, { color: '#94A3B8' }]}>-</Text>
                    <Text style={[styles.hbUnitText, { color: '#94A3B8' }]}>Hb</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClipboardList size={44} color="#94A3B8" />
            <Text style={styles.emptyText}>Tidak ada data pemeriksaan ditemukan</Text>
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
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
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
    marginTop: 2,
    lineHeight: 18,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sessionTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionTab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionTabActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  sessionTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  sessionTabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leftCol: {
    flex: 1,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sessionTag: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 10,
  },
  sessionTagText: {
    fontSize: 10,
    color: '#0D9488',
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  comparisonRow: {
    marginTop: 8,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  matchBadgeText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  mismatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  mismatchBadgeText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '700',
  },
  rightCol: {
    marginLeft: 16,
  },
  hbBadge: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    backgroundColor: '#F8FAFC',
  },
  hbValText: {
    fontSize: 20,
    fontWeight: '800',
  },
  hbUnitText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  dataCollectionBadge: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  dataCollectionBadgeText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
  },
});
