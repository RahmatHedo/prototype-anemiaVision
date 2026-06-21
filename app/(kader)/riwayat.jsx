import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { getScreenings } from '../../utils/storage';
import { Search, Eye, ChevronRight, Cloud, CloudOff, Calendar, Layers, Activity, X, Info } from 'lucide-react-native';

const { height, width } = Dimensions.get('window');

export default function RiwayatScreen() {
  const [screenings, setScreenings] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('Semua');
  const [filterSession, setFilterSession] = useState('Semua');
  const [filterResult, setFilterResult] = useState('Semua');
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Filter UI Dropdowns state
  const [activeDropdown, setActiveDropdown] = useState(null); // 'tanggal', 'sesi', 'hasil' or null

  const loadData = async () => {
    const data = await getScreenings();
    setScreenings(data);
    applyFilters(data, search, filterDate, filterSession, filterResult);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const applyFilters = (data, query, dateVal, sessionVal, resultVal) => {
    let filtered = [...data];

    // Search Query
    if (query) {
      filtered = filtered.filter(item => 
        item.id.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter Tanggal
    if (dateVal !== 'Semua') {
      const todayStr = new Date().getDate().toString().padStart(2, '0') + '/' + 
                       (new Date().getMonth() + 1).toString().padStart(2, '0') + '/' + 
                       new Date().getFullYear();
      if (dateVal === 'Hari Ini') {
        filtered = filtered.filter(item => item.date === todayStr || item.date === '21/06/2026');
      } else if (dateVal === '15 Okt 2023') {
        filtered = filtered.filter(item => item.date === '15/10/2023');
      }
    }

    // Filter Sesi (Simulated session logic by date or index)
    if (sessionVal !== 'Semua') {
      if (sessionVal === 'Baseline') {
        filtered = filtered.filter(item => item.date === '15/10/2023');
      } else if (sessionVal === 'Monitoring') {
        filtered = filtered.filter(item => item.date !== '15/10/2023');
      }
    }

    // Filter Hasil
    if (resultVal !== 'Semua') {
      filtered = filtered.filter(item => {
        if (resultVal === 'Anemia') {
          return item.result !== 'No Anemia';
        } else {
          return item.result === resultVal;
        }
      });
    }

    setFilteredData(filtered);
  };

  const handleSearch = (text) => {
    setSearch(text);
    applyFilters(screenings, text, filterDate, filterSession, filterResult);
  };

  const handleSelectFilter = (type, val) => {
    if (type === 'tanggal') {
      setFilterDate(val);
      applyFilters(screenings, search, val, filterSession, filterResult);
    } else if (type === 'sesi') {
      setFilterSession(val);
      applyFilters(screenings, search, filterDate, val, filterResult);
    } else if (type === 'hasil') {
      setFilterResult(val);
      applyFilters(screenings, search, filterDate, filterSession, val);
    }
    setActiveDropdown(null);
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'No Anemia': return '#10B981'; // Emerald Green
      case 'Ringan': return '#F59E0B'; // Yellow/Amber
      case 'Sedang': return '#F97316'; // Orange
      case 'Berat': return '#EF4444'; // Red
      default: return '#64748B';
    }
  };

  const openDetail = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Activity size={24} color="#0D9488" strokeWidth={2.5} />
          <Text style={styles.logoText}>AnemiaVision</Text>
        </View>
        <Text style={styles.headerTitle}>Halo, Kak Kader!</Text>
        <Text style={styles.headerSubtitle}>Daftar Riwayat Skrining Siswi</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari ID Anonim..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Filters Row */}
      <View style={styles.filterRow}>
        {/* Filter Tanggal */}
        <TouchableOpacity 
          style={styles.filterBtn} 
          onPress={() => setActiveDropdown(activeDropdown === 'tanggal' ? null : 'tanggal')}
        >
          <Text style={styles.filterBtnText}>{filterDate === 'Semua' ? 'Tanggal' : filterDate}</Text>
          <Calendar size={12} color="#64748B" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Filter Sesi */}
        <TouchableOpacity 
          style={styles.filterBtn} 
          onPress={() => setActiveDropdown(activeDropdown === 'sesi' ? null : 'sesi')}
        >
          <Text style={styles.filterBtnText}>{filterSession === 'Semua' ? 'Sesi' : filterSession}</Text>
          <Layers size={12} color="#64748B" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Filter Hasil */}
        <TouchableOpacity 
          style={styles.filterBtn} 
          onPress={() => setActiveDropdown(activeDropdown === 'hasil' ? null : 'hasil')}
        >
          <Text style={styles.filterBtnText}>{filterResult === 'Semua' ? 'Hasil' : filterResult}</Text>
          <Activity size={12} color="#64748B" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Dropdown Options overlay */}
      {activeDropdown && (
        <View style={styles.dropdownMenu}>
          {activeDropdown === 'tanggal' && (
            ['Semua', 'Hari Ini', '15 Okt 2023'].map(opt => (
              <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => handleSelectFilter('tanggal', opt)}>
                <Text style={[styles.dropdownItemText, filterDate === opt && styles.dropdownActiveText]}>{opt}</Text>
              </TouchableOpacity>
            ))
          )}
          {activeDropdown === 'sesi' && (
            ['Semua', 'Baseline', 'Monitoring'].map(opt => (
              <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => handleSelectFilter('sesi', opt)}>
                <Text style={[styles.dropdownItemText, filterSession === opt && styles.dropdownActiveText]}>{opt}</Text>
              </TouchableOpacity>
            ))
          )}
          {activeDropdown === 'hasil' && (
            ['Semua', 'No Anemia', 'Anemia', 'Ringan', 'Sedang', 'Berat'].map(opt => (
              <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => handleSelectFilter('hasil', opt)}>
                <Text style={[styles.dropdownItemText, filterResult === opt && styles.dropdownActiveText]}>{opt}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* History List */}
      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.historyCard} onPress={() => openDetail(item)}>
            <View style={styles.cardInfoCol}>
              {/* Line 1: ID, Time, Date */}
              <Text style={styles.cardHeader}>
                {item.id} | {item.time} {item.date !== '21/06/2026' ? `, ${item.date}` : ''}
              </Text>
              
              {/* Line 2: Result & Sync Status */}
              <View style={styles.cardMetaRow}>
                <View style={styles.resultBadge}>
                  <View style={[styles.resultDot, { backgroundColor: getResultColor(item.result) }]} />
                  <Text style={styles.resultText}>
                    Anemia: {item.result === 'No Anemia' ? 'Negatif' : item.result}
                  </Text>
                </View>

                <View style={styles.syncContainer}>
                  <Cloud size={14} color={item.syncStatus === 'synced' ? '#10B981' : '#EAB308'} style={{ marginRight: 4 }} />
                  <Text style={[styles.syncText, { color: item.syncStatus === 'synced' ? '#10B981' : '#EAB308' }]}>
                    Status: {item.syncStatus === 'synced' ? 'Tersinkronisasi' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.cardActionCol}>
              <TouchableOpacity style={styles.eyeBtn} onPress={() => openDetail(item)}>
                <Eye size={18} color="#0D9488" />
              </TouchableOpacity>
              <ChevronRight size={18} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CloudOff size={40} color="#94A3B8" />
            <Text style={styles.emptyText}>Tidak ada riwayat skrining ditemukan</Text>
          </View>
        }
      />

      {/* Screening Detail Modal */}
      {selectedItem && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detail Skrining - {selectedItem.id}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScroll}>
                {/* Meta details */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Informasi Sesi</Text>
                  <Text style={styles.sectionValue}>Tanggal: {selectedItem.date}</Text>
                  <Text style={styles.sectionValue}>Waktu: {selectedItem.time}</Text>
                  <Text style={styles.sectionValue}>
                    Sinkronisasi: {selectedItem.syncStatus === 'synced' ? '🟢 Tersinkronisasi ke Server' : '🟡 Tersimpan Lokal (Pending)'}
                  </Text>
                  {selectedItem.hbValue ? (
                    <Text style={[styles.sectionValue, {fontWeight: 'bold', color: '#0D9488'}]}>
                      Kadar Hb Lab (TBM): {selectedItem.hbValue} g/dL
                    </Text>
                  ) : null}
                </View>

                {/* AI Result Card */}
                <View style={[styles.resultCard, { borderColor: getResultColor(selectedItem.result) }]}>
                  <Text style={styles.resultCardTitle}>Hasil Diagnosis AI</Text>
                  <View style={styles.badgeRow}>
                    <Text style={[styles.badgeText, { color: getResultColor(selectedItem.result) }]}>
                      Anemia {selectedItem.result === 'No Anemia' ? 'Negatif' : selectedItem.result}
                    </Text>
                    <Text style={styles.confidenceText}>Confidence: {selectedItem.confidence}%</Text>
                  </View>
                </View>

                {/* Question Details */}
                {selectedItem.result !== 'No Anemia' && selectedItem.answers && (
                  <View style={styles.answersSection}>
                    <Text style={styles.sectionLabel}>Jawaban Gejala Klinis</Text>
                    
                    <View style={styles.answerRow}><Text style={styles.qText}>Sering 5L (Lesu/Letih/Lemah/Lelah/Lalai)</Text><Text style={styles.aText}>{selectedItem.answers.q1 || 'Tidak'}</Text></View>
                    <View style={styles.answerRow}><Text style={styles.qText}>Sering pusing kepala berputar</Text><Text style={styles.aText}>{selectedItem.answers.q2 || 'Tidak'}</Text></View>
                    <View style={styles.answerRow}><Text style={styles.qText}>Kelopak mata dalam sangat pucat</Text><Text style={styles.aText}>{selectedItem.answers.q3 || 'Tidak'}</Text></View>
                    <View style={styles.answerRow}><Text style={styles.qText}>Sulit konsentrasi di kelas</Text><Text style={styles.aText}>{selectedItem.answers.q4 || 'Tidak'}</Text></View>
                    <View style={styles.answerRow}><Text style={styles.qText}>Mengantuk siang hari</Text><Text style={styles.aText}>{selectedItem.answers.q5 || 'Tidak'}</Text></View>
                    <View style={styles.answerRow}><Text style={styles.qText}>Kuku pucat/berbentuk sendok</Text><Text style={styles.aText}>{selectedItem.answers.q6 || 'Tidak'}</Text></View>
                    <View style={styles.answerRow}><Text style={styles.qText}>Sesak napas saat aktivitas ringan</Text><Text style={styles.aText}>{selectedItem.answers.q7 || 'Tidak'}</Text></View>
                  </View>
                )}

                {/* Recommendations */}
                <View style={styles.recommSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Info size={16} color="#0D9488" style={{ marginRight: 6 }} />
                    <Text style={styles.recommLabel}>Rekomendasi Medis:</Text>
                  </View>
                  <Text style={styles.recommText}>
                    {selectedItem.result === 'No Anemia' 
                      ? 'Kondisi sehat. Jaga pola makan bergizi dan lakukan skrining pencegahan berkala 6 bulan sekali.'
                      : selectedItem.result === 'Ringan'
                      ? 'Dianjurkan mengonsumsi Tablet Tambah Darah (TTD) 1 tablet per minggu, perbanyak bayam/daging merah, serta vitamin C.'
                      : selectedItem.result === 'Sedang'
                      ? 'Dianjurkan berkonsultasi dengan Puskesmas terdekat, meminum TTD secara rutin, dan lakukan evaluasi kadar Hb dalam 2 minggu.'
                      : '⚠️ KASUS KRITIS. Rujuk siswi ke Puskesmas segera untuk penanganan medis darurat dan tes laboratorium Hb lengkap.'
                    }
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
    marginBottom: 12,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  searchRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 195,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100,
    padding: 6,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#475569',
  },
  dropdownActiveText: {
    color: '#0D9488',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardInfoCol: {
    flex: 1,
    paddingRight: 10,
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  resultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  resultText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    backgroundColor: '#F0FDFA',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.8,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 24,
    paddingBottom: 40,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionValue: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
    fontWeight: '500',
  },
  resultCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
  },
  resultCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  answersSection: {
    marginBottom: 20,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  qText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
    paddingRight: 10,
  },
  aText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  recommSection: {
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  recommLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  recommText: {
    fontSize: 13,
    color: '#115E59',
    lineHeight: 18,
  },
});
