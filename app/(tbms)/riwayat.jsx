import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { getHbInputs } from '../../utils/storage';
import { Search, Beaker, Cloud, CloudOff } from 'lucide-react-native';

export default function TbmHistoryScreen() {
  const [hbList, setHbList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [query, setQuery] = useState('');

  const loadData = async () => {
    const data = await getHbInputs();
    setHbList(data);
    applyFilter(data, query);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const applyFilter = (data, searchVal) => {
    if (!searchVal) {
      setFilteredList(data);
      return;
    }
    const filtered = data.filter(item => 
      item.studentId.toLowerCase().includes(searchVal.toLowerCase())
    );
    setFilteredList(filtered);
  };

  const handleSearch = (text) => {
    setQuery(text);
    applyFilter(hbList, text);
  };

  const getHbStatusColor = (hb) => {
    // Hemoglobin references (Normal for adolescent girls is > 12.0 g/dL)
    if (hb < 8.0) return '#EF4444'; // Severe
    if (hb < 11.0) return '#F97316'; // Moderate
    if (hb < 12.0) return '#F59E0B'; // Mild
    return '#10B981'; // Normal
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Beaker size={24} color="#0D9488" />
          <Text style={styles.logoText}>Riwayat Uji Laboratorium</Text>
        </View>
        <Text style={styles.headerTitle}>Log Data Hemoglobin</Text>
        <Text style={styles.headerSubtitle}>Riwayat input kadar Hb Quik-Check oleh Laborat.</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari ID Anonim..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Hb Entries List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item, index) => `${item.studentId}_${index}`}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.leftCol}>
              <Text style={styles.studentId}>{item.studentId}</Text>
              <Text style={styles.dateText}>Diinput pada: {item.date}</Text>
              <View style={styles.syncRow}>
                <Cloud size={14} color={item.syncStatus === 'synced' ? '#10B981' : '#EAB308'} style={{ marginRight: 4 }} />
                <Text style={[styles.syncText, { color: item.syncStatus === 'synced' ? '#10B981' : '#EAB308' }]}>
                  {item.syncStatus === 'synced' ? 'Tersinkronisasi' : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.rightCol}>
              <View style={[styles.hbBadge, { backgroundColor: getHbStatusColor(item.hbValue) + '15', borderColor: getHbStatusColor(item.hbValue) }]}>
                <Text style={[styles.hbValText, { color: getHbStatusColor(item.hbValue) }]}>{item.hbValue}</Text>
                <Text style={[styles.hbUnitText, { color: getHbStatusColor(item.hbValue) }]}>g/dL</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CloudOff size={40} color="#94A3B8" />
            <Text style={styles.emptyText}>Tidak ada data Hb yang diinput</Text>
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
  },
  searchRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leftCol: {
    flex: 1,
  },
  studentId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rightCol: {
    marginLeft: 16,
  },
  hbBadge: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  hbValText: {
    fontSize: 18,
    fontWeight: 'bold',
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
});
