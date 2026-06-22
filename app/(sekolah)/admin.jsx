import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, TextInput } from 'react-native';
import { getScreenings } from '../../utils/storage';
import { Settings, Cpu, RefreshCw, ShieldAlert, Award, Plus, UserPlus, Users } from 'lucide-react-native';

export default function AdminPanelScreen() {
  const [screenings, setScreenings] = useState([]);
  const [modelStats, setModelStats] = useState({
    accuracy: 88.6,
    version: 'v1.2.4',
    datasetSize: 1420
  });

  const [newPairsCount, setNewPairsCount] = useState(0);
  
  // Retraining States
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trainingLog, setTrainingLog] = useState('');

  // Add User State
  const [addUserModal, setAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('kader'); // 'kader', 'tbms'

  const loadData = async () => {
    const data = await getScreenings();
    setScreenings(data);
    
    // Count screenings that have BOTH a result and a TBM hbValue
    // These are eligible training pairs
    const pairs = data.filter(item => item.result && item.hbValue).length;
    setNewPairsCount(pairs);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRetrain = () => {
    if (newPairsCount === 0) {
      Alert.alert('Info', 'Tidak ada data pasangan baru (Foto + Kadar Hb Lab) untuk dipelajari.');
      return;
    }

    setTraining(true);
    setProgress(0);
    setTrainingLog('Menginisialisasi pipeline pelatihan...');

    // Progress bar simulation
    const logs = [
      'Memuat pasangan dataset dari penyimpanan terenkripsi...',
      'Mengekstrak fitur ROI foto konjungtiva...',
      'Melakukan normalisasi data klinis kuesioner...',
      'Melakukan fine-tuning layer CNN & retraining MLP...',
      'Mengevaluasi performa model dengan K-Fold Cross Validation...',
      'Akurasi baru dihitung. Menyimpan model ke penyimpanan aplikasi...'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 10;
        
        // Update logs based on progress thresholds
        if (next % 20 === 0 && currentLogIndex < logs.length) {
          setTrainingLog(logs[currentLogIndex]);
          currentLogIndex++;
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Training finished successfully
            setTraining(false);
            const accuracyIncrease = parseFloat((Math.random() * 0.8 + 0.2).toFixed(2));
            const newAccuracy = parseFloat((modelStats.accuracy + accuracyIncrease).toFixed(1));
            
            setModelStats(prev => ({
              ...prev,
              accuracy: newAccuracy,
              datasetSize: prev.datasetSize + newPairsCount
            }));
            setNewPairsCount(0);
            
            Alert.alert(
              'Pelatihan Selesai!',
              `Model AI berhasil di-retrain.\nAkurasi meningkat sebesar +${accuracyIncrease}% menjadi ${newAccuracy}%.\nVersi diperbarui ke v1.2.5.`
            );
          }, 500);
          return 100;
        }
        return next;
      });
    }, 400); // 4s total training time
  };

  const handleCreateUser = () => {
    if (!newUserName) {
      Alert.alert('Error', 'Silakan masukkan nama user.');
      return;
    }
    
    Alert.alert(
      'User Dibuat',
      `Akun baru untuk ${newUserName} sebagai ${newUserRole.toUpperCase()} berhasil dibuat. Kredensial masuk telah dikirim via SMS/UKS.`,
      [{ 
        text: 'OK', 
        onPress: () => {
          setAddUserModal(false);
          setNewUserName('');
        } 
      }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Cpu size={24} color="#0D9488" />
          <Text style={styles.logoText}>IT Admin Panel</Text>
        </View>
        <Text style={styles.headerTitle}>Manajemen Model AI</Text>
        <Text style={styles.headerSubtitle}>Tuning performa klasifikasi CNN & MLP secara semi-otomatis.</Text>
      </View>

      {/* Model Stats Panel */}
      <Text style={styles.sectionTitle}>Status Diagnostik AI</Text>
      <View style={styles.card}>
        <View style={styles.modelGrid}>
          <View style={styles.modelGridItem}>
            <Text style={styles.gridLabel}>Akurasi Saat Ini</Text>
            <Text style={styles.gridVal}>{modelStats.accuracy}%</Text>
          </View>
          <View style={styles.modelGridItem}>
            <Text style={styles.gridLabel}>Ukuran Dataset</Text>
            <Text style={styles.gridVal}>{modelStats.datasetSize}</Text>
          </View>
          <View style={styles.modelGridItem}>
            <Text style={styles.gridLabel}>Versi Model</Text>
            <Text style={styles.gridVal}>{modelStats.version}</Text>
          </View>
        </View>
      </View>

      {/* Fine-Tuning controls */}
      <Text style={styles.sectionTitle}>Fine-Tuning Berbasis Lapangan</Text>
      <View style={styles.card}>
        <Text style={styles.cardInfoText}>
          Setiap kali TBM memasukkan nilai hemoglobin (Hb Lab) untuk siswi yang telah diambil foto matanya oleh kader, pasangan data berlabel terkumpul untuk melatih ulang AI.
        </Text>
        
        <View style={styles.dataStatusRow}>
          <Text style={styles.dataStatusLabel}>Data latih baru siap pakai:</Text>
          <Text style={styles.dataStatusVal}>{newPairsCount} Pasang</Text>
        </View>

        <TouchableOpacity 
          style={[styles.retrainBtn, newPairsCount === 0 && styles.retrainBtnDisabled]}
          onPress={handleRetrain}
          disabled={training}
        >
          <RefreshCw size={16} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.retrainBtnText}>Mulai Pelatihan Ulang (Retrain)</Text>
        </TouchableOpacity>
      </View>

      {/* User Management mock section */}
      <Text style={styles.sectionTitle}>Manajemen Kader & TBMs</Text>
      <View style={styles.card}>
        <View style={styles.userRow}>
          <View>
            <Text style={styles.userCountText}>12 Kader Terdaftar</Text>
            <Text style={styles.userSubText}>Sekolah SMPN X Palembang</Text>
          </View>
          <TouchableOpacity style={styles.addUserBtn} onPress={() => setAddUserModal(true)}>
            <UserPlus size={16} color="#0D9488" style={{ marginRight: 6 }} />
            <Text style={styles.addUserBtnText}>Tambah</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Retraining Progress Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={training}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.trainingCard}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={styles.trainingTitle}>Mengeksekusi Fine-Tuning...</Text>
            
            {/* Progress bar line */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPct}>{progress}% Selesai</Text>
            
            {/* Log viewbox */}
            <View style={styles.logBox}>
              <Text style={styles.logText}>[SYSTEM LOG]: {trainingLog}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add User Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addUserModal}
        onRequestClose={() => setAddUserModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.addUserCard}>
            <View style={styles.addUserHeader}>
              <Text style={styles.addUserTitle}>Tambah Kader/TBM Baru</Text>
              <TouchableOpacity onPress={() => setAddUserModal(false)}>
                <Settings size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nama Lengkap:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Masukkan nama..."
              placeholderTextColor="#94A3B8"
              value={newUserName}
              onChangeText={setNewUserName}
            />

            <Text style={styles.inputLabel}>Pilih Role Akses:</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity 
                style={[styles.roleSelectBtn, newUserRole === 'kader' && styles.roleSelectBtnActive]}
                onPress={() => setNewUserRole('kader')}
              >
                <Text style={[styles.roleSelectText, newUserRole === 'kader' && styles.roleSelectTextActive]}>Kader Sekolah</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleSelectBtn, newUserRole === 'tbms' && styles.roleSelectBtnActive]}
                onPress={() => setNewUserRole('tbms')}
              >
                <Text style={[styles.roleSelectText, newUserRole === 'tbms' && styles.roleSelectTextActive]}>Tim TBMs (Lab)</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnCreate} onPress={handleCreateUser}>
              <Text style={styles.btnCreateText}>Buat Akun Baru</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 24,
    marginTop: 24,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modelGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modelGridItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  gridLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  gridVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D9488',
    marginTop: 6,
  },
  cardInfoText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16,
  },
  dataStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  dataStatusLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  dataStatusVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EAB308',
  },
  retrainBtn: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retrainBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  retrainBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  userSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addUserBtn: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addUserBtnText: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  trainingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  trainingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 20,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    width: '100%',
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 4,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 20,
  },
  logBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    minHeight: 60,
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#34D399',
    lineHeight: 14,
  },
  addUserCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  addUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addUserTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    marginBottom: 16,
    color: '#0F172A',
  },
  roleRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  roleSelectBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  roleSelectBtnActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  roleSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  roleSelectTextActive: {
    color: '#FFFFFF',
  },
  btnCreate: {
    backgroundColor: '#0D9488',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCreateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
