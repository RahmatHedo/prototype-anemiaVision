import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { getScreenings, saveHbInput } from '../../utils/storage';
import { PlusCircle, Search, CheckCircle2, ChevronRight, Activity, Beaker } from 'lucide-react-native';

export default function TbmInputScreen() {
  const [searchId, setSearchId] = useState('');
  const [foundStudent, setFoundStudent] = useState(null);
  const [hbValue, setHbValue] = useState('');
  const [screenings, setScreenings] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadScreenings = async () => {
    const data = await getScreenings();
    setScreenings(data);
  };

  useEffect(() => {
    loadScreenings();
    const interval = setInterval(loadScreenings, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (!searchId) {
      Alert.alert('Error', 'Silakan masukkan ID Anonim.');
      return;
    }
    const student = screenings.find(item => item.id.toLowerCase() === searchId.trim().toLowerCase());
    if (student) {
      setFoundStudent(student);
      setHbValue(student.hbValue ? student.hbValue.toString() : '');
    } else {
      Alert.alert('Tidak Ditemukan', `Siswa dengan ID ${searchId.toUpperCase()} tidak ditemukan dalam database.`);
      setFoundStudent(null);
    }
  };

  const handleSelectStudent = (student) => {
    setFoundStudent(student);
    setSearchId(student.id);
    setHbValue(student.hbValue ? student.hbValue.toString() : '');
  };

  const handleSubmit = async () => {
    if (!hbValue || isNaN(parseFloat(hbValue))) {
      Alert.alert('Error', 'Silakan masukkan nilai Hb yang valid (contoh: 11.5).');
      return;
    }

    const hbVal = parseFloat(hbValue);
    if (hbVal < 3.0 || hbVal > 22.0) {
      Alert.alert('Validasi Gagal', 'Nilai hemoglobin harus berkisar antara 3.0 hingga 22.0 g/dL.');
      return;
    }

    setSubmitting(true);
    setTimeout(async () => {
      try {
        await saveHbInput(foundStudent.id, hbValue);
        Alert.alert('Sukses', `Data Quik-Check Hb untuk ${foundStudent.id} berhasil disimpan di HP.`);
        
        // Reset form
        setFoundStudent(null);
        setSearchId('');
        setHbValue('');
        loadScreenings();
      } catch (e) {
        Alert.alert('Error', 'Gagal menyimpan data.');
      } finally {
        setSubmitting(false);
      }
    }, 1500); // 1.5s simulated submit
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Beaker size={26} color="#0D9488" />
          <Text style={styles.logoText}>Laboratorium TBMs</Text>
        </View>
        <Text style={styles.headerTitle}>Input Quik-Check Hb</Text>
        <Text style={styles.headerSubtitle}>Masukkan nilai Gold Standard hemoglobin untuk penalaan model AI.</Text>
      </View>

      {/* Search Student Section */}
      <View style={styles.searchCard}>
        <Text style={styles.cardLabel}>Cari ID Anonim Siswi:</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Contoh: AV-0010"
            placeholderTextColor="#94A3B8"
            value={searchId}
            onChangeText={setSearchId}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Search size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Suggestion list of pending Hb input students */}
        {screenings.filter(s => !s.hbValue).length > 0 && !foundStudent && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Menunggu Hasil Lab Hb:</Text>
            {screenings.filter(s => !s.hbValue).slice(0, 3).map(student => (
              <TouchableOpacity
                key={student.id}
                style={styles.suggestionItem}
                onPress={() => handleSelectStudent(student)}
              >
                <Text style={styles.suggestionText}>{student.id} ({student.result === 'No Anemia' ? 'Negatif' : `Anemia ${student.result}`})</Text>
                <ChevronRight size={14} color="#0D9488" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Hb Input Form (Shows only if student found) */}
      {foundStudent && (
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Informasi Siswi</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoName}>ID Anonim:</Text>
            <Text style={styles.infoVal}>{foundStudent.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoName}>Tanggal Skrining:</Text>
            <Text style={styles.infoVal}>{foundStudent.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoName}>Hasil Analisis Awal (AI):</Text>
            <Text style={[styles.infoVal, { fontWeight: 'bold', color: foundStudent.result === 'No Anemia' ? '#10B981' : '#EF4444' }]}>
              {foundStudent.result === 'No Anemia' ? 'Negatif' : `Anemia ${foundStudent.result}`}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Hb input fields */}
          <Text style={styles.inputLabel}>Masukkan Hasil Quik-Check Hb (g/dL):</Text>
          <View style={styles.hbInputContainer}>
            <TextInput
              style={styles.hbInput}
              placeholder="Contoh: 11.5"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={hbValue}
              onChangeText={setHbValue}
            />
            <Text style={styles.unitText}>g/dL</Text>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <PlusCircle size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Simpan Nilai Hb</Text>
              </>
            )}
          </TouchableOpacity>
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
    lineHeight: 18,
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
  suggestionsContainer: {
    marginTop: 18,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  suggestionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoName: {
    fontSize: 13,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  hbInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0D9488',
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDFA',
    marginBottom: 20,
  },
  hbInput: {
    flex: 1,
    height: 52,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  unitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D9488',
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
